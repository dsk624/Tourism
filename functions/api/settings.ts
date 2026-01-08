import type { Env } from '../../types';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const db = env.DB;

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
      const { results } = await db.prepare('SELECT key, value FROM site_settings').all();
      const settings = results.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      return new Response(JSON.stringify(settings), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'PUT') {
      const admin = await getAdminUser();
      if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });

      const body = await request.json();
      const updates = Object.entries(body);

      for (const [key, value] of updates) {
        await db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP')
          .bind(key, value, value).run();
      }

      return new Response(JSON.stringify({ success: true }));
    }

    return new Response(null, { status: 405 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};