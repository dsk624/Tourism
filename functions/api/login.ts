// 移除 uuid 库依赖，使用原生 crypto
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHash === originalHash;
}

export const onRequestPost = async (context: any) => {
  try {
    const { username, password, fingerprint } = await context.request.json();
    const db = context.env.DB;

    // 1. 查询用户 (包含 is_admin)
    const user = await db.prepare('SELECT id, username, password_hash, account_locked, is_admin FROM users WHERE username = ?').bind(username).first();
    
    if (!user) {
      // 模拟延迟防止爆破
      await new Promise(r => setTimeout(r, 500)); 
      return new Response(JSON.stringify({ success: false, message: '用户名或密码错误' }), { status: 401 });
    }

    if (user.account_locked) {
       return new Response(JSON.stringify({ success: false, message: '账户已被锁定，请联系管理员' }), { status: 403 });
    }

    // 2. 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      // 增加错误尝试计数
      await db.prepare('UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?').bind(user.id).run();
      return new Response(JSON.stringify({ success: false, message: '用户名或密码错误' }), { status: 401 });
    }

    // 3. 登录成功：重置尝试次数
    await db.prepare('UPDATE users SET login_attempts = 0 WHERE id = ?').bind(user.id).run();

    // 4. 创建 Session (使用原生 crypto)
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7天过期

    await db.prepare(
      'INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, user.id, expiresAt).run();

    // 5. 记录/更新设备指纹
    if (fingerprint) {
        const device = await db.prepare('SELECT id FROM user_devices WHERE user_id = ? AND device_fingerprint = ?')
            .bind(user.id, fingerprint).first();
        
        if (device) {
            await db.prepare('UPDATE user_devices SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').bind(device.id).run();
        } else {
            // device_name is optional or needs to be passed, here we default if missing
            await db.prepare('INSERT INTO user_devices (user_id, device_fingerprint, device_name) VALUES (?, ?, ?)')
              .bind(user.id, fingerprint, 'Unknown Browser').run();
        }
    }

    // 6. 设置 HttpOnly Cookie
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Set-Cookie', `session_id=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: '登录成功',
      user: { id: user.id, username: user.username, isAdmin: !!user.is_admin }
    }), { 
      headers 
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: '系统错误: ' + (error.message || 'Unknown error') 
    }), { status: 500 });
  }
};