import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AttractionCard } from './components/AttractionCard';
import { DetailModal } from './components/DetailModal';
import { FeedbackWidget } from './components/FeedbackWidget';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import { ATTRACTIONS, PROVINCES } from './constants';
import { Attraction } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, Search, Menu, X, User, Sun, Moon, Map } from 'lucide-react';

// 滚动至顶部的组件
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState<string>('河南');
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'teal'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化检查登录状态
  useEffect(() => {
    // 实际生产中应请求 /api/user 验证 Session
    const checkAuth = async () => {
      // 简单模拟，实际需调用 API 检查 Cookie
    };
    checkAuth();
  }, []);

  const themes = {
    light: {
      primary: 'bg-teal-600',
      primaryText: 'text-teal-600',
      bg: 'bg-slate-50',
      cardBg: 'bg-white',
      text: 'text-slate-800',
      border: 'border-slate-200'
    },
    dark: {
      primary: 'bg-teal-500',
      primaryText: 'text-teal-400',
      bg: 'bg-slate-900',
      cardBg: 'bg-slate-800',
      text: 'text-slate-100',
      border: 'border-slate-700'
    },
    teal: {
      primary: 'bg-teal-600',
      primaryText: 'text-teal-700',
      bg: 'bg-teal-50',
      cardBg: 'bg-white',
      text: 'text-teal-900',
      border: 'border-teal-100'
    }
  };

  const currentTheme = themes[theme];

  const filteredAttractions = useMemo(() => {
    let filtered = ATTRACTIONS;
    if (selectedProvince !== '全部') {
      filtered = filtered.filter(a => a.province === selectedProvince);
    }
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [selectedProvince, searchTerm]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setIsAuthenticated(false);
      window.location.href = '/login';
    } catch (e) { console.error(e); }
  };

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

  const Navbar = () => {
    const location = useLocation();
    
    return (
      <nav className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-900/80 border-slate-800' 
          : 'bg-white/80 border-slate-200'
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
              {isAuthenticated ? (
                 <NavLink to="/profile" active={location.pathname === '/profile'}>我的账户</NavLink>
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

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`md:hidden overflow-hidden border-t ${currentTheme.border} ${currentTheme.cardBg}`}
            >
              <div className="px-4 pt-4 pb-6 space-y-2">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-medium ${location.pathname === '/' ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600' : currentTheme.text}`}>首页</Link>
                {isAuthenticated ? (
                  <>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-medium ${currentTheme.text}`}>我的账户</Link>
                  <button onClick={handleLogout} className="w-full text-left block px-4 py-3 rounded-xl font-medium text-red-500">退出登录</button>
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
    );
  };

  const HomeContent = () => (
    <>
      <div className="relative pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/1920/1080?random=99" 
            className="w-full h-[500px] object-cover opacity-90"
            alt="Hero Background" 
          />
          <div className={`absolute inset-0 bg-gradient-to-b ${theme === 'dark' ? 'from-slate-900/30 via-slate-900/80 to-slate-900' : 'from-slate-900/10 via-slate-900/40 to-slate-50'}`} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-sm">
              Discover The Oriental Beauty
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              探索<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">锦绣中华</span>
            </h1>
            <p className="text-slate-200 text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
              从古老的河南腹地出发，丈量每一寸山河。AI 智能导览，实时天气监测，为您打造极致的沉浸式旅行体验。
            </p>

            <div className="relative max-w-lg mx-auto group">
              <div className="absolute inset-0 bg-teal-500 blur-xl opacity-20 group-hover:opacity-30 transition-opacity rounded-full"></div>
              <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-2 transition-all group-hover:bg-white/20 group-hover:border-white/30">
                <Search className="ml-4 w-5 h-5 text-teal-300" />
                <input 
                  type="text"
                  placeholder="搜索景点、历史或文化..."
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-300 px-4 py-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 -mt-10 relative z-20">
        {/* Filter Section */}
        <div className={`mb-12 overflow-x-auto pb-4 no-scrollbar flex justify-center`}>
          <div className={`inline-flex p-1.5 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/80 border border-slate-700' : 'bg-white border border-slate-200'} backdrop-blur-sm shadow-xl`}>
            {['全部', ...PROVINCES].map((province) => (
              <button
                key={province}
                onClick={() => setSelectedProvince(province)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  selectedProvince === province
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                    : `${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
                }`}
              >
                {province}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredAttractions.map((attraction, i) => (
              <motion.div
                key={attraction.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <AttractionCard 
                  attraction={attraction} 
                  onClick={setSelectedAttraction} 
                  theme={theme}
                  currentTheme={currentTheme}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </>
  );

  return (
    <Router>
      <ScrollToTop />
      <div className={`min-h-screen transition-colors duration-500 ${currentTheme.bg} ${currentTheme.text} font-sans selection:bg-teal-500 selection:text-white`}>
        <Navbar />

        <Routes>
          <Route path="/" element={<HomeContent />} />
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/profile" /> : (
              <div className="pt-32 pb-20 px-4 flex justify-center items-center min-h-screen">
                <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${currentTheme.cardBg} ${currentTheme.border} border`}>
                   <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />
                </div>
              </div>
            )
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/profile" /> : (
              <div className="pt-32 pb-20 px-4 flex justify-center items-center min-h-screen">
                <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${currentTheme.cardBg} ${currentTheme.border} border`}>
                   <RegisterForm />
                </div>
              </div>
            )
          } />
          <Route path="/profile" element={
             isAuthenticated ? (
               <div className="pt-32 px-4 max-w-4xl mx-auto">
                 <div className={`p-8 rounded-3xl ${currentTheme.cardBg} border ${currentTheme.border} shadow-xl`}>
                   <h1 className="text-3xl font-bold mb-4">我的个人中心</h1>
                   <p className="opacity-70">欢迎回来，您的旅行数据已通过 D1 数据库安全同步。</p>
                 </div>
               </div>
             ) : <Navigate to="/login" />
          } />
        </Routes>

        <footer className={`py-12 border-t ${currentTheme.border} ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
               <Mountain className="w-5 h-5" />
               <span className="font-bold">华夏游</span>
            </div>
            <p className="text-sm opacity-40">© 2025 China Travel Guide. Powered by Cloudflare Pages & D1.</p>
          </div>
        </footer>

        <DetailModal attraction={selectedAttraction} onClose={() => setSelectedAttraction(null)} />
        <FeedbackWidget />
      </div>
    </Router>
  );
};

export default App;