# Cloudflare D1 数据库设计

## 1. 数据库表结构

### 1.1 users 表

| 字段名 | 数据类型 | 约束条件 | 描述 |
|--------|----------|----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 用户唯一标识符 |
| username | TEXT | UNIQUE NOT NULL | 用户名 |
| email | TEXT | UNIQUE NOT NULL | 邮箱地址 |
| password_hash | TEXT | NOT NULL | 加密后的密码（格式：hash:salt） |
| email_verified | INTEGER | NOT NULL DEFAULT 0 | 邮箱验证状态（0：未验证，1：已验证） |
| verification_token | TEXT | NULL | 邮箱验证令牌 |
| verification_expires | DATETIME | NULL | 验证令牌过期时间 |
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
| user_id | INTEGER | NOT NULL REFERENCES users(id) | 关联的用户ID |
| expires_at | DATETIME | NOT NULL | 会话过期时间 |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | 会话创建时间 |

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
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    verification_token TEXT NULL,
    verification_expires DATETIME NULL,
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

## 3. 索引优化

为了提高查询性能，建议创建以下索引：

### 3.1 users表索引

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(verification_token);
```

### 3.2 sessions表索引

```sql
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
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
2. 邮箱验证机制确保用户提供的邮箱真实有效
3. 登录失败次数限制防止暴力破解
4. 会话过期机制确保用户登录状态安全
5. 外键约束确保数据完整性

## 6. 数据库维护

定期清理过期会话：

```sql
DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
```

定期清理过期的验证令牌：

```sql
UPDATE users SET verification_token = NULL, verification_expires = NULL WHERE verification_expires < CURRENT_TIMESTAMP AND email_verified = 0;
```
