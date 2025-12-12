import type { Env } from '../../types';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const db = env.DB;

  try {
    // 1. 获取 Cookie
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) {
      return new Response(JSON.stringify({ authenticated: false }), {
        status: 200, // Return 200 with auth: false usually cleaner for frontend checks
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {});

    const sessionId = cookies['session_id'];
    if (!sessionId) {
      return new Response(JSON.stringify({ authenticated: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. 验证 Session
    const session = await db.prepare('SELECT user_id, expires_at FROM sessions WHERE session_id = ?').bind(sessionId).first();

    if (!session) {
      return new Response(JSON.stringify({ authenticated: false, message: 'Invalid session' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. 检查过期
    if (new Date(session.expires_at) < new Date()) {
      await db.prepare('DELETE FROM sessions WHERE session_id = ?').bind(sessionId).run();
      return new Response(JSON.stringify({ authenticated: false, message: 'Session expired' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. 获取用户信息
    const user = await db.prepare('SELECT id, username, is_admin FROM users WHERE id = ?').bind(session.user_id).first();
    
    if (!user) {
        return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
    }

    return new Response(JSON.stringify({ 
      authenticated: true, 
      user: { id: user.id, username: user.username, isAdmin: !!user.is_admin } 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Auth check error:', error);
    return new Response(JSON.stringify({ authenticated: false, message: 'Server error: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};