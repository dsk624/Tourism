import { onRequest as loginHandler } from '../../functions/api/login';
import { vi } from 'vitest';

// Mock uuid module
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-session-id')
}));

describe('Login API', () => {
  let mockDb: any;
  let mockRequest: any;
  let mockEnv: any;
  let mockContext: any;

  beforeEach(() => {
    // Mock database with proper fluent API handling
    mockDb = {
      prepare: vi.fn().mockImplementation((sql: string) => {
        const result = {
          sql,
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(),
          all: vi.fn(),
          run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } })
        };
        
        // Set up default mock behavior for first() based on SQL content
        result.first = vi.fn().mockImplementation(() => {
          if (result.sql.includes('SELECT * FROM users')) {
            return Promise.resolve({
              id: 1,
              username: 'testuser',
              password_hash: '01020304:salt',
              account_locked: false,
              login_attempts: 0
            });
          } else if (result.sql.includes('SELECT id FROM browser_fingerprints')) {
            return Promise.resolve({ id: 1 });
          } else if (result.sql.includes('SELECT id, is_trusted FROM user_devices')) {
            return Promise.resolve({ id: 1, is_trusted: true });
          }
          return Promise.resolve(null);
        });
        
        return result;
      }),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      all: vi.fn(),
      run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } })
    };

    // Mock request
    mockRequest = {
      method: 'POST',
      json: vi.fn().mockResolvedValue({
        username: 'testuser',
        password: 'Test@1234',
        rememberMe: false,
        browserFingerprint: 'test-fingerprint'
      }),
      headers: {
        get: vi.fn().mockReturnValue('127.0.0.1')
      }
    };

    // Mock environment
    mockEnv = {
      DB: mockDb
    };

    // Mock context
    mockContext = {
      request: mockRequest,
      env: mockEnv
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('returns 405 for non-POST requests', async () => {
    mockRequest.method = 'GET';
    const response = await loginHandler(mockContext);
    expect(response.status).toBe(405);
  });

  test('returns 401 for non-existent user', async () => {
    // Mock user not found
    mockDb.prepare.mockImplementation((sql: string) => {
      return {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } })
      };
    });

    const response = await loginHandler(mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toBe('用户名或密码错误');
  });

  test('returns 401 for locked account', async () => {
    // Mock locked user
    mockDb.prepare.mockImplementation((sql: string) => {
      return {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: 1,
          username: 'testuser',
          password_hash: 'hashedPassword:salt',
          account_locked: true,
          locked_until: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }),
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } })
      };
    });

    const response = await loginHandler(mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toContain('账户已被锁定');
  });

  test('returns 401 for invalid browser fingerprint', async () => {
    // Override default behavior for this test
    mockDb.prepare.mockImplementation((sql: string) => {
      const result = {
        sql,
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(),
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } })
      };
      
      // Set up specific mock behavior for this test
      result.first = vi.fn().mockImplementation(() => {
        if (result.sql.includes('SELECT * FROM users')) {
          return Promise.resolve({
            id: 1,
            username: 'testuser',
            password_hash: '01020304:salt',
            account_locked: false,
            login_attempts: 0
          });
        }
        return Promise.resolve(null);
      });
      
      return result;
    });

    // Mock atob to throw error for invalid browser fingerprint
    const originalAtob = global.atob;
    global.atob = vi.fn().mockImplementation(() => {
      throw new Error('Invalid base64');
    });

    const response = await loginHandler(mockContext);
    const data = await response.json();

    // Restore original atob
    global.atob = originalAtob;

    expect(response.status).toBe(401);
    expect(data.message).toBe('浏览器指纹数据无效');
  });

  test('returns success for valid login with trusted device', async () => {
    // Mock atob to return valid fingerprint data
    const originalAtob = global.atob;
    global.atob = vi.fn().mockReturnValue(JSON.stringify({
      userAgent: 'Mozilla/5.0',
      screenResolution: '1920x1080',
      colorDepth: 24,
      language: 'zh-CN',
      timeZone: 'Asia/Shanghai',
      platform: 'Win32',
      hardwareConcurrency: 8,
      plugins: 'plugin1,plugin2',
      mimeTypes: 'type1,type2',
      canvasFingerprint: 'test-canvas-fingerprint'
    }));

    const response = await loginHandler(mockContext);
    const data = await response.json();

    // Restore original atob
    global.atob = originalAtob;

    console.log('Login response:', response.status, data);
    expect(response.status).toBe(200);
    expect(data.message).toBe('登录成功');
    expect(data.isNewDevice).toBe(false);
  });

  test('returns new device status for untrusted device', async () => {
    // Override user_devices query to return null (new device)
    mockDb.prepare.mockImplementation((sql: string) => {
      const result = {
        sql,
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(),
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1 } })
      };
      
      // Set up specific mock behavior for this test
      result.first = vi.fn().mockImplementation(() => {
        if (result.sql.includes('SELECT * FROM users')) {
          return Promise.resolve({
            id: 1,
            username: 'testuser',
            password_hash: '01020304:salt',
            account_locked: false,
            login_attempts: 0
          });
        } else if (result.sql.includes('SELECT id FROM browser_fingerprints')) {
          return Promise.resolve({ id: 1 });
        } else if (result.sql.includes('SELECT id, is_trusted FROM user_devices')) {
          return Promise.resolve(null); // New device
        }
        return Promise.resolve(null);
      });
      
      return result;
    });

    // Mock atob to return valid fingerprint data
    const originalAtob = global.atob;
    global.atob = vi.fn().mockReturnValue(JSON.stringify({
      userAgent: 'Mozilla/5.0',
      screenResolution: '1920x1080',
      colorDepth: 24,
      language: 'zh-CN',
      timeZone: 'Asia/Shanghai',
      platform: 'Win32',
      hardwareConcurrency: 8,
      plugins: 'plugin1,plugin2',
      mimeTypes: 'type1,type2',
      canvasFingerprint: 'test-canvas-fingerprint'
    }));

    const response = await loginHandler(mockContext);
    const data = await response.json();

    // Restore original atob
    global.atob = originalAtob;

    expect(response.status).toBe(200);
    expect(data.message).toBe('新设备登录，需要验证');
    expect(data.isNewDevice).toBe(true);
  });
});
