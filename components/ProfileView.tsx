
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShieldCheck, Smartphone, Clock, Trash2, MapPin, ChevronRight, User as UserIcon, LogOut, Loader2, Sparkles, Map } from 'lucide-react';
import { api, FavoriteItem } from '../services/api';
import { Attraction, User } from '../types';
import { AttractionCard } from './AttractionCard';

interface Device {
  id: number;
  device_name: string;
  last_login: string;
  is_trusted: number;
}

interface ProfileViewProps {
  currentUser: User | null;
  theme: 'light' | 'dark' | 'teal';
  currentTheme: any;
  handleLogout: () => void;
  onSelectAttraction: (attraction: Attraction) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  currentUser, theme, currentTheme, handleLogout, onSelectAttraction 
}) => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'security'>('favorites');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'favorites') {
        const data = await api.favorites.getAll();
        setFavorites(data || []);
      } else {
        const res = await fetch('/api/devices');
        const data = await res.json();
        setDevices(data.devices?.results || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleRemoveFavorite = async (e: React.MouseEvent | null, id: string) => {
    e?.stopPropagation();
    try {
      await api.favorites.remove(id);
      setFavorites(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      alert('移除失败');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen pb-20">
      {/* 1. 头部区域 */}
      <div className="relative pt-32 pb-16 px-4">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-teal-500/20 to-transparent dark:from-teal-900/40" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.15),transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-3xl font-black shadow-2xl mb-6 shadow-teal-500/30"
          >
            {currentUser?.username.charAt(0).toUpperCase()}
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            {currentUser?.username} 的空间
          </h1>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full text-[10px] font-black text-teal-600 border border-teal-500/20 uppercase tracking-widest">
              {currentUser?.isAdmin ? '核心管理员' : '高级旅行者'}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold">•</span>
            <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1">
              退出登录 <LogOut className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 内容导航 */}
      <div className="max-w-5xl mx-auto px-4 mb-12">
        <div className="flex p-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] text-sm font-black transition-all ${activeTab === 'favorites' ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-white' : ''}`} /> 我的收藏
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] text-sm font-black transition-all ${activeTab === 'security' ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <ShieldCheck className="w-4 h-4" /> 安全中心
          </button>
        </div>
      </div>

      {/* 3. 列表展示 */}
      <div className="max-w-6xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
            </motion.div>
          ) : activeTab === 'favorites' ? (
            <motion.div key="favs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {favorites.length > 0 ? (
                favorites.map(item => (
                  <AttractionCard 
                    key={item.id} 
                    attraction={item} 
                    theme={theme} 
                    currentTheme={currentTheme} 
                    onClick={() => onSelectAttraction(item)}
                    isFavorite={true}
                    onToggleFavorite={handleRemoveFavorite}
                  />
                ))
              ) : (
                <div className="col-span-full py-32 text-center">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">空空如也</h3>
                  <p className="text-slate-400 text-sm mb-8">您还没有收藏任何景点，快去首页看看吧</p>
                  <button onClick={() => window.location.href = '/'} className="px-8 py-3 bg-teal-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-teal-500/20">浏览发现</button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-4">
              <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl mb-8 flex items-start gap-4">
                 <ShieldCheck className="w-6 h-6 text-blue-500 flex-shrink-0" />
                 <div>
                    <h4 className="font-black text-slate-800 dark:text-white mb-1">账号安全等级：高</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">我们已通过设备指纹技术保护您的账号，以下是最近登录过您账号的设备记录。</p>
                 </div>
              </div>
              
              {devices.length > 0 ? (
                devices.map((device, idx) => (
                  <div key={device.id} className="bg-white dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-teal-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-300">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                          {device.device_name}
                          {idx === 0 && <span className="text-[9px] bg-teal-500 text-white px-2 py-0.5 rounded-full">当前设备</span>}
                        </h5>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(device.last_login).toLocaleString()}</span>
                          <span className={`flex items-center gap-1 ${device.is_trusted ? 'text-teal-500' : 'text-amber-500'}`}>
                            {device.is_trusted ? '受信任' : '待验证'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-200 dark:text-slate-700" />
                  </div>
                ))
              ) : (
                <div className="text-center py-20 opacity-30 italic">暂无设备记录数据</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
