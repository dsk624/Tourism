import { Hono } from 'hono';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

app.post('/api/register', async (c) => {
  try {
    const { username, email, password } = await c.req.json();
    const db = c.env.DB;

    // 验证密码复杂度
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return c.json({
        message: '密码必须至少8位，包含大小写字母、数字和特殊符号',
        errors: { password: '密码格式不正确' }
      }, 400);
    }

    // 检查用户名是否已存在
    const existingUsername = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existingUsername) {
      return c.json({
        message: '用户名已存在',
        errors: { username: '用户名已存在' }
      }, 400);
    }

    // 检查邮箱是否已存在
    const existingEmail = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existingEmail) {
      return c.json({
        message: '邮箱已存在',
        errors: { email: '邮箱已存在' }
      }, 400);
    }

    // 生成密码哈希
    const salt = uuidv4().slice(0, 16);
    const password_hash = createHash('sha256').update(password + salt).digest('hex') + ':' + salt;

    // 生成验证令牌
    const verification_token = uuidv4();
    const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24小时过期

    // 插入用户数据
    await db.prepare(`
      INSERT INTO users (username, email, password_hash, verification_token, verification_expires)
      VALUES (?, ?, ?, ?, ?)
    `).bind(username, email, password_hash, verification_token, verification_expires).run();

    // 发送验证邮件（这里需要根据实际情况实现邮件发送逻辑）
    // sendVerificationEmail(email, verification_token);

    return c.json({ message: '注册成功，请查收邮箱验证邮件' });
  } catch (error) {
    console.error('注册失败:', error);
    return c.json({ message: '注册失败，请稍后重试' }, 500);
  }
});

export default app;