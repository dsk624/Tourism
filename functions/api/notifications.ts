
import type { Env } from '../../types';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // 验证管理员权限的辅助函数
  const getAdminUser = async () => {
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
      .bind(sessionId, new Date().toISOString()).first();
    if (!session) return null;
    const user = await db.prepare('SELECT is_admin FROM users WHERE id = ?').bind(session.user_id).first();
    return user && user.is_admin ? user : null;
  };

  try {
    if (request.method === 'GET') {
      const all = url.searchParams.get('all') === 'true';
      let query = 'SELECT * FROM site_notifications ';
      if (!all) {
        query += 'WHERE is_active = 1 ';
      }
      query += 'ORDER BY priority DESC, created_at DESC';
      
      const { results } = await db.prepare(query).all();
      return new Response(JSON.stringify(results), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 后续操作需要管理员权限
    const admin = await getAdminUser();
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });

    if (request.method === 'POST') {
      const { content, priority } = await request.json();
      await db.prepare('INSERT INTO site_notifications (content, priority) VALUES (?, ?)')
        .bind(content, priority || 0).run();
      return new Response(JSON.stringify({ success: true }));
    }

    if (request.method === 'PUT') {
      const { is_active, priority } = await request.json();
      if (id) {
        await db.prepare('UPDATE site_notifications SET is_active = ?, priority = ? WHERE id = ?')
          .bind(is_active, priority, id).run();
        return new Response(JSON.stringify({ success: true }));
      }
    }

    if (request.method === 'DELETE') {
      if (id) {
        await db.prepare('DELETE FROM site_notifications WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ success: true }));
      }
    }

    return new Response(null, { status: 405 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
