import React, { useState, useEffect } from 'react';

// 生成浏览器指纹
const generateBrowserFingerprint = (): string => {
  const navigatorInfo = navigator as any;
  const screenInfo = screen;
  
  const fingerprintData = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    screenResolution: `${screenInfo.width}x${screenInfo.height}`,
    colorDepth: screenInfo.colorDepth,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hasTouch: 'ontouchstart' in window,
    hasGeolocation: 'geolocation' in navigator,
    hasWebGL: 'WebGLRenderingContext' in window,
    plugins: Array.from(navigator.plugins).map(p => p.name).join(','),
    mimeTypes: Array.from(navigator.mimeTypes).map(m => m.type).join(','),
    canvasFingerprint: generateCanvasFingerprint()
  };
  
  return btoa(JSON.stringify(fingerprintData));
};

// 生成Canvas指纹
const generateCanvasFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.font = '20px Arial';
  ctx.fillText('Browser Fingerprint', 10, 30);
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, 190, 40);
  
  return canvas.toDataURL('image/png');
};

interface LoginFormProps {
  testCaptchaLoaded?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ testCaptchaLoaded }) => {
  const [browserFingerprint, setBrowserFingerprint] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaLoaded, setCaptchaLoaded] = useState(!!testCaptchaLoaded);

  // 加载reCAPTCHA脚本
  useEffect(() => {
    if (typeof window !== 'undefined' && !captchaLoaded) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=6LdT0-MpAAAAAKyM6QcFZ8Q8VYdQw8Z8Q8VYdQw8';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setCaptchaLoaded(true);
      };
      document.body.appendChild(script);
    }
  }, [captchaLoaded]);

  // 重置reCAPTCHA
  const resetCaptcha = () => {
    if (typeof window !== 'undefined' && (window as any).grecaptcha) {
      (window as any).grecaptcha.reset();
      setCaptchaToken('');
    }
  };

  // 组件加载时生成浏览器指纹
  useEffect(() => {
    const fingerprint = generateBrowserFingerprint();
    setBrowserFingerprint(fingerprint);
  }, []);

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 验证用户名
    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    }

    // 验证密码
    if (!formData.password) {
      newErrors.password = '密码不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // 清除对应字段的错误信息
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setMessage('');
    setErrors({});
    
    try {
      // 生成reCAPTCHA令牌
      let token = '';
      if (captchaLoaded && typeof window !== 'undefined' && (window as any).grecaptcha) {
        token = await (window as any).grecaptcha.execute('6LdT0-MpAAAAAKyM6QcFZ8Q8VYdQw8Z8Q8VYdQw8', {
          action: 'login'
        });
      }
      
      if (!token) {
        setErrors({ general: '人机验证失败，请重试' });
        setIsSubmitting(false);
        return;
      }
      
      setCaptchaToken(token);

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          rememberMe: formData.rememberMe,
          browserFingerprint,
          captchaToken: token
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || '登录成功！');
        // 登录成功后跳转到主页
        window.location.href = '/';
      } else {
        setErrors(data.errors || { general: data.error || '登录失败' });
        resetCaptcha(); // 重置reCAPTCHA
      }
    } catch (error) {
      setErrors({ general: '登录失败，请稍后重试' });
      resetCaptcha(); // 重置reCAPTCHA
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">用户登录</h2>
      
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-center">{message}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input
            type="text"
            id="username"
            name="username"
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:outline-none transition-all ${errors.username ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`}
            value={formData.username}
            onChange={handleChange}
            placeholder="请输入用户名"
          />
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            type="password"
            id="password"
            name="password"
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:outline-none transition-all ${errors.password ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`}
            value={formData.password}
            onChange={handleChange}
            placeholder="请输入密码"
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 cursor-pointer">记住我</label>
          </div>
          <a href="#" className="text-sm text-blue-500 hover:text-blue-600 transition-colors">忘记密码？</a>
        </div>

        {errors.general && <div className="bg-red-100 text-red-700 p-3 rounded-md text-center">{errors.general}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:ring-2 focus:ring-blue-300 focus:outline-none"
        >
          {isSubmitting ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;