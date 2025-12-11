import { Hono } from 'hono';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

app.post('/api/login', async (c) => {
  try {
    const { email, password, rememberMe } = await c.req.json();
    const db = c.env.DB;

    // 查找用户
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) {
      return c.json({
        message: '邮箱或密码错误',
        errors: { general: '邮箱或密码错误' }
      }, 401);
    }

    // 检查账户是否被锁定
    if (user.account_locked) {
      const lockExpires = new Date(user.lock_expires);
      if (lockExpires > new Date()) {
        return c.json({
          message: `账户已被锁定，请${Math.ceil((lockExpires.getTime() - Date.now()) / 60000)}分钟后重试`,
          errors: { general: '账户已被锁定' }
        }, 401);
      } else {
        // 锁定时间已过，解锁账户
        await db.prepare(`
          UPDATE users 
          SET account_locked = FALSE, lock_expires = NULL, login_attempts = 0
          WHERE id = ?
        `).bind(user.id).run();
      }
    }

    // 验证密码
    const [storedHash, salt] = user.password_hash.split(':');
    const inputHash = createHash('sha256').update(password + salt).digest('hex');
    if (inputHash !== storedHash) {
      // 增加登录失败次数
      const newAttempts = user.login_attempts + 1;
      let accountLocked = false;
      let lockExpires = null;

      if (newAttempts >= 5) {
        // 锁定账户30分钟
        accountLocked = true;
        lockExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      }

      await db.prepare(`
        UPDATE users 
        SET login_attempts = ?, account_locked = ?, lock_expires = ?
        WHERE id = ?
      `).bind(newAttempts, accountLocked, lockExpires, user.id).run();

      return c.json({
        message: '邮箱或密码错误',
        errors: { general: '邮箱或密码错误' }
      }, 401);
    }

    // 检查邮箱是否已验证
    if (!user.email_verified) {
      return c.json({
        message: '请先验证邮箱',
        errors: { general: '邮箱未验证' }
      }, 401);
    }

    // 登录成功，重置登录尝试次数
    await db.prepare(`
      UPDATE users 
      SET login_attempts = 0, last_login = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), user.id).run();

    // 生成会话ID
    const sessionId = uuidv4();
    // 设置会话过期时间：24小时（默认）或30天（记住我）
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString();

    // 插入会话记录
    await db.prepare(`
      INSERT INTO sessions (session_id, user_id, expires_at)
      VALUES (?, ?, ?)
    `).bind(sessionId, user.id, expiresAt).run();

    // 设置会话Cookie
    c.header('Set-Cookie', `session_id=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${new Date(expiresAt).toUTCString()}`);

    return c.json({ message: '登录成功' });
  } catch (error) {
    console.error('登录失败:', error);
    return c.json({ message: '登录失败，请稍后重试' }, 500);
  }
});

export default app;