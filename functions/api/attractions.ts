
import type { Env } from '../../types';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  
  // 分页与搜索参数
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '9');
  const province = url.searchParams.get('province') || '全部';
  const search = url.searchParams.get('search') || '';
  const id = url.searchParams.get('id');

  const offset = (page - 1) * limit;

  // 辅助函数：验证管理员权限
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

  const safeParseTags = (tags: string | null) => {
    if (!tags) return [];
    try { return JSON.parse(tags); } catch (e) { return []; }
  };

  try {
    if (request.method === 'GET') {
      // 如果是请求详情
      if (id) {
        const attraction = await db.prepare('SELECT * FROM attractions WHERE id = ?').bind(id).first();
        if (!attraction) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
        return new Response(JSON.stringify({
          ...attraction,
          imageUrl: attraction.image_url,
          tags: safeParseTags(attraction.tags as string),
          coordinates: (attraction.lat && attraction.lng) ? { lat: attraction.lat, lng: attraction.lng } : undefined
        }), { headers: { 'Content-Type': 'application/json' }});
      }

      // 构建分页查询
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (province !== '全部') {
        whereClause += ' AND province = ?';
        params.push(province);
      }

      if (search) {
        whereClause += ' AND (name LIKE ? OR description LIKE ?)';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }

      // 1. 获取总数
      const countResult = await db.prepare(`SELECT COUNT(*) as total FROM attractions ${whereClause}`)
        .bind(...params).first();
      const total = countResult?.total || 0;

      // 2. 获取分页数据
      const query = `SELECT * FROM attractions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      const { results } = await db.prepare(query).bind(...params, limit, offset).all();

      const data = results?.map((a: any) => ({
        ...a,
        imageUrl: a.image_url,
        tags: safeParseTags(a.tags),
        coordinates: (a.lat && a.lng) ? { lat: a.lat, lng: a.lng } : undefined
      })) || [];

      return new Response(JSON.stringify({
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }), { headers: { 'Content-Type': 'application/json' }});
    }

    // 后续 POST/PUT/DELETE 逻辑保持不变，但需确保权限检查
    const admin = await getAdminUser();
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });

    if (request.method === 'POST') {
      const body = await request.json();
      const newId = crypto.randomUUID();
      const { name, province, description, imageUrl, tags, rating, coordinates } = body;
      await db.prepare('INSERT INTO attractions (id, name, province, description, image_url, tags, rating, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(newId, name, province, description, imageUrl, JSON.stringify(tags || []), rating, coordinates?.lat || null, coordinates?.lng || null).run();
      return new Response(JSON.stringify({ success: true, id: newId }));
    }

    if (request.method === 'PUT') {
      const body = await request.json();
      const { name, province, description, imageUrl, tags, rating, coordinates } = body;
      await db.prepare('UPDATE attractions SET name=?, province=?, description=?, image_url=?, tags=?, rating=?, lat=?, lng=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
        .bind(name, province, description, imageUrl, JSON.stringify(tags), rating, coordinates?.lat || null, coordinates?.lng || null, id).run();
      return new Response(JSON.stringify({ success: true }));
    }

    if (request.method === 'DELETE') {
      await db.prepare('DELETE FROM attractions WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }));
    }

    return new Response(null, { status: 405 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
