
import type { Env } from '../../types';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const db = env.DB;

  // 1. 验证用户登录状态
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {});

  const sessionId = cookies['session_id'];
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const session = await db.prepare('SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > ?')
    .bind(sessionId, new Date().toISOString())
    .first();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
  }

  const userId = session.user_id;

  const safeParseTags = (tags: string | null) => {
    if (!tags) return [];
    try { return JSON.parse(tags); } catch (e) { return []; }
  };

  try {
    // GET: 获取用户的收藏列表 (返回完整的 Attraction 对象数组)
    if (request.method === 'GET') {
      const { results } = await db.prepare(`
        SELECT a.*, f.note 
        FROM user_favorites f 
        JOIN attractions a ON f.attraction_id = a.id 
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
      `).bind(userId).all();

      const data = results?.map((a: any) => ({
        ...a,
        imageUrl: a.image_url,
        tags: safeParseTags(a.tags),
        note: a.note || '',
        coordinates: (a.lat && a.lng) ? { lat: a.lat, lng: a.lng } : undefined
      })) || [];
      
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    }

    // POST: 添加收藏 (可带备注)
    if (request.method === 'POST') {
      const { attractionId, note } = await request.json();
      if (!attractionId) return new Response(JSON.stringify({ error: 'Missing attractionId' }), { status: 400 });

      try {
          await db.prepare('INSERT INTO user_favorites (user_id, attraction_id, note) VALUES (?, ?, ?)')
            .bind(userId, attractionId, note || '')
            .run();
      } catch (e: any) {
          if (!e.message?.includes('UNIQUE') && !e.message?.includes('Constraint')) throw e;
      }
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    // PUT: 更新备注
    if (request.method === 'PUT') {
      const { attractionId, note } = await request.json();
      if (!attractionId) return new Response(JSON.stringify({ error: 'Missing attractionId' }), { status: 400 });

      await db.prepare('UPDATE user_favorites SET note = ? WHERE user_id = ? AND attraction_id = ?')
        .bind(note || '', userId, attractionId)
        .run();

      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    // DELETE: 取消收藏
    if (request.method === 'DELETE') {
      const { attractionId } = await request.json();
      if (!attractionId) return new Response(JSON.stringify({ error: 'Missing attractionId' }), { status: 400 });

      await db.prepare('DELETE FROM user_favorites WHERE user_id = ? AND attraction_id = ?')
        .bind(userId, attractionId)
        .run();

      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

  } catch (error: any) {
    console.error('Favorites API error:', error);
    return new Response(JSON.stringify({ error: 'Server error: ' + error.message }), { status: 500 });
  }
};
