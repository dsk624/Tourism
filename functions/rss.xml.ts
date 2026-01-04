
import { Env } from '../types';

export const onRequest = async (context: any) => {
  const { env, request } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    // 从 D1 获取最新的景点
    const { results } = await db.prepare(
      'SELECT id, name, description, created_at FROM attractions ORDER BY created_at DESC LIMIT 20'
    ).all();

    const items = results.map((item: any) => `
      <item>
        <title><![CDATA[${item.name}]]></title>
        <link>${baseUrl}/?id=${item.id}</link>
        <description><![CDATA[${item.description}]]></description>
        <pubDate>${new Date(item.created_at).toUTCString()}</pubDate>
        <guid>${baseUrl}/?id=${item.id}</guid>
      </item>
    `).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>华夏游 | 发现锦绣中华</title>
    <link>${baseUrl}</link>
    <description>探索中华之美，寻访名山大川，最新的旅游景点介绍。</description>
    <language>zh-cn</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // 缓存1小时
      }
    });
  } catch (error) {
    return new Response('Error generating RSS', { status: 500 });
  }
};
