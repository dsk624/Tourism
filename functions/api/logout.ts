export const onRequestPost = async (context: any) => {
  const db = context.env.DB;
  const cookieHeader = context.request.headers.get('Cookie');
  
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
    }, {});
    
    const sessionId = cookies['session_id'];
    
    if (sessionId) {
        await db.prepare('DELETE FROM sessions WHERE session_id = ?').bind(sessionId).run();
    }
  }

  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  headers.append('Set-Cookie', 'session_id=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');

  return new Response(JSON.stringify({ success: true, message: '已安全退出' }), { headers });
};