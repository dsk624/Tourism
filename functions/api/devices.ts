import type { Env } from '../../types';

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const db = env.DB;

  // 验证用户是否已登录
  const sessionCookie = request.headers.get('Cookie')?.split(';').find(cookie => cookie.trim().startsWith('session_id='));
  if (!sessionCookie) {
    return new Response(JSON.stringify({ message: '未登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const sessionId = sessionCookie.split('=')[1].trim();
  const session = await db.prepare('SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > ?').bind(sessionId, new Date().toISOString()).first();
  if (!session) {
    return new Response(JSON.stringify({ message: '会话已过期' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const userId = session.user_id;

  try {
    switch (request.method) {
      case 'GET':
        // 获取用户设备列表
        const devices = await db.prepare(`
          SELECT ud.id, ud.device_name, ud.device_fingerprint, ud.is_trusted, ud.last_login_at, ud.created_at,
                 bf.user_agent, bf.screen_info, bf.browser_info
          FROM user_devices ud
          LEFT JOIN browser_fingerprints bf ON ud.device_fingerprint = bf.fingerprint_hash
          WHERE ud.user_id = ?
          ORDER BY ud.last_login_at DESC
        `).bind(userId).all();

        return new Response(JSON.stringify({ devices }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'PUT':
        // 更新设备信息（重命名或标记为可信）
        const { deviceId, deviceName, isTrusted } = await request.json();

        // 验证设备是否属于当前用户
        const device = await db.prepare('SELECT id FROM user_devices WHERE id = ? AND user_id = ?').bind(deviceId, userId).first();
        if (!device) {
          return new Response(JSON.stringify({ message: '设备不存在' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // 更新设备信息
        const updateFields = [];
        const updateValues = [];

        if (deviceName !== undefined) {
          updateFields.push('device_name = ?');
          updateValues.push(deviceName);
        }

        if (isTrusted !== undefined) {
          updateFields.push('is_trusted = ?');
          updateValues.push(isTrusted);
        }

        if (updateFields.length === 0) {
          return new Response(JSON.stringify({ message: '没有需要更新的字段' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        updateValues.push(deviceId);
        updateValues.push(userId);

        await db.prepare(`
          UPDATE user_devices
          SET ${updateFields.join(', ')}, updated_at = ?
          WHERE id = ? AND user_id = ?
        `).bind(...updateValues, new Date().toISOString()).run();

        return new Response(JSON.stringify({ message: '设备信息更新成功' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'DELETE':
        // 移除设备
        const { id } = await request.json();

        // 验证设备是否属于当前用户
        const deviceToDelete = await db.prepare('SELECT id FROM user_devices WHERE id = ? AND user_id = ?').bind(id, userId).first();
        if (!deviceToDelete) {
          return new Response(JSON.stringify({ message: '设备不存在' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // 删除设备
        await db.prepare('DELETE FROM user_devices WHERE id = ? AND user_id = ?').bind(id, userId).run();

        return new Response(JSON.stringify({ message: '设备移除成功' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(null, { status: 405 });
    }
  } catch (error) {
    console.error('设备管理API错误:', error);
    return new Response(JSON.stringify({ message: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
