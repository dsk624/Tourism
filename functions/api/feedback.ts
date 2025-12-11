import { Env, PagesFunction, D1Database } from '../../types';

// 防恶意请求配置
const RATE_LIMIT_CONFIG = {
  // 每个IP每分钟最多允许的请求数
  MAX_REQUESTS_PER_MINUTE: 10,
  // 最大请求体大小（字节）
  MAX_REQUEST_SIZE: 1024 * 10, // 10KB
  // 允许的请求方法
  ALLOWED_METHODS: ['POST'],
  // 允许的内容类型
  ALLOWED_CONTENT_TYPES: ['application/json'],
};

// 生成速率限制键
const getRateLimitKey = (ip: string) => {
  const now = new Date();
  const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
  return `${ip}-${minuteKey}`;
};

// 创建rate_limits表（如果不存在）
const createRateLimitTable = async (db: D1Database): Promise<void> => {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
      )
    `).run();
  } catch (err) {
    console.error('Failed to create rate_limits table:', err);
    throw err;
  }
};

// 清理旧的速率限制记录（超过1小时的记录）
const cleanupOldRateLimits = async (db: D1Database): Promise<void> => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await db.prepare('DELETE FROM rate_limits WHERE created_at < ?')
      .bind(oneHourAgo)
      .run();
  } catch (err) {
    console.error('Failed to cleanup old rate limits:', err);
    // 清理失败不影响主要功能
  }
};

// 检查速率限制
const checkRateLimit = async (ip: string, db: D1Database): Promise<boolean> => {
  const key = getRateLimitKey(ip);
  
  try {
    // 确保表存在
    await createRateLimitTable(db);
    
    // 定期清理旧记录
    await cleanupOldRateLimits(db);
    
    // 查询当前IP在当前分钟的请求数
    const result = await db.prepare(
      'SELECT count FROM rate_limits WHERE key = ?'
    )
      .bind(key)
      .first<{ count: number }>();
    
    if (result) {
      // 如果已存在记录，检查是否超过限制
      if (result.count >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE) {
        return false;
      }
      // 更新请求数
      await db.prepare(
        'UPDATE rate_limits SET count = count + 1 WHERE key = ?'
      )
        .bind(key)
        .run();
    } else {
      // 插入新记录
      await db.prepare(
        'INSERT INTO rate_limits (key, count, created_at) VALUES (?, 1, ?)'
      )
        .bind(key, new Date().toISOString())
        .run();
    }
    
    return true;
  } catch (err) {
    console.error('Rate limit check failed:', err);
    // 发生错误时，为了不影响服务，允许请求通过
    return true;
  }
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  // 获取客户端IP地址
  const ip = request.headers.get('X-Forwarded-For')?.split(',')[0] || request.headers.get('CF-Connecting-IP') || 'unknown';
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': RATE_LIMIT_CONFIG.ALLOWED_METHODS.join(','),
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // 处理OPTIONS请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // 1. 验证请求方法
    if (!RATE_LIMIT_CONFIG.ALLOWED_METHODS.includes(request.method)) {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 2. 验证内容类型
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !RATE_LIMIT_CONFIG.ALLOWED_CONTENT_TYPES.some(type => contentType.includes(type))) {
      return new Response(JSON.stringify({ error: 'Invalid content type' }), {
        status: 415,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 3. 限制请求体大小
    const contentLength = request.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength) > RATE_LIMIT_CONFIG.MAX_REQUEST_SIZE) {
      return new Response(JSON.stringify({ error: 'Request body too large' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 4. 检查速率限制
    const isAllowed = await checkRateLimit(ip, env.DB);
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Too many requests, please try again later' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 5. 验证请求数据
    const { content } = await request.json() as { content: string };
    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Content is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 6. 验证内容长度
    if (content.length > 1000) {
      return new Response(JSON.stringify({ error: 'Content too long, maximum 1000 characters allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert into D1 database
    const result = await env.DB.prepare(
      'INSERT INTO feedback (content) VALUES (?)'
    )
      .bind(content)
      .run();

    if (result.success) {
      return new Response(JSON.stringify({ success: true, meta: result.meta }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error('Database insertion failed');
    }
  } catch (err: any) {
    // 处理JSON解析错误
    if (err.name === 'SyntaxError') {
      return new Response(JSON.stringify({ error: 'Invalid JSON format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
