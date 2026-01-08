
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mountain, MessageCircle, Menu, X, Sun, Moon, Map, LogOut, Settings, User as UserIcon, ChevronDown, Bell, Volume2, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { api, Notification } from '../services/api';

interface NavbarProps {
  theme: 'light' | 'dark' | 'teal';
  setTheme: (theme: 'light' | 'dark' | 'teal') => void;
  isAuthenticated: boolean;
  currentUser: User | null;
  handleLogout: () => void;
  setIsContactModalOpen: (isOpen: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onOpenAdminNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme, setTheme, isAuthenticated, currentUser, handleLogout, setIsContactModalOpen, mobileMenuOpen, setMobileMenuOpen, onOpenAdminNotifications
}) => {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.notifications.getActive();
        setNotifications(data);
      } catch (e) {
        console.error('Failed to fetch notifications');
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentThemeStyles = {
    light: "bg-white/80 border-slate-200 text-slate-800",
    dark: "bg-slate-900/80 border-slate-800 text-white",
    teal: "bg-teal-50/80 border-teal-100 text-teal-900"
  }[theme];

  const isDark = theme === 'dark';
  const isAdmin = currentUser?.isAdmin;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Marquee Notification Bar */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-teal-600 dark:bg-teal-900/90 text-white py-2 overflow-hidden relative group/marquee"
          >
            <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 flex-shrink-0 animate-pulse" />
                {isAdmin && (
                  <button 
                    onClick={onOpenAdminNotifications}
                    className="p-1 rounded-md bg-white/20 hover:bg-white/40 transition-colors opacity-0 group-hover/marquee:opacity-100"
                    title="管理通知"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-hidden relative h-5">
                <div className="absolute whitespace-nowrap animate-marquee flex gap-20 items-center">
                  {notifications.map((n, i) => (
                    <span key={i} className="text-xs font-bold tracking-wide">
                      {n.content}
                    </span>
                  ))}
                  {notifications.map((n, i) => (
                    <span key={`dup-${i}`} className="text-xs font-bold tracking-wide">
                      {n.content}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={`backdrop-blur-xl border-b transition-all duration-300 ${currentThemeStyles}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-teal-500 rounded-xl shadow-lg shadow-teal-500/20 group-hover:rotate-6 transition-transform">
              <Mountain className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight">华夏游</span>
          </Link>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={`text-sm font-bold transition-opacity ${location.pathname === '/' ? 'text-teal-500' : 'opacity-70 hover:opacity-100'}`}>首页</Link>

            {/* Settings Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-slate-500/10 transition-colors"
              >
                <Settings className={`w-5 h-5 ${isDark ? 'text-slate-100' : 'text-slate-500'}`} />
                <ChevronDown className={`w-3 h-3 transition-transform ${settingsOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-100' : 'text-slate-400'}`} />
              </button>

              <AnimatePresence>
                {settingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 mt-3 w-52 rounded-2xl shadow-2xl border p-2 overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                  >
                    <div className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-300' : 'text-slate-400'}`}>环境设置</div>
                    
                    <div className={`flex gap-1 p-1 mb-2 rounded-xl ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
                      {(['light', 'dark', 'teal'] as const).map(t => (
                        <button 
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`flex-1 py-1.5 rounded-lg flex justify-center transition-all ${theme === t ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-500' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          {t === 'light' ? <Sun className="w-4 h-4" /> : t === 'dark' ? <Moon className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => { setIsContactModalOpen(true); setSettingsOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black rounded-xl transition-colors ${isDark ? 'text-slate-100 hover:bg-slate-700' : 'text-slate-800 hover:bg-teal-50'}`}
                    >
                      <MessageCircle className="w-4 h-4 text-blue-500" /> 联系反馈
                    </button>

                    <div className={`h-px my-1 mx-2 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />

                    {isAuthenticated ? (
                      <>
                        <Link 
                          to="/profile" 
                          onClick={() => setSettingsOpen(false)} 
                          className={`flex items-center gap-3 px-3 py-2.5 text-sm font-black rounded-xl transition-colors ${isDark ? 'text-slate-100 hover:bg-slate-700' : 'text-slate-800 hover:bg-teal-50'}`}
                        >
                          <UserIcon className="w-4 h-4 text-teal-500" /> 个人中心
                        </Link>
                        {isAdmin && (
                          <button 
                            onClick={() => { onOpenAdminNotifications?.(); setSettingsOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black rounded-xl transition-colors ${isDark ? 'text-slate-100 hover:bg-slate-700' : 'text-slate-800 hover:bg-teal-50'}`}
                          >
                            <Megaphone className="w-4 h-4 text-amber-500" /> 通知管理
                          </button>
                        )}
                        <button 
                          onClick={handleLogout} 
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black text-red-500 rounded-xl transition-colors ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                        >
                          <LogOut className="w-4 h-4" /> 退出登录
                        </button>
                      </>
                    ) : (
                      <Link 
                        to="/login" 
                        onClick={() => setSettingsOpen(false)} 
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-black text-teal-500 rounded-xl transition-colors ${isDark ? 'hover:bg-teal-500/10' : 'hover:bg-teal-50'}`}
                      >
                        <LogOut className="w-4 h-4" /> 登录账户
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 transition-colors"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Sidebar Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed top-0 right-0 bottom-0 w-[280px] z-50 shadow-2xl md:hidden flex flex-col ${isDark ? 'bg-slate-900' : 'bg-white'}`}
              >
                <div className="p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                  <span className="font-black text-lg dark:text-white">导航菜单</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 dark:text-slate-300">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-8">
                  <div className="space-y-4">
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>主菜单</h4>
                    <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-lg font-bold dark:text-white">
                      <div className="p-2 bg-teal-500/10 rounded-lg"><Map className="w-5 h-5 text-teal-500" /></div>
                      探索首页
                    </Link>
                    {isAdmin && (
                      <button 
                        onClick={() => { onOpenAdminNotifications?.(); setMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-4 text-lg font-bold dark:text-white"
                      >
                        <div className="p-2 bg-amber-500/10 rounded-lg"><Megaphone className="w-5 h-5 text-amber-500" /></div>
                        通知管理
                      </button>
                    )}
                    <button 
                      onClick={() => { setIsContactModalOpen(true); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-4 text-lg font-bold dark:text-white"
                    >
                      <div className="p-2 bg-blue-500/10 rounded-lg"><MessageCircle className="w-5 h-5 text-blue-500" /></div>
                      联系作者
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>外观设置</h4>
                    <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                      {(['light', 'dark', 'teal'] as const).map(t => (
                        <button 
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`py-3 rounded-xl flex justify-center transition-all ${theme === t ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-500' : 'text-slate-400'}`}
                        >
                          {t === 'light' ? <Sun className="w-5 h-5" /> : t === 'dark' ? <Moon className="w-5 h-5" /> : <Map className="w-5 h-5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>账户管理</h4>
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-lg font-bold dark:text-white">
                          <div className="p-2 bg-teal-500/10 rounded-lg"><UserIcon className="w-5 h-5 text-teal-500" /></div>
                          个人中心
                        </Link>
                        <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 text-lg font-bold text-red-500">
                          <div className="p-2 bg-red-500/10 rounded-lg"><LogOut className="w-5 h-5" /></div>
                          退出登录
                        </button>
                      </div>
                    ) : (
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-4 bg-teal-500 text-white rounded-2xl font-black shadow-lg shadow-teal-500/20">
                        <LogOut className="w-5 h-5" />
                        立即登录
                      </Link>
                    )}
                  </div>
                </div>
                
                <div className="p-6 text-center">
                  <p className={`text-xs font-bold uppercase tracking-tighter ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>© 2025 CHINA TRAVEL GUIDE</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};
