import type { Env } from '../../types';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  
  // 只允许GET请求
  if (request.method !== 'GET') {
    return new Response(null, { status: 405 });
  }
  
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) {
      return new Response('无效的验证链接', { status: 400 });
    }

    const db = env.DB;

    // 查找用户
    const user = await db.prepare('SELECT * FROM users WHERE verification_token = ?').bind(token).first();
    if (!user) {
      return new Response('无效的验证令牌', { status: 400 });
    }

    // 检查令牌是否过期
    const tokenExpires = new Date(user.verification_expires);
    if (tokenExpires < new Date()) {
      return new Response('验证令牌已过期', { status: 400 });
    }

    // 更新用户邮箱验证状态
    await db.prepare(`
      UPDATE users 
      SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL
      WHERE id = ?
    `).bind(user.id).run();

    return new Response('邮箱验证成功！您现在可以登录了', { status: 200 });
  } catch (error) {
    console.error('邮箱验证失败:', error);
    return new Response('邮箱验证失败，请稍后重试', { status: 500 });
  }
};