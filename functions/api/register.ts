import { v4 as uuidv4 } from 'uuid';

// 使用 Web Crypto API 进行加盐哈希
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const onRequestPost = async (context: any) => {
  try {
    const { username, password, fingerprint, deviceName } = await context.request.json();
    const db = context.env.DB;

    // 1. 基础验证
    if (!username || !password || username.length < 3 || password.length < 6) {
      return new Response(JSON.stringify({ success: false, message: '用户名至少3位，密码至少6位' }), { status: 400 });
    }

    // 2. 检查用户名是否存在
    const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existing) {
      return new Response(JSON.stringify({ success: false, message: '该用户名已被占用' }), { status: 409 });
    }

    // 3. 密码哈希
    const salt = crypto.randomUUID().replace(/-/g, '');
    const hashedPassword = await hashPassword(password, salt);
    const finalHash = `${salt}:${hashedPassword}`; // 存储格式: salt:hash

    // 4. 插入用户
    const result = await db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    ).bind(username, finalHash).run();

    if (!result.success) {
      throw new Error('Database insert failed');
    }
    
    // 获取新用户ID (D1的meta.last_row_id可能不稳定，这里为了保险再查一次，或者信任result.meta.last_row_id)
    const newUser = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();

    // 5. 记录设备指纹 (可选，用于安全风控)
    if (fingerprint && newUser) {
       await db.prepare(
        'INSERT INTO user_devices (user_id, device_fingerprint, device_name) VALUES (?, ?, ?)'
       ).bind(newUser.id, fingerprint, deviceName || 'Unknown Device').run();
    }

    return new Response(JSON.stringify({ success: true, message: '注册成功，请登录' }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Register error:', error);
    return new Response(JSON.stringify({ success: false, message: '服务器内部错误' }), { status: 500 });
  }
};