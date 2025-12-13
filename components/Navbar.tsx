
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mountain, MessageCircle, Menu, X, Sun, Moon, Map } from 'lucide-react';
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
  theme,
  setTheme,
  isAuthenticated,
  currentUser,
  handleLogout,
  setIsContactModalOpen,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const location = useLocation();

  const themes = {
    light: {
      primary: 'bg-teal-600',
      text: 'text-slate-800',
      border: 'border-slate-200',
      cardBg: 'bg-white'
    },
    dark: {
      primary: 'bg-teal-500',
      text: 'text-slate-100',
      border: 'border-slate-700',
      cardBg: 'bg-slate-800'
    },
    teal: {
      primary: 'bg-teal-600',
      text: 'text-teal-900',
      border: 'border-teal-100',
      cardBg: 'bg-white'
    }
  };

  const currentTheme = themes[theme];

  const NavLink = ({ to, children, active }: { to: string, children: React.ReactNode, active: boolean }) => (
    <Link to={to}>
      <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        active 
          ? `${currentTheme.primary} text-white shadow-lg shadow-teal-500/30` 
          : `${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`
      }`}>
        {children}
      </div>
    </Link>
  );

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 animate__animated animate__fadeInDown ${
        theme === 'dark' 
          ? 'bg-slate-900/90 border-slate-800' 
          : 'bg-white/90 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className={`p-2.5 rounded-xl ${currentTheme.primary} shadow-lg shadow-teal-500/20 transform group-hover:rotate-12 transition-all duration-300`}>
                <Mountain className="text-white w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className={`text-lg sm:text-xl font-bold tracking-tight ${currentTheme.text}`}>华夏游</span>
                <span className={`text-[10px] uppercase tracking-widest opacity-60 font-medium ${currentTheme.text}`}>China Travel</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/" active={location.pathname === '/'}>首页</NavLink>

              <button 
                onClick={() => setIsContactModalOpen(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                联系我
              </button>

              {isAuthenticated ? (
                 <NavLink to="/profile" active={location.pathname === '/profile'}>
                   {currentUser?.isAdmin ? '管理面板' : '我的账户'}
                 </NavLink>
              ) : (
                <>
                  <NavLink to="/login" active={location.pathname === '/login'}>登录</NavLink>
                  <Link to="/register">
                    <button className={`ml-2 px-5 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 ${currentTheme.primary} text-white shadow-lg shadow-teal-500/30`}>
                      注册
                    </button>
                  </Link>
                </>
              )}
              
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>

              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                {(['light', 'dark', 'teal'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`p-2 rounded-full transition-all ${theme === t ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    {t === 'light' && <Sun className="w-4 h-4" />}
                    {t === 'dark' && <Moon className="w-4 h-4" />}
                    {t === 'teal' && <Map className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`absolute top-full left-0 right-0 z-50 overflow-hidden border-t ${currentTheme.border} ${currentTheme.cardBg} shadow-2xl`}
            >
              <div className="px-4 pt-4 pb-6 space-y-2">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-medium ${location.pathname === '/' ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600' : currentTheme.text}`}>首页</Link>

                <button 
                  onClick={() => { setIsContactModalOpen(true); setMobileMenuOpen(false); }}
                  className={`w-full text-left block px-4 py-3 rounded-xl font-medium ${currentTheme.text} flex items-center gap-2`}
                >
                  <MessageCircle className="w-4 h-4" /> 联系我
                </button>
                
                {isAuthenticated ? (
                  <>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-medium ${currentTheme.text}`}>{currentUser?.isAdmin ? '管理面板' : '我的账户'}</Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left block px-4 py-3 rounded-xl font-medium text-red-500">退出登录</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-medium ${currentTheme.text}`}>登录</Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-medium ${currentTheme.primary} text-white`}>立即注册</Link>
                  </>
                )}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-4">
                  {(['light', 'dark', 'teal'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${theme === t ? 'border-teal-500 text-teal-500' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}
                    >
                       {t === 'light' && <Sun className="w-5 h-5" />}
                       {t === 'dark' && <Moon className="w-5 h-5" />}
                       {t === 'teal' && <Map className="w-5 h-5" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};
