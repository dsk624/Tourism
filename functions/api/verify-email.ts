import { Hono } from 'hono';
import type { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

app.get('/api/verify-email', async (c) => {
  try {
    const token = c.req.query('token');
    if (!token) {
      return c.text('无效的验证链接', 400);
    }

    const db = c.env.DB;

    // 查找用户
    const user = await db.prepare('SELECT * FROM users WHERE verification_token = ?').bind(token).first();
    if (!user) {
      return c.text('无效的验证令牌', 400);
    }

    // 检查令牌是否过期
    const tokenExpires = new Date(user.verification_expires);
    if (tokenExpires < new Date()) {
      return c.text('验证令牌已过期', 400);
    }

    // 更新用户邮箱验证状态
    await db.prepare(`
      UPDATE users 
      SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL
      WHERE id = ?
    `).bind(user.id).run();

    return c.text('邮箱验证成功！您现在可以登录了', 200);
  } catch (error) {
    console.error('邮箱验证失败:', error);
    return c.text('邮箱验证失败，请稍后重试', 500);
  }
});

export default app;