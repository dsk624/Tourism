
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

  try {
    // GET: 获取用户的收藏列表 (返回 attraction_id 数组 和 note)
    if (request.method === 'GET') {
      // 尝试查询包含 note 的数据，如果表结构还没更新，可能会报错，这里假设已经更新
      try {
        const results = await db.prepare('SELECT attraction_id, note FROM user_favorites WHERE user_id = ?').bind(userId).all();
        // 返回格式: { favorites: string[], notes: Record<string, string> }
        const favorites = results.results?.map((r: any) => r.attraction_id) || [];
        const notes = results.results?.reduce((acc: any, r: any) => {
           if (r.note) acc[r.attraction_id] = r.note;
           return acc;
        }, {}) || {};
        
        return new Response(JSON.stringify({ favorites, notes }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        // Fallback for old schema
        const results = await db.prepare('SELECT attraction_id FROM user_favorites WHERE user_id = ?').bind(userId).all();
        const favorites = results.results?.map((r: any) => r.attraction_id) || [];
        return new Response(JSON.stringify({ favorites, notes: {} }), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    // POST: 添加收藏 (可带备注)
    if (request.method === 'POST') {
      const { attractionId, note } = await request.json();
      if (!attractionId) return new Response(JSON.stringify({ error: 'Missing attractionId' }), { status: 400 });

      // 检查是否已存在
      try {
          await db.prepare('INSERT INTO user_favorites (user_id, attraction_id, note) VALUES (?, ?, ?)')
            .bind(userId, attractionId, note || '')
            .run();
      } catch (e: any) {
          // 忽略唯一约束违反错误（重复收藏）
          if (!e.message?.includes('UNIQUE') && !e.message?.includes('Constraint')) {
              // 如果是因为 note 列不存在，尝试不带 note 插入
              try {
                await db.prepare('INSERT INTO user_favorites (user_id, attraction_id) VALUES (?, ?)')
                  .bind(userId, attractionId)
                  .run();
              } catch(innerE) {
                 if (!innerE.message?.includes('UNIQUE')) throw innerE;
              }
          }
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
