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
    const { username, password, rememberMe, browserFingerprint } = await request.json();
    const db = env.DB;

    // 获取客户端IP
    const ipAddress = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

    // 查找用户
    const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    if (!user) {
      // 记录登录失败历史
      await db.prepare(`
        INSERT INTO login_history (user_id, browser_fingerprint, ip_address, login_status)
        VALUES (?, ?, ?, ?)
      `).bind(null, 'invalid', ipAddress, 0).run();
      
      return new Response(JSON.stringify({
        message: '用户名或密码错误',
        errors: { general: '用户名或密码错误' }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查账户是否被锁定
    if (user.account_locked) {
      const lockExpires = new Date(user.locked_until);
      if (lockExpires > new Date()) {
        // 记录登录失败历史
        await db.prepare(`
          INSERT INTO login_history (user_id, browser_fingerprint, ip_address, login_status)
          VALUES (?, ?, ?, ?)
        `).bind(user.id, 'invalid', ipAddress, 0).run();
        
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
          SET account_locked = FALSE, locked_until = NULL, login_attempts = 0
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
      let lockedUntil = null;

      if (newAttempts >= 5) {
        // 锁定账户30分钟
        accountLocked = true;
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      }

      await db.prepare(`
        UPDATE users 
        SET login_attempts = ?, account_locked = ?, locked_until = ?
        WHERE id = ?
      `).bind(newAttempts, accountLocked, lockedUntil, user.id).run();

      // 记录登录失败历史
      await db.prepare(`
        INSERT INTO login_history (user_id, browser_fingerprint, ip_address, login_status)
        VALUES (?, ?, ?, ?)
      `).bind(user.id, 'invalid', ipAddress, 0).run();
      
      return new Response(JSON.stringify({
        message: '用户名或密码错误',
        errors: { general: '用户名或密码错误' }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 解析浏览器指纹数据
    let fingerprintData;
    let fingerprint_hash;
    try {
      fingerprintData = JSON.parse(atob(browserFingerprint));
      fingerprint_hash = await generateHash(browserFingerprint);
    } catch (parseError) {
      // 记录登录失败历史
      await db.prepare(`
        INSERT INTO login_history (user_id, browser_fingerprint, ip_address, login_status)
        VALUES (?, ?, ?, ?)
      `).bind(user.id, 'invalid', ipAddress, 0).run();
      
      return new Response(JSON.stringify({
        message: '浏览器指纹数据无效',
        errors: { browserFingerprint: '浏览器指纹数据无效' }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查指纹是否已存在于浏览器指纹表
    const existingFingerprint = await db.prepare('SELECT id FROM browser_fingerprints WHERE fingerprint_hash = ?').bind(fingerprint_hash).first();
    if (!existingFingerprint) {
      // 插入新的浏览器指纹信息
      await db.prepare(`
        INSERT INTO browser_fingerprints 
        (fingerprint_hash, user_agent, screen_info, browser_info, canvas_fingerprint, plugins_info)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        fingerprint_hash,
        fingerprintData.userAgent,
        `${fingerprintData.screenResolution}-${fingerprintData.colorDepth}`,
        `${fingerprintData.language}-${fingerprintData.timeZone}-${fingerprintData.platform}-${fingerprintData.hardwareConcurrency}`,
        fingerprintData.canvasFingerprint,
        `${fingerprintData.plugins}-${fingerprintData.mimeTypes}`
      ).run();
    }

    // 检查是否为可信设备
    const trustedDevice = await db.prepare('SELECT id, is_trusted FROM user_devices WHERE user_id = ? AND device_fingerprint = ?').bind(user.id, fingerprint_hash).first();
    let isNewDevice = false;
    let loginStatus = 1; // 默认登录成功

    if (!trustedDevice) {
      // 新设备登录，设置为需要验证
      isNewDevice = true;
      loginStatus = 2;
      
      // 解析用户代理，生成设备名称
      const userAgent = fingerprintData.userAgent;
      let deviceName = 'Unknown Device';
      
      if (userAgent.includes('Chrome')) {
        deviceName = 'Chrome on ' + (userAgent.includes('Windows') ? 'Windows' : 
                                     userAgent.includes('Mac') ? 'Mac' : 
                                     userAgent.includes('Linux') ? 'Linux' : 
                                     userAgent.includes('Android') ? 'Android' : 
                                     userAgent.includes('iOS') ? 'iOS' : 'Unknown OS');
      } else if (userAgent.includes('Firefox')) {
        deviceName = 'Firefox on ' + (userAgent.includes('Windows') ? 'Windows' : 
                                      userAgent.includes('Mac') ? 'Mac' : 
                                      userAgent.includes('Linux') ? 'Linux' : 
                                      userAgent.includes('Android') ? 'Android' : 
                                      userAgent.includes('iOS') ? 'iOS' : 'Unknown OS');
      } else if (userAgent.includes('Safari')) {
        deviceName = 'Safari on ' + (userAgent.includes('Mac') ? 'Mac' : 
                                     userAgent.includes('iOS') ? 'iOS' : 'Unknown OS');
      } else if (userAgent.includes('Edge')) {
        deviceName = 'Edge on ' + (userAgent.includes('Windows') ? 'Windows' : 
                                   userAgent.includes('Mac') ? 'Mac' : 'Unknown OS');
      }

      // 插入新设备记录，标记为不可信
      await db.prepare(`
        INSERT INTO user_devices (user_id, device_name, device_fingerprint, is_trusted)
        VALUES (?, ?, ?, ?)
      `).bind(user.id, deviceName, fingerprint_hash, 0).run();
    } else if (!trustedDevice.is_trusted) {
      // 已有设备但未被信任
      isNewDevice = true;
      loginStatus = 2;
    }

    // 登录成功，重置登录尝试次数
    await db.prepare(`
      UPDATE users 
      SET login_attempts = 0, updated_at = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), user.id).run();

    // 更新设备最后登录时间
    await db.prepare(`
      UPDATE user_devices 
      SET last_login_at = ?
      WHERE user_id = ? AND device_fingerprint = ?
    `).bind(new Date().toISOString(), user.id, fingerprint_hash).run();

    // 记录登录历史
    await db.prepare(`
      INSERT INTO login_history (user_id, browser_fingerprint, ip_address, login_status)
      VALUES (?, ?, ?, ?)
    `).bind(user.id, fingerprint_hash, ipAddress, loginStatus).run();

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
    const response = new Response(JSON.stringify({
      message: isNewDevice ? '新设备登录，需要验证' : '登录成功',
      isNewDevice: isNewDevice,
      userId: user.id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session_id=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${new Date(expiresAt).toUTCString()}`
      }
    });

    return response;
  } catch (error) {
    console.error('登录失败:', error);
    return new Response(JSON.stringify({ message: '登录失败，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};