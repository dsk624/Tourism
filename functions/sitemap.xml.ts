
import { Env } from '../types';

export const onRequest = async (context: any) => {
  const { env, request } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    // 获取所有景点 ID 以生成动态 URL
    const { results } = await db.prepare('SELECT id, updated_at FROM attractions').all();

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/login', priority: '0.5', changefreq: 'monthly' },
      { url: '/register', priority: '0.5', changefreq: 'monthly' },
      { url: '/profile', priority: '0.3', changefreq: 'private' }
    ];

    const staticUrls = staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');

    const dynamicUrls = results.map((item: any) => `
  <url>
    <loc>${baseUrl}/?id=${item.id}</loc>
    <lastmod>${new Date(item.updated_at || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrls}
  ${dynamicUrls}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400' // 缓存1天
      }
    });
  } catch (error) {
    return new Response('Error generating Sitemap', { status: 500 });
  }
};
