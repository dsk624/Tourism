// 移除 uuid 库依赖
export const onRequest = async (context: any) => {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // Helper: Check Auth and Admin Status
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
    const session = await db.prepare('SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > ?').bind(sessionId, new Date().toISOString()).first();
    if (!session) return null;
    const user = await db.prepare('SELECT is_admin FROM users WHERE id = ?').bind(session.user_id).first();
    return user && user.is_admin ? user : null;
  };

  try {
    if (request.method === 'GET') {
      // List all attractions or get one
      if (id) {
         const attraction = await db.prepare('SELECT * FROM attractions WHERE id = ?').bind(id).first();
         if (!attraction) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
         // Parse tags
         attraction.tags = JSON.parse(attraction.tags || '[]');
         return new Response(JSON.stringify(attraction), { headers: { 'Content-Type': 'application/json' }});
      }
      
      const attractions = await db.prepare('SELECT * FROM attractions ORDER BY created_at DESC').all();
      const results = attractions.results?.map((a: any) => ({
        ...a,
        tags: JSON.parse(a.tags || '[]')
      })) || [];
      return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' }});
    }

    // Protected Routes (POST, PUT, DELETE)
    const admin = await getAdminUser();
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), { status: 403 });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      // 使用原生 crypto 生成 UUID
      const newId = crypto.randomUUID();
      const { name, province, description, imageUrl, tags, rating } = body;
      
      await db.prepare(
        'INSERT INTO attractions (id, name, province, description, image_url, tags, rating) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(newId, name, province, description, imageUrl, JSON.stringify(tags), rating).run();

      return new Response(JSON.stringify({ success: true, id: newId }), { headers: { 'Content-Type': 'application/json' }});
    }

    if (request.method === 'PUT') {
       if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400 });
       const body = await request.json();
       const { name, province, description, imageUrl, tags, rating } = body;

       await db.prepare(
         'UPDATE attractions SET name = ?, province = ?, description = ?, image_url = ?, tags = ?, rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
       ).bind(name, province, description, imageUrl, JSON.stringify(tags), rating, id).run();

       return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
    }

    if (request.method === 'DELETE') {
       if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400 });
       await db.prepare('DELETE FROM attractions WHERE id = ?').bind(id).run();
       return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
    }

    return new Response(null, { status: 405 });

  } catch (error: any) {
    console.error('Attraction API error:', error);
    return new Response(JSON.stringify({ error: 'Server Error: ' + error.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
};