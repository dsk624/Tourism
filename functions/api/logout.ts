import type { Env } from '../../types';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  
  // 只允许POST请求
  if (request.method !== 'POST') {
    return new Response(null, { status: 405 });
  }
  
  try {
    // 获取会话ID
    const sessionId = request.headers.get('Cookie')?.match(/session_id=([^;]+)/)?.[1];
    const db = env.DB;

    if (sessionId) {
      // 从数据库中删除会话
      await db.prepare('DELETE FROM sessions WHERE session_id = ?').bind(sessionId).run();
    }

    // 清除会话Cookie
    return new Response(JSON.stringify({ message: '登出成功' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'session_id=; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    });
  } catch (error) {
    console.error('登出失败:', error);
    return new Response(JSON.stringify({ message: '登出失败，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};