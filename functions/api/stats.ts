
import type { Env } from '../../types';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const db = env.DB;

  try {
    if (request.method === 'GET') {
      // 获取当前浏览量
      const stats = await db.prepare('SELECT value FROM site_stats WHERE key = ?').bind('total_views').first();
      return new Response(JSON.stringify({ views: stats?.value || 0 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'POST') {
      // 增加浏览量并返回新值
      // 使用原子操作更新
      await db.prepare('UPDATE site_stats SET value = value + 1, updated_at = CURRENT_TIMESTAMP WHERE key = ?')
        .bind('total_views')
        .run();
      
      const stats = await db.prepare('SELECT value FROM site_stats WHERE key = ?').bind('total_views').first();
      
      return new Response(JSON.stringify({ views: stats?.value || 0 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(null, { status: 405 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
