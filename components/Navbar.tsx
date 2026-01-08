
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mountain, MessageCircle, Menu, X, Sun, Moon, Map, LogOut, Settings, User as UserIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';

interface NavbarProps {
  theme: 'light' | 'dark' | 'teal';
  setTheme: (theme: 'light' | 'dark' | 'teal') => void;
  isAuthenticated: boolean;
  currentUser: User | null;
  handleLogout: () => void;
  setIsContactModalOpen: (isOpen: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme, setTheme, isAuthenticated, currentUser, handleLogout, setIsContactModalOpen, mobileMenuOpen, setMobileMenuOpen
}) => {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${currentThemeStyles}`}>
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
              <Settings className="w-5 h-5 opacity-60" />
              <ChevronDown className={`w-3 h-3 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 mt-3 w-52 rounded-2xl shadow-2xl border border-white/20 p-2 overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                >
                  <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">环境设置</div>
                  
                  <div className="flex gap-1 p-1 mb-2 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    {(['light', 'dark', 'teal'] as const).map(t => (
                      <button 
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`flex-1 py-1.5 rounded-lg flex justify-center transition-all ${theme === t ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-500' : 'text-slate-400'}`}
                      >
                        {t === 'light' ? <Sun className="w-4 h-4" /> : t === 'dark' ? <Moon className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => { setIsContactModalOpen(true); setSettingsOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-teal-500/10 rounded-xl transition-colors text-slate-700 dark:text-slate-300"
                  >
                    <MessageCircle className="w-4 h-4 text-blue-500" /> 联系反馈
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2" />

                  {isAuthenticated ? (
                    <>
                      <Link to="/profile" onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-teal-500/10 rounded-xl transition-colors text-slate-700 dark:text-slate-300">
                        <UserIcon className="w-4 h-4 text-teal-500" /> 个人中心
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                        <LogOut className="w-4 h-4" /> 退出登录
                      </button>
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setSettingsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-teal-500 hover:bg-teal-500/10 rounded-xl transition-colors">
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
              className={`fixed top-0 right-0 bottom-0 w-[280px] z-50 shadow-2xl md:hidden flex flex-col ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}
            >
              <div className="p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                <span className="font-black text-lg">导航菜单</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">主菜单</h4>
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-lg font-bold">
                    <div className="p-2 bg-teal-500/10 rounded-lg"><Map className="w-5 h-5 text-teal-500" /></div>
                    探索首页
                  </Link>
                  <button 
                    onClick={() => { setIsContactModalOpen(true); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-4 text-lg font-bold"
                  >
                    <div className="p-2 bg-blue-500/10 rounded-lg"><MessageCircle className="w-5 h-5 text-blue-500" /></div>
                    联系作者
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">外观设置</h4>
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
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">账户管理</h4>
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-lg font-bold">
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
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">© 2025 CHINA TRAVEL GUIDE</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
