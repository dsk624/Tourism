# Cloudflare D1 数据库设计

## 1. 数据库表结构

### 1.1 users 表

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 用户唯一标识符 |
| username | TEXT | UNIQUE NOT NULL | 用户名 |
| password_hash | TEXT | NOT NULL | 加密后的密码（格式：hash:salt） |
| login_attempts | INTEGER | NOT NULL DEFAULT 0 | 登录失败次数 |
| account_locked | INTEGER | NOT NULL DEFAULT 0 | 账户锁定状态（0：未锁定，1：已锁定） |
| locked_until | DATETIME | NULL | 账户锁定截止时间 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 用户创建时间 |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 用户信息更新时间 |

### 1.2 sessions 表

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 会话唯一标识符 |
| session_id | TEXT | UNIQUE NOT NULL | 会话ID（UUID格式） |
| user_id | INTEGER | NOT NULL REFERENCES users(id) ON DELETE CASCADE | 关联的用户ID |
| expires_at | DATETIME | NOT NULL | 会话过期时间 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 会话创建时间 |

### 1.3 user_devices 表

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 设备记录唯一标识符 |
| user_id | INTEGER | NOT NULL REFERENCES users(id) ON DELETE CASCADE | 关联的用户ID |
| device_name | TEXT | NOT NULL | 设备名称（如：Chrome on Windows） |
| device_fingerprint | TEXT | NOT NULL | 设备指纹（关联browser_fingerprints表） |
| is_trusted | INTEGER | NOT NULL DEFAULT 1 | 是否为可信设备（0：不可信，1：可信） |
| last_login_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 最后登录时间 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 设备记录创建时间 |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 设备记录更新时间 |

### 1.4 browser_fingerprints 表

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 指纹记录唯一标识符 |
| fingerprint_hash | TEXT | UNIQUE NOT NULL | 加密后的浏览器指纹 |
| user_agent | TEXT | NOT NULL | 用户代理字符串 |
| screen_info | TEXT | NOT NULL | 屏幕信息（分辨率、色深等） |
| browser_info | TEXT | NOT NULL | 浏览器信息（语言、时区等） |
| canvas_fingerprint | TEXT | NOT NULL | Canvas指纹 |
| plugins_info | TEXT | NOT NULL | 插件信息 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 指纹记录创建时间 |
| updated_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 指纹记录更新时间 |

### 1.5 login_history 表

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 登录历史唯一标识符 |
| user_id | INTEGER | NOT NULL REFERENCES users(id) ON DELETE CASCADE | 关联的用户ID |
| browser_fingerprint | TEXT | NOT NULL | 登录设备指纹 |
| ip_address | TEXT | NOT NULL | 登录IP地址 |
| login_status | INTEGER | NOT NULL | 登录状态（0：失败，1：成功，2：新设备） |
| login_time | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 登录时间 |
| location | TEXT | NULL | 登录地理位置（可选） |

## 2. 数据库创建流程

### 2.1 通过Cloudflare控制面板创建D1数据库

1. 登录Cloudflare控制台，进入「Workers & Pages」页面
2. 在左侧导航栏中选择「D1」
3. 点击「Create database」按钮
4. 填写数据库名称（如：`user-auth-db`）
5. 选择一个数据中心位置
6. 点击「Create」按钮创建数据库

### 2.2 创建users表

1. 在D1数据库列表中，点击刚创建的数据库名称
2. 进入「Query」标签页
3. 在查询编辑器中输入以下SQL语句：

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    login_attempts INTEGER NOT NULL DEFAULT 0,
    account_locked INTEGER NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

4. 点击「Run」按钮执行SQL语句
5. 验证表创建成功：在「Tables」标签页中可以看到users表

### 2.3 创建sessions表

1. 同样在「Query」标签页
2. 在查询编辑器中输入以下SQL语句：

```sql
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

3. 点击「Run」按钮执行SQL语句
4. 验证表创建成功：在「Tables」标签页中可以看到sessions表

### 2.4 创建user_devices表

1. 同样在「Query」标签页
2. 在查询编辑器中输入以下SQL语句：

```sql
CREATE TABLE IF NOT EXISTS user_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    device_fingerprint TEXT NOT NULL,
    is_trusted INTEGER NOT NULL DEFAULT 1,
    last_login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

3. 点击「Run」按钮执行SQL语句
4. 验证表创建成功：在「Tables」标签页中可以看到user_devices表

### 2.5 创建browser_fingerprints表

1. 同样在「Query」标签页
2. 在查询编辑器中输入以下SQL语句：

```sql
CREATE TABLE IF NOT EXISTS browser_fingerprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fingerprint_hash TEXT UNIQUE NOT NULL,
    user_agent TEXT NOT NULL,
    screen_info TEXT NOT NULL,
    browser_info TEXT NOT NULL,
    canvas_fingerprint TEXT NOT NULL,
    plugins_info TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

3. 点击「Run」按钮执行SQL语句
4. 验证表创建成功：在「Tables」标签页中可以看到browser_fingerprints表

### 2.6 创建login_history表

1. 同样在「Query」标签页
2. 在查询编辑器中输入以下SQL语句：

```sql
CREATE TABLE IF NOT EXISTS login_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    browser_fingerprint TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    login_status INTEGER NOT NULL,
    login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location TEXT NULL
);
```

3. 点击「Run」按钮执行SQL语句
4. 验证表创建成功：在「Tables」标签页中可以看到login_history表

## 3. 索引优化

为了提高查询性能，建议创建以下索引：

### 3.1 users表索引

```sql
CREATE INDEX idx_users_username ON users(username);
```

### 3.2 sessions表索引

```sql
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

### 3.3 user_devices表索引

```sql
CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_fingerprint ON user_devices(device_fingerprint);
CREATE INDEX idx_user_devices_trusted ON user_devices(is_trusted);
```

### 3.4 browser_fingerprints表索引

```sql
CREATE INDEX idx_browser_fingerprints_hash ON browser_fingerprints(fingerprint_hash);
CREATE INDEX idx_browser_fingerprints_created ON browser_fingerprints(created_at);
```

### 3.5 login_history表索引

```sql
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_fingerprint ON login_history(browser_fingerprint);
CREATE INDEX idx_login_history_time ON login_history(login_time);
CREATE INDEX idx_login_history_status ON login_history(login_status);
```

## 4. 数据类型说明

- `INTEGER`：整数类型，用于自增主键和计数器
- `TEXT`：文本类型，用于存储字符串数据
- `DATETIME`：日期时间类型，用于存储时间戳
- `PRIMARY KEY`：主键约束，确保记录唯一性
- `UNIQUE`：唯一约束，确保字段值不重复
- `NOT NULL`：非空约束，确保字段值不为空
- `DEFAULT`：默认值，当插入记录时未提供该字段值时使用
- `REFERENCES`：外键约束，建立表间关联

## 5. 安全考虑

1. 密码不存储明文，使用SHA-256算法加盐哈希存储
2. 浏览器指纹信息使用SHA-256不可逆加密存储，确保设备信息安全
3. 登录失败次数限制防止暴力破解
4. 会话过期机制确保用户登录状态安全
5. 外键约束确保数据完整性
6. 三重身份验证（用户名、密码、浏览器指纹）提高账户安全性
7. 新设备登录检测机制，增强账户保护
8. TLS加密传输确保敏感数据在传输过程中的安全

## 6. 数据库维护

定期清理过期会话：

```sql
DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
```
