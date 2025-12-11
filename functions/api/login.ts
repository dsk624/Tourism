import { v4 as uuidv4 } from 'uuid';
import type { Env } from '../../types';

// 使用Web Crypto API生成SHA-256哈希
async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const onRequest = async (context: any) => {
  const { request, env } = context;
  
  // 只允许POST请求
  if (request.method !== 'POST') {
    return new Response(null, { status: 405 });
  }
  
  try {
    const { email, password, rememberMe } = await request.json();
    const db = env.DB;

    // 查找用户
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) {
      return new Response(JSON.stringify({
        message: '邮箱或密码错误',
        errors: { general: '邮箱或密码错误' }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查账户是否被锁定
    if (user.account_locked) {
      const lockExpires = new Date(user.lock_expires);
      if (lockExpires > new Date()) {
        return new Response(JSON.stringify({
          message: `账户已被锁定，请${Math.ceil((lockExpires.getTime() - Date.now()) / 60000)}分钟后重试`,
          errors: { general: '账户已被锁定' }
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
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
    const inputHash = await generateHash(password + salt);
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

      return new Response(JSON.stringify({
        message: '邮箱或密码错误',
        errors: { general: '邮箱或密码错误' }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查邮箱是否已验证
    if (!user.email_verified) {
      return new Response(JSON.stringify({
        message: '请先验证邮箱',
        errors: { general: '邮箱未验证' }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
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
    return new Response(JSON.stringify({ message: '登录成功' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session_id=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${new Date(expiresAt).toUTCString()}`
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    return new Response(JSON.stringify({ message: '登录失败，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};