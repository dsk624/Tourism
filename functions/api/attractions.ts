import type { Env } from '../../types';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // 辅助函数：验证当前用户是否为管理员
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
    
    // 检查 Session 有效性
    const session = await db.prepare('SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > ?')
      .bind(sessionId, new Date().toISOString())
      .first();
      
    if (!session) return null;
    
    // 检查用户是否为管理员
    const user = await db.prepare('SELECT is_admin FROM users WHERE id = ?').bind(session.user_id).first();
    return user && user.is_admin ? user : null;
  };

  try {
    // === Public Route: GET ===
    if (request.method === 'GET') {
      if (id) {
         const attraction = await db.prepare('SELECT * FROM attractions WHERE id = ?').bind(id).first();
         if (!attraction) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
         
         const formatted = {
           ...attraction,
           imageUrl: attraction.image_url,
           tags: JSON.parse(attraction.tags as string || '[]')
         };
         
         return new Response(JSON.stringify(formatted), { headers: { 'Content-Type': 'application/json' }});
      }
      
      const attractions = await db.prepare('SELECT * FROM attractions ORDER BY created_at DESC').all();
      const results = attractions.results?.map((a: any) => ({
        ...a,
        imageUrl: a.image_url,
        tags: JSON.parse(a.tags || '[]')
      })) || [];
      
      return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' }});
    }

    // === Protected Routes: POST, PUT, DELETE (Admin Only) ===
    
    // 1. 权限检查
    const admin = await getAdminUser();
    if (!admin) {
      return new Response(JSON.stringify({ error: '权限不足：需要管理员权限' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. 处理 POST (新增)
    if (request.method === 'POST') {
      const body = await request.json();
      const newId = crypto.randomUUID();
      const { name, province, description, imageUrl, tags, rating } = body;
      
      if (!name || !province) {
         return new Response(JSON.stringify({ error: '名称和省份为必填项' }), { status: 400 });
      }

      // 严格的评分校验 (0-5)
      let finalRating = 5.0;
      // 检查 rating 是否存在且不为空字符串 (允许数字 0)
      if (rating !== undefined && rating !== null && String(rating).trim() !== '') {
          const r = Number(rating);
          if (isNaN(r) || r < 0 || r > 5) {
              return new Response(JSON.stringify({ error: '评分必须在 0 到 5 之间' }), { status: 400 });
          }
          finalRating = r;
      }

      await db.prepare(
        'INSERT INTO attractions (id, name, province, description, image_url, tags, rating) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        newId, 
        name, 
        province, 
        description || '', 
        imageUrl || '', 
        JSON.stringify(tags || []), 
        finalRating
      ).run();

      return new Response(JSON.stringify({ success: true, id: newId }), { headers: { 'Content-Type': 'application/json' }});
    }

    // 3. 处理 PUT (更新)
    if (request.method === 'PUT') {
       if (!id) return new Response(JSON.stringify({ error: 'ID 不能为空' }), { status: 400 });
       
       const body = await request.json();
       const { name, province, description, imageUrl, tags, rating } = body;

       // 评分校验
       let finalRating = rating;
       if (rating !== undefined && rating !== null && String(rating).trim() !== '') {
          const r = Number(rating);
          if (isNaN(r) || r < 0 || r > 5) {
               return new Response(JSON.stringify({ error: '评分必须在 0 到 5 之间' }), { status: 400 });
          }
          finalRating = r;
       }
       // 如果 finalRating 仍为 undefined (未传递), 且是 PUT 全量更新，可能导致 NULL 错误。
       // 假设前端在编辑模式下总是传递所有字段，如果 rating 为空，我们使用现有值或默认值。
       // 为了健壮性，如果 finalRating 无效（未传），我们可以选择不更新该字段（需要动态 SQL）或者设定一个默认值。
       // 根据 AdminModal 逻辑，提交时会带上所有字段。如果用户清空评分，finalRating 将在这里报错或被设为 default。
       // 此处我们假设如果前端传了 rating 字段，就必须是合法的。如果没有传，使用原值(这里全量更新会覆盖，所以必须传)。
       if (finalRating === undefined || finalRating === null) {
          // 如果没有传递评分，给一个默认值 0 或者保持原有逻辑(可能会报错如果数据库 NOT NULL)
          finalRating = 0; 
       }

       await db.prepare(
         'UPDATE attractions SET name = ?, province = ?, description = ?, image_url = ?, tags = ?, rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
       ).bind(
         name, 
         province, 
         description, 
         imageUrl, 
         JSON.stringify(tags), 
         finalRating, 
         id
       ).run();

       return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
    }

    // 4. 处理 DELETE (删除)
    if (request.method === 'DELETE') {
       if (!id) return new Response(JSON.stringify({ error: 'ID 不能为空' }), { status: 400 });
       
       await db.prepare('DELETE FROM attractions WHERE id = ?').bind(id).run();
       
       return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

  } catch (error: any) {
    console.error('Attraction API error:', error);
    return new Response(JSON.stringify({ error: 'Server Error: ' + error.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
};