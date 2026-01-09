
import React, { useState } from 'react';
// Added AnimatePresence to the framer-motion import to fix "Cannot find name 'AnimatePresence'" errors
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, ShieldCheck, Cpu, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

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
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== confirmPassword) {
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
      
      const data = await api.auth.register({
        username: formData.username,
        password: formData.password,
        fingerprint,
        deviceName: navigator.platform
      });
      
      if (data.success) {
        setSuccess('账户创建成功！');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.message || '注册失败');
      }
    } catch (err: any) {
      setError(err.message || '网络连接错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-teal-500/10 rounded-[1.25rem] flex items-center justify-center mx-auto mb-4 border border-teal-500/20"
        >
          <UserPlus className="w-8 h-8 text-teal-500" />
        </motion.div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">开启探索之旅</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">创建您的专属华夏游账户</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2 px-1">个性用户名</label>
          <input
            type="text"
            required
            minLength={3}
            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 font-bold"
            placeholder="3个字符以上"
            value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2 px-1">安全密码</label>
          <input
            type="password"
            required
            minLength={6}
            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 font-bold"
            placeholder="6位以上字符"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2 px-1">确认密码</label>
          <input
            type="password"
            required
            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 font-bold"
            placeholder="再次输入以确认"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 overflow-hidden">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" /> {error}
            </motion.div>
          )}
          
          {success && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center gap-2 overflow-hidden">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 py-2">
          <Cpu className="w-3.5 h-3.5 text-teal-500" />
          <span>安全保障：已启用设备指纹加密</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-teal-500/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
             <Loader2 className="animate-spin h-5 w-5 text-white" />
          ) : '注 册 账 户'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
