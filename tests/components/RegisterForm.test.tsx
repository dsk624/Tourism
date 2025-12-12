import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterForm from '../../components/RegisterForm';
import { vi } from 'vitest';

describe('RegisterForm Component', () => {
  beforeEach(() => {
    // Mock fetch API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ message: '注册成功' })
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
    
    // No need to mock canvas creation as we're mocking btoa directly for fingerprint generation
    
    // Mock useState to set captchaLoaded to true by default
    const originalUseState = React.useState;
    let callCount = 0;
    React.useState = vi.fn((initialState: any) => {
      callCount++;
      // captchaLoaded is the 7th useState call in RegisterForm component
      if (callCount === 7 && initialState === false) {
        return [true, vi.fn()];
      }
      return originalUseState(initialState);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original React.useState
    React.useState = require('react').useState;
  });

  test('renders register form correctly', () => {
    render(<RegisterForm />);
    
    expect(screen.getByLabelText(/用户名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^密码$/i)).toBeInTheDocument(); // 精确匹配"密码"，不包含"确认密码"
    expect(screen.getByLabelText(/确认密码/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /注册/i })).toBeInTheDocument();
  });

  test('validates required fields', () => {
    render(<RegisterForm />);
    
    const registerButton = screen.getByRole('button', { name: /注册/i });
    fireEvent.click(registerButton);
    
    expect(screen.getByText(/用户名不能为空/i)).toBeInTheDocument();
    expect(screen.getByText(/密码不能为空/i)).toBeInTheDocument();
    expect(screen.getByText(/请确认密码/i)).toBeInTheDocument();
  });

  test('validates password complexity', () => {
    render(<RegisterForm />);
    
    fireEvent.change(screen.getByLabelText(/用户名/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^密码$/i), { target: { value: 'weakpassword' } });
    fireEvent.change(screen.getByLabelText(/确认密码/i), { target: { value: 'weakpassword' } });
    
    const registerButton = screen.getByRole('button', { name: /注册/i });
    fireEvent.click(registerButton);
    
    expect(screen.getByText(/密码必须包含大小写字母、数字和特殊符号，至少8位/i)).toBeInTheDocument();
  });

  test('validates password confirmation', () => {
    render(<RegisterForm />);
    
    fireEvent.change(screen.getByLabelText(/用户名/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^密码$/i), { target: { value: 'Test@1234' } });
    fireEvent.change(screen.getByLabelText(/确认密码/i), { target: { value: 'Test@1235' } });
    
    const registerButton = screen.getByRole('button', { name: /注册/i });
    fireEvent.click(registerButton);
    
    expect(screen.getByText(/两次输入的密码不一致/i)).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    // Mock fetch API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ message: '注册成功' })
    }) as any;
    
    // Mock grecaptcha.execute to return a valid token
    (window as any).grecaptcha = {
      execute: vi.fn().mockResolvedValue('mock-captcha-token'),
      reset: vi.fn()
    };
    
    // 使用testCaptchaLoaded属性确保验证码已加载
    render(<RegisterForm testCaptchaLoaded={true} />);
    
    fireEvent.change(screen.getByLabelText(/用户名/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^密码$/i), { target: { value: 'Test@1234' } });
    fireEvent.change(screen.getByLabelText(/确认密码/i), { target: { value: 'Test@1234' } });
    
    const registerButton = screen.getByRole('button', { name: /注册/i });
    fireEvent.click(registerButton);
    
    // Wait for fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });
  });

  test('shows error message when captcha fails', async () => {
    // Mock grecaptcha.execute to return empty token
    (window.grecaptcha as any).execute = vi.fn().mockResolvedValue('');
    
    render(<RegisterForm />);
    
    fireEvent.change(screen.getByLabelText(/用户名/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^密码$/i), { target: { value: 'Test@1234' } });
    fireEvent.change(screen.getByLabelText(/确认密码/i), { target: { value: 'Test@1234' } });
    
    const registerButton = screen.getByRole('button', { name: /注册/i });
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(screen.getByText(/人机验证失败，请重试/i)).toBeInTheDocument();
    });
  });

  test('displays loading state when submitting', async () => {
    // Mock fetch to be slow (longer delay for better test reliability)
    global.fetch = vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({ message: '注册成功' })
          });
        }, 500);
      });
    }) as any;
    
    // Ensure captcha is loaded and returns a valid token
    (window as any).grecaptcha = {
      execute: vi.fn().mockResolvedValue('mock-captcha-token'),
      reset: vi.fn()
    };
    
    render(<RegisterForm testCaptchaLoaded={true} />);
    
    fireEvent.change(screen.getByLabelText(/用户名/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^密码$/i), { target: { value: 'Test@1234' } });
    fireEvent.change(screen.getByLabelText(/确认密码/i), { target: { value: 'Test@1234' } });
    
    const registerButton = screen.getByRole('button', { name: /注册/i });
    fireEvent.click(registerButton);
    
    // Wait for button to be disabled and loading text to appear
    await waitFor(() => {
      expect(registerButton).toBeDisabled();
      expect(screen.getByText(/注册中.../i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
