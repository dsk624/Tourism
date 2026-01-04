
export const onRequest = async (context: any) => {
  const { request } = context;
  
  // 从 Cloudflare 边缘节点获取地理位置请求头
  const city = request.headers.get('cf-ipcity');
  const province = request.headers.get('cf-region');
  const lat = request.headers.get('cf-iplatitude');
  const lng = request.headers.get('cf-iplongitude');

  // 如果关键的经纬度信息缺失，直接返回 404，告知前端定位不可用
  if (!lat || !lng) {
    return new Response(JSON.stringify({
      error: 'Location headers not found',
      message: 'Cloudflare edge headers missing or location unavailable'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    city: city ? decodeURIComponent(city) : '未知城市',
    province: province ? decodeURIComponent(province) : '',
    latitude: parseFloat(lat),
    longitude: parseFloat(lng),
    source: 'cloudflare-edge'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
