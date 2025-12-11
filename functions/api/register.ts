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
    const { username, email, password } = await request.json();
    const db = env.DB;

    // 验证密码复杂度
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return new Response(JSON.stringify({
        message: '密码必须至少8位，包含大小写字母、数字和特殊符号',
        errors: { password: '密码格式不正确' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查用户名是否已存在
    const existingUsername = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existingUsername) {
      return new Response(JSON.stringify({
        message: '用户名已存在',
        errors: { username: '用户名已存在' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查邮箱是否已存在
    const existingEmail = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existingEmail) {
      return new Response(JSON.stringify({
        message: '邮箱已存在',
        errors: { email: '邮箱已存在' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成密码哈希
    const salt = uuidv4().slice(0, 16);
    const password_hash = await generateHash(password + salt) + ':' + salt;

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

    return new Response(JSON.stringify({ message: '注册成功，请查收邮箱验证邮件' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('注册失败:', error);
    return new Response(JSON.stringify({ message: '注册失败，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};