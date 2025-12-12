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

interface RegisterFormProps {
  testCaptchaLoaded?: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ testCaptchaLoaded }) => {
  const [browserFingerprint, setBrowserFingerprint] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
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

  // 密码强度验证
  const validatePassword = (password: string): boolean => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // 验证用户名
    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (formData.username.length < 3 || formData.username.length > 20) {
      newErrors.username = '用户名长度必须在3-20个字符之间';
    }

    // 验证密码
    if (!formData.password) {
      newErrors.password = '密码不能为空';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = '密码必须包含大小写字母、数字和特殊符号，至少8位';
    }

    // 验证确认密码
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除对应字段的错误信息
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      // 生成reCAPTCHA令牌
      let token = '';
      if (captchaLoaded && typeof window !== 'undefined' && (window as any).grecaptcha) {
        token = await (window as any).grecaptcha.execute('6LdT0-MpAAAAAKyM6QcFZ8Q8VYdQw8Z8Q8VYdQw8', {
          action: 'register'
        });
      }
      
      if (!token) {
        setErrors({ submit: '人机验证失败，请重试' });
        setIsSubmitting(false);
        return;
      }
      
      setCaptchaToken(token);

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          browserFingerprint,
          captchaToken: token
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        // 重置表单
        setFormData({ username: '', password: '', confirmPassword: '' });
        resetCaptcha(); // 重置reCAPTCHA
      } else {
        setErrors({ submit: data.message || '注册失败' });
        resetCaptcha(); // 重置reCAPTCHA
      }
    } catch (error) {
      setErrors({ submit: '注册失败，请稍后重试' });
      resetCaptcha(); // 重置reCAPTCHA
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">用户注册</h2>
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-center">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="请输入用户名"
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:outline-none transition-all ${errors.username ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="请输入密码"
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:outline-none transition-all ${errors.password ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="请确认密码"
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:outline-none transition-all ${errors.confirmPassword ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>

        {errors.submit && <div className="bg-red-100 text-red-700 p-3 rounded-md text-center">{errors.submit}</div>}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:ring-2 focus:ring-blue-300 focus:outline-none"
        >
          {isSubmitting ? '注册中...' : '注册'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;