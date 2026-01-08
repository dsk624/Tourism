
import type { Env } from '../../types';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const db = env.DB;

  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {});

  const sessionId = cookies['session_id'];
  if (!sessionId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const session = await db.prepare('SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > ?')
    .bind(sessionId, new Date().toISOString())
    .first();

  if (!session) return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });

  const userId = session.user_id;

  try {
    if (request.method === 'GET') {
      const results = await db.prepare('SELECT * FROM user_schedules WHERE user_id = ? ORDER BY schedule_date ASC')
        .bind(userId).all();
      return new Response(JSON.stringify(results.results), { headers: { 'Content-Type': 'application/json' }});
    }

    if (request.method === 'POST') {
      const { title, schedule_date, description } = await request.json();
      if (!title || !schedule_date) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });

      await db.prepare('INSERT INTO user_schedules (user_id, title, schedule_date, description) VALUES (?, ?, ?, ?)')
        .bind(userId, title, schedule_date, description || '')
        .run();
      return new Response(JSON.stringify({ success: true }), { status: 201 });
    }

    if (request.method === 'DELETE') {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
      await db.prepare('DELETE FROM user_schedules WHERE id = ? AND user_id = ?').bind(id, userId).run();
      return new Response(JSON.stringify({ success: true }));
    }

    return new Response(null, { status: 405 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
