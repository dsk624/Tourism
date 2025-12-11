# 安全措施文档

## 1. 防SQL注入

### 1.1 实施方法

1. **使用参数化查询**
   - 在所有后端API中，使用参数化查询代替字符串拼接
   - 示例（Hono + Cloudflare D1）：
     ```tsx
     // 安全的参数化查询
     const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
     
     // 不安全的字符串拼接（禁止使用）
     // const user = await db.prepare(`SELECT * FROM users WHERE email = '${email}'`).first();
     ```

2. **输入验证**
   - 在前端和后端都进行严格的输入验证
   - 对所有用户输入进行类型检查和格式验证
   - 示例：
     ```tsx
     // 邮箱格式验证
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(email)) {
       return c.json({ error: '请输入有效的邮箱地址' }, 400);
     }
     ```

3. **最小权限原则**
   - 为数据库用户分配最小必要权限
   - 仅允许执行必要的SQL操作

## 2. 防XSS攻击

### 2.1 实施方法

1. **React JSX转义**
   - React默认会对所有JSX内容进行转义，确保恶意脚本不会被执行
   - 示例：
     ```tsx
     // 安全的渲染方式（React自动转义）
     <div>{userInput}</div>
     
     // 不安全的渲染方式（禁止使用）
     // <div dangerouslySetInnerHTML={{ __html: userInput }}></div>
     ```

2. **内容安全策略（CSP）**
   - 在HTTP响应头中设置CSP，限制脚本执行来源
   - 示例：
     ```
     Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-scripts.com;
     ```

3. **输入过滤**
   - 对用户输入进行过滤，移除或转义特殊字符
   - 示例：
     ```tsx
     // 过滤HTML标签
     const sanitizedInput = userInput.replace(/<[^>]*>/g, '');
     ```

## 3. 防CSRF攻击

### 3.1 实施方法

1. **SameSite Cookies**
   - 设置Cookie的SameSite属性为Lax或Strict，防止跨站请求
   - 示例：
     ```tsx
     c.header('Set-Cookie', `session_id=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${expiresAt}`);
     ```

2. **HttpOnly Cookies**
   - 将会话ID等敏感信息存储在HttpOnly Cookie中，防止JavaScript访问
   - 示例：
     ```tsx
     c.header('Set-Cookie', `session_id=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/`);
     ```

3. **CSRF令牌**
   - 为每个表单请求添加CSRF令牌，验证请求来源
   - 示例：
     ```tsx
     // 生成CSRF令牌
     const csrfToken = uuidv4();
     // 存储在Session或Cookie中
     // 在表单中添加隐藏字段
     <input type="hidden" name="csrf_token" value={csrfToken} />
     // 在后端验证令牌
     if (req.body.csrf_token !== session.csrf_token) {
       return c.json({ error: 'CSRF验证失败' }, 403);
     }
     ```

## 4. 密码安全

### 4.1 实施方法

1. **密码哈希存储**
   - 使用SHA-256等强哈希算法，结合随机盐值存储密码
   - 示例：
     ```tsx
     const salt = uuidv4().slice(0, 16);
     const password_hash = createHash('sha256').update(password + salt).digest('hex') + ':' + salt;
     ```

2. **密码复杂度要求**
   - 要求密码至少8位，包含大小写字母、数字和特殊符号
   - 示例正则：
     ```tsx
     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
     ```

3. **禁止明文传输**
   - 使用HTTPS协议传输所有数据，包括密码
   - 在生产环境中强制使用HTTPS

## 5. 会话管理

### 5.1 实施方法

1. **会话过期**
   - 设置合理的会话过期时间（默认24小时，"记住我"30天）
   - 示例：
     ```tsx
     const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString();
     ```

2. **会话ID轮换**
   - 登录成功后生成新的会话ID
   - 防止会话固定攻击

3. **会话销毁**
   - 登出时销毁服务器端会话记录
   - 清除客户端Cookie
   - 示例：
     ```tsx
     // 销毁服务器端会话
     await db.prepare('DELETE FROM sessions WHERE session_id = ?').bind(sessionId).run();
     // 清除客户端Cookie
     c.header('Set-Cookie', 'session_id=; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
     ```

## 6. 访问控制

### 6.1 实施方法

1. **保护路由**
   - 使用React Router的路由保护机制，限制未认证用户访问敏感页面
   - 示例：
     ```tsx
     const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
       return isAuthenticated ? children : <Navigate to="/login" />;
     };
     ```

2. **最小权限原则**
   - 为不同用户角色分配不同权限
   - 仅允许用户访问其权限范围内的资源

## 7. 速率限制

### 7.1 实施方法

1. **登录尝试限制**
   - 限制连续失败登录尝试次数（5次）
   - 超过限制后锁定账户30分钟
   - 示例：
     ```tsx
     // 检查登录尝试次数
     if (user.login_attempts >= 5) {
       await db.prepare(`
         UPDATE users 
         SET account_locked = TRUE, lock_expires = ?
         WHERE id = ?
       `).bind(new Date(Date.now() + 30 * 60 * 1000).toISOString(), user.id).run();
       return c.json({ error: '账户已被锁定，请30分钟后重试' }, 401);
     }
     ```

2. **API请求限制**
   - 限制每个IP地址的API请求频率
   - 防止暴力攻击和DDoS攻击

## 8. 安全日志

### 8.1 实施方法

1. **记录关键操作**
   - 记录所有登录、登出、注册等关键操作
   - 记录操作时间、IP地址、用户信息等
   - 示例：
     ```tsx
     console.log(`用户登录: ${email}, IP: ${c.req.header('X-Forwarded-For') || c.req.ip}, 时间: ${new Date().toISOString()}`);
     ```

2. **监控异常行为**
   - 监控异常登录、多次失败尝试等行为
   - 及时发现和响应安全事件

## 9. 安全更新

### 9.1 实施方法

1. **定期更新依赖**
   - 定期更新所有依赖包，修复已知安全漏洞
   - 使用工具如`npm audit`或`yarn audit`检查依赖安全

2. **关注安全公告**
   - 关注Cloudflare、React、Hono等相关技术的安全公告
   - 及时应用安全补丁

## 10. 其他安全措施

1. **HTTPS加密**
   - 生产环境强制使用HTTPS
   - 配置HTTP严格传输安全（HSTS）

2. **敏感数据保护**
   - 不存储不必要的敏感数据
   - 对敏感数据进行加密存储

3. **安全的随机数生成**
   - 使用安全的随机数生成器生成密码盐、会话ID、验证令牌等
   - 示例：
     ```tsx
     import { v4 as uuidv4 } from 'uuid';
     const sessionId = uuidv4();
     ```

4. **错误信息处理**
   - 不向用户泄露详细的错误信息
   - 示例：
     ```tsx
     // 安全的错误处理
     try {
       // 数据库操作
     } catch (error) {
       console.error('数据库操作失败:', error);
       return c.json({ error: '操作失败，请稍后重试' }, 500);
     }
     ```
