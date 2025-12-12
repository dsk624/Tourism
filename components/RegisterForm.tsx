import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ShieldCheck, Cpu } from 'lucide-react';

// 简易浏览器指纹生成 (无需第三方库)
const generateFingerprint = async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'unknown';
  
  ctx.textBaseline = 'top';
  ctx.font = '14px "Arial"';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('ChinaTravel', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('Auth', 4, 17);
  
  const b64 = canvas.toDataURL().replace('data:image/png;base64,', '');
  const bin = atob(b64);
  let hash = 0;
  for (let i = 0; i < bin.length; i++) {
    hash = ((hash << 5) - hash) + bin.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16) + '-' + navigator.userAgent.length;
};

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }
    if (formData.username.length < 3) {
      setError('用户名至少3个字符');
      return;
    }

    setLoading(true);
    try {
      const fingerprint = await generateFingerprint();
      
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          fingerprint,
          deviceName: navigator.platform
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess('注册成功！正在跳转登录...');
        setTimeout(() => window.location.href = '/login', 1500);
      } else {
        setError(data.message || '注册失败');
      }
    } catch (err) {
      setError('网络连接错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/20">
          <UserPlus className="w-8 h-8 text-teal-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">创建新账户</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">无需手机号，开启您的专属旅程</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">用户名</label>
          <input
            type="text"
            required
            minLength={3}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
            placeholder="设置您的个性昵称"
            value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">密码</label>
          <input
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
            placeholder="至少6位字符"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">确认密码</label>
          <input
            type="password"
            required
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
            placeholder="再次输入密码"
            value={formData.confirmPassword}
            onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
          />
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> {error}
          </motion.div>
        )}
        
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg bg-green-50 text-green-600 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> {success}
          </motion.div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Cpu className="w-3 h-3" />
          <span>安全保障：已启用设备指纹识别技术</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : '立即注册'}
        </button>
      </form>
    </motion.div>
  );
};

export default RegisterForm;