import { Hono } from 'hono';
import type { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

app.post('/api/logout', async (c) => {
  try {
    // 获取会话ID
    const sessionId = c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
    const db = c.env.DB;

    if (sessionId) {
      // 从数据库中删除会话
      await db.prepare('DELETE FROM sessions WHERE session_id = ?').bind(sessionId).run();
    }

    // 清除会话Cookie
    c.header('Set-Cookie', 'session_id=; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');

    return c.json({ message: '登出成功' });
  } catch (error) {
    console.error('登出失败:', error);
    return c.json({ message: '登出失败，请稍后重试' }, 500);
  }
});

export default app;