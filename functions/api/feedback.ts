
import { Env, D1Database } from '../../types';

// 防恶意请求配置
const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 15,
  MAX_REQUEST_SIZE: 1024 * 10,
  ALLOWED_METHODS: ['POST', 'GET'],
  ALLOWED_CONTENT_TYPES: ['application/json'],
};

const getRateLimitKey = (ip: string) => {
  const now = new Date();
  const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
  return `${ip}-${minuteKey}`;
};

const initializeTables = async (db: D1Database): Promise<void> => {
  try {
    // 串行创建表，确保数据库初始化完整
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (err) {
    console.error('Failed to initialize D1 tables:', err);
  }
};

const checkRateLimit = async (ip: string, db: D1Database): Promise<boolean> => {
  const key = getRateLimitKey(ip);
  try {
    const result = await db.prepare('SELECT count FROM rate_limits WHERE key = ?').bind(key).first<{ count: number }>();
    if (result) {
      if (result.count >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE) return false;
      await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
    } else {
      await db.prepare('INSERT INTO rate_limits (key, count, created_at) VALUES (?, 1, ?)').bind(key, new Date().toISOString()).run();
    }
    return true;
  } catch (err) { 
    console.error('Rate limit check error:', err);
    return true; // 容错处理
  }
};

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '9'));
  const offset = (page - 1) * limit;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': RATE_LIMIT_CONFIG.ALLOWED_METHODS.join(','),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  try {
    await initializeTables(env.DB);

    // GET: 获取分页反馈列表
    if (request.method === 'GET') {
      const countResult = await env.DB.prepare('SELECT COUNT(*) as total FROM feedback').first<{ total: number }>();
      const total = countResult?.total || 0;

      const { results } = await env.DB.prepare(
        'SELECT content, created_at FROM feedback ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(limit, offset).all();

      return new Response(JSON.stringify({
        data: results,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }), { status: 200, headers: corsHeaders });
    }

    // POST: 提交反馈
    if (request.method === 'POST') {
      if (!await checkRateLimit(ip, env.DB)) {
        return new Response(JSON.stringify({ error: '请求太频繁，请稍后再试' }), { status: 429, headers: corsHeaders });
      }
      
      const { content } = await request.json() as { content: string };
      if (!content || typeof content !== 'string' || content.trim().length === 0 || content.length > 500) {
        return new Response(JSON.stringify({ error: '内容无效或过长' }), { status: 400, headers: corsHeaders });
      }

      await env.DB.prepare('INSERT INTO feedback (content) VALUES (?)').bind(content.trim()).run();
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  } catch (err: any) {
    console.error('Feedback API error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + err.message }), { status: 500, headers: corsHeaders });
  }
};
