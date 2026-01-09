
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mountain, MessageCircle, Menu, X, Sun, Moon, Map, LogOut, Settings, User as UserIcon, ChevronDown, Bell, Volume2, Megaphone, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { api, Notification } from '../services/api';
import { CalendarModal } from './CalendarModal';

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
  onNotificationVisibilityChange?: (isVisible: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme, setTheme, isAuthenticated, currentUser, handleLogout, setIsContactModalOpen, mobileMenuOpen, setMobileMenuOpen, onOpenAdminNotifications, onNotificationVisibilityChange
}) => {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.notifications.getActive();
      setNotifications(data);
      if (data.length > 0 && !isDismissed) {
        onNotificationVisibilityChange?.(true);
      } else {
        onNotificationVisibilityChange?.(false);
      }
    } catch (e) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    window.addEventListener('notificationsUpdated', fetchNotifications);
    const interval = setInterval(fetchNotifications, 300000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationsUpdated', fetchNotifications);
    };
  }, [onNotificationVisibilityChange, isDismissed]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    onNotificationVisibilityChange?.(false);
  };

  const currentThemeStyles = {
    light: "bg-white/80 border-slate-200 text-slate-800",
    dark: "bg-slate-900/80 border-slate-800 text-white",
    teal: "bg-teal-50/80 border-teal-100 text-teal-900"
  }[theme];

  const isDark = theme === 'dark';
  const isAdmin = currentUser?.isAdmin;
  
  const getSafeBgColor = (notif: Notification) => {
    const val = notif.bg_color;
    if (val.startsWith('#') || val.startsWith('rgba') || val.startsWith('rgb')) return val;
    return "#0d9488";
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <AnimatePresence>
        {notifications.length > 0 && !isDismissed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ backgroundColor: getSafeBgColor(notifications[0]) }}
            className="text-white py-2 overflow-hidden relative group/marquee backdrop-blur-sm"
          >
            <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 flex-shrink-0 animate-pulse" />
              </div>
              <div className="flex-1 overflow-hidden relative h-5">
                <div className="absolute whitespace-nowrap animate-marquee flex gap-20 items-center">
                  {notifications.map((n, i) => (
                    <span key={i} className="text-xs font-bold tracking-wide drop-shadow-sm">{n.content}</span>
                  ))}
                  {notifications.map((n, i) => (
                    <span key={`dup-${i}`} className="text-xs font-bold tracking-wide drop-shadow-sm">{n.content}</span>
                  ))}
                </div>
              </div>
              <button onClick={handleDismiss} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={`backdrop-blur-xl border-b transition-all duration-300 ${currentThemeStyles}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-teal-500 rounded-xl shadow-lg shadow-teal-500/20 group-hover:rotate-6 transition-transform">
              <Mountain className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight">华夏游</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={`text-sm font-bold transition-opacity ${location.pathname === '/' ? 'text-teal-500' : 'opacity-70 hover:opacity-100'}`}>首页</Link>
            
            {isAuthenticated && (
              <button 
                onClick={() => setIsCalendarOpen(true)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-teal-500/10 text-teal-500 transition-colors"
                title="我的日程"
              >
                <CalendarIcon className="w-5 h-5" />
              </button>
            )}

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
                        <button key={t} onClick={() => setTheme(t)} className={`flex-1 py-1.5 rounded-lg flex justify-center transition-all ${theme === t ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-500' : 'text-slate-400'}`}>
                          {t === 'light' ? <Sun className="w-4 h-4" /> : t === 'dark' ? <Moon className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => { setIsContactModalOpen(true); setSettingsOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black rounded-xl transition-colors ${isDark ? 'text-slate-100 hover:bg-slate-700' : 'text-slate-800 hover:bg-teal-50'}`}>
                      <MessageCircle className="w-4 h-4 text-blue-500" /> 联系反馈
                    </button>
                    <div className={`h-px my-1 mx-2 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />
                    {isAuthenticated ? (
                      <>
                        <Link to="/profile" onClick={() => setSettingsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 text-sm font-black rounded-xl transition-colors ${isDark ? 'text-slate-100 hover:bg-slate-700' : 'text-slate-800 hover:bg-teal-50'}`}>
                          <UserIcon className="w-4 h-4 text-teal-500" /> 个人中心
                        </Link>
                        <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black text-red-500 rounded-xl transition-colors ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
                          <LogOut className="w-4 h-4" /> 退出登录
                        </button>
                      </>
                    ) : (
                      <Link to="/login" onClick={() => setSettingsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 text-sm font-black text-teal-500 rounded-xl transition-colors ${isDark ? 'hover:bg-teal-500/10' : 'hover:bg-teal-50'}`}>
                        <LogOut className="w-4 h-4" /> 登录账户
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-500 dark:text-slate-400"><Menu /></button>
        </div>

        <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} isAuthenticated={isAuthenticated} />
      </nav>
    </div>
  );
};
