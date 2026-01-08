
import { Env, D1Database } from '../../types';

const RATE_LIMIT_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 15,
  ALLOWED_METHODS: ['POST', 'GET'],
};

const getRateLimitKey = (ip: string) => {
  const now = new Date();
  return `${ip}-${now.getMinutes()}`;
};

const getUserIdFromCookie = async (request: Request, db: D1Database): Promise<number | null> => {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {});
  const sessionId = cookies['session_id'];
  if (!sessionId) return null;
  const session = await db.prepare('SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > ?')
    .bind(sessionId, new Date().toISOString()).first<{ user_id: number }>();
  return session?.user_id || null;
};

const checkRateLimit = async (ip: string, db: D1Database): Promise<boolean> => {
  const key = getRateLimitKey(ip);
  const result = await db.prepare('SELECT count FROM rate_limits WHERE key = ?').bind(key).first<{ count: number }>();
  if (result) {
    if (result.count >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_MINUTE) return false;
    await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  } else {
    await db.prepare('INSERT INTO rate_limits (key, count, created_at) VALUES (?, 1, ?)').bind(key, new Date().toISOString()).run();
  }
  return true;
};

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '9'));
  const offset = (page - 1) * limit;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  try {
    if (request.method === 'GET') {
      const countResult = await env.DB.prepare('SELECT COUNT(*) as total FROM feedback').first<{ total: number }>();
      const total = countResult?.total || 0;

      const { results } = await env.DB.prepare(`
        SELECT f.content, f.created_at, u.username 
        FROM feedback f 
        LEFT JOIN users u ON f.user_id = u.id 
        ORDER BY f.created_at DESC 
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all();

      return new Response(JSON.stringify({
        data: results,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }), { status: 200, headers: corsHeaders });
    }

    if (request.method === 'POST') {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (!await checkRateLimit(ip, env.DB)) {
        return new Response(JSON.stringify({ error: '请求太频繁' }), { status: 429, headers: corsHeaders });
      }
      
      const body = await request.json() as any;
      const content = body?.content;

      if (!content || typeof content !== 'string') {
        return new Response(JSON.stringify({ error: '反馈内容不能为空' }), { status: 400, headers: corsHeaders });
      }

      const userId = await getUserIdFromCookie(request, env.DB);

      if (!userId) {
        return new Response(JSON.stringify({ error: '请先登录后再提交反馈' }), { status: 401, headers: corsHeaders });
      }

      await env.DB.prepare('INSERT INTO feedback (content, user_id) VALUES (?, ?)')
        .bind(content.trim(), userId).run();
        
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
};
