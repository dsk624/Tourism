
export const onRequest = async (context: any) => {
  const { request } = context;
  
  // Cloudflare 会在请求头中自动注入地理位置信息（基于 IP）
  // 这些信息对于天气预报来说精度已经足够，且无需用户授权
  const city = decodeURIComponent(request.headers.get('cf-ipcity') || '开封');
  const province = decodeURIComponent(request.headers.get('cf-region') || '河南');
  const lat = request.headers.get('cf-iplatitude') || '34.7973';
  const lng = request.headers.get('cf-iplongitude') || '114.3076';

  return new Response(JSON.stringify({
    city: city,
    province: province,
    latitude: parseFloat(lat),
    longitude: parseFloat(lng),
    source: 'cloudflare-edge'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600' // 缓存 1 小时
    }
  });
};
