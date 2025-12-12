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
    const { username, password, browserFingerprint } = await request.json();
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

    // 解析浏览器指纹数据
    let fingerprintData;
    try {
      fingerprintData = JSON.parse(atob(browserFingerprint));
    } catch (parseError) {
      return new Response(JSON.stringify({
        message: '浏览器指纹数据无效',
        errors: { browserFingerprint: '浏览器指纹数据无效' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成密码哈希
    const salt = uuidv4().slice(0, 16);
    const password_hash = await generateHash(password + salt) + ':' + salt;

    // 生成指纹哈希
    const fingerprint_hash = await generateHash(browserFingerprint);

    // 开始事务
    await db.prepare('BEGIN TRANSACTION').run();

    try {
      // 插入用户数据
      const userResult = await db.prepare(`
        INSERT INTO users (username, password_hash)
        VALUES (?, ?)
      `).bind(username, password_hash).run();

      const userId = userResult.meta.last_row_id;

      // 插入浏览器指纹信息
      await db.prepare(`
        INSERT OR IGNORE INTO browser_fingerprints 
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

      // 插入用户设备信息
      await db.prepare(`
        INSERT INTO user_devices (user_id, device_name, device_fingerprint)
        VALUES (?, ?, ?)
      `).bind(
        userId,
        deviceName,
        fingerprint_hash
      ).run();

      // 提交事务
      await db.prepare('COMMIT').run();

      return new Response(JSON.stringify({ message: '注册成功' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (transactionError) {
      // 回滚事务
      await db.prepare('ROLLBACK').run();
      throw transactionError;
    }
  } catch (error) {
    console.error('注册失败:', error);
    return new Response(JSON.stringify({ message: '注册失败，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};