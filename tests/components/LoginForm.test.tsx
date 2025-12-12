import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../../components/LoginForm';
import { vi } from 'vitest';

describe('LoginForm Component', () => {
  // Store original useState to restore in afterEach
  let originalUseState: typeof React.useState;

  beforeEach(() => {
    // Mock fetch API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ message: '登录成功' })
    }) as any;
    
    // Mock grecaptcha object on window
    (window as any).grecaptcha = {
      execute: vi.fn().mockResolvedValue('mock-captcha-token'),
      reset: vi.fn()
    };
    
    // Mock btoa and atob for fingerprint generation
    global.btoa = vi.fn().mockReturnValue('mock-fingerprint');
    global.atob = vi.fn().mockReturnValue(JSON.stringify({ 
      userAgent: 'Mozilla/5.0',
      screenResolution: '1920x1080',
      colorDepth: '24',
      language: 'zh-CN',
      timeZone: 'Asia/Shanghai',
      platform: 'MacIntel',
      hardwareConcurrency: '8',
      canvasFingerprint: 'mock-canvas',
      plugins: 'plugin1,plugin2',
      mimeTypes: 'type1,type2'
    }));
    
    // No need to mock canvas creation as we're mocking btoa directly
    
    // Mock useState to set captchaLoaded to true by default
    const originalUseState = React.useState;
    let callCount = 0;
    React.useState = vi.fn((initialState: any) => {
      callCount++;
      // captchaLoaded is the 7th useState call in LoginForm component
      if (callCount === 7 && initialState === false) {
        return [true, vi.fn()];
      }
      return originalUseState(initialState);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original React.useState
    React.useState = originalUseState;
  });

  test('renders login form correctly', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/用户名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
  });

  test('validates required fields', () => {
    render(<LoginForm />);
    
    const loginButton = screen.getByRole('button', { name: /登录/i });
    fireEvent.click(loginButton);
    
    expect(screen.getByText(/用户名不能为空/i)).toBeInTheDocument();
    expect(screen.getByText(/密码不能为空/i)).toBeInTheDocument();
  });

  test('submits form with valid data and captcha', async () => {
    render(<LoginForm testCaptchaLoaded={true} />);
    
    fireEvent.change(screen.getByLabelText(/用户名/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/密码/i), { target: { value: 'Test@1234' } });
    
    const loginButton = screen.getByRole('button', { name: /登录/i });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String)
      }));
      
      // Get the actual fetch call and verify the body content
      const fetchCall = global.fetch as any;
      const callArgs = fetchCall.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.username).toBe('testuser');
      expect(requestBody.password).toBe('Test@1234');
      expect(requestBody.captchaToken).toBe('mock-captcha-token');
    });
  });

  test('shows error message when captcha fails', async () => {
    // Mock grecaptcha.execute to return empty token
    (window.grecaptcha as any).execute = vi.fn().mockResolvedValue('');
    
    render(<LoginForm />);
    
    fireEvent.change(screen.getByLabelText(/用户名/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/密码/i), { target: { value: 'Test@1234' } });
    
    const loginButton = screen.getByRole('button', { name: /登录/i });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText(/人机验证失败，请重试/i)).toBeInTheDocument();
    });
  });

  test('displays loading state when submitting', async () => {
    // Mock fetch to be slow
    global.fetch = vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({ message: '登录成功' })
          });
        }, 500);
      });
    }) as any;
    
    render(<LoginForm testCaptchaLoaded={true} />);
    
    fireEvent.change(screen.getByLabelText(/用户名/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/密码/i), { target: { value: 'Test@1234' } });
    
    const loginButton = screen.getByRole('button', { name: /登录/i });
    fireEvent.click(loginButton);
    
    // Use waitFor to handle asynchronous state updates
    await waitFor(() => {
      expect(loginButton).toBeDisabled();
      expect(screen.getByText(/登录中/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
