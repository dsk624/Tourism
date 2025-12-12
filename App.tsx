import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AttractionCard } from './components/AttractionCard';
import { DetailModal } from './components/DetailModal';
import { FeedbackWidget } from './components/FeedbackWidget';
import { WeatherWidget } from './components/WeatherWidget';
import { AdminModal } from './components/AdminModal';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import { ATTRACTIONS as STATIC_ATTRACTIONS, PROVINCES } from './constants';
import { Attraction, User } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, Search, Menu, X, User as UserIcon, Sun, Moon, Map, Loader2, Plus, Edit } from 'lucide-react';

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
  
  // Auth & Admin State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Data State
  const [attractions, setAttractions] = useState<Attraction[]>(STATIC_ATTRACTIONS);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Admin Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);

  // Fetch Attractions
  const fetchAttractions = async () => {
    setIsDataLoading(true);
    try {
      const res = await fetch('/api/attractions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
           // Map DB columns (underscore) to Frontend (camelCase) if necessary
           // Assuming API returns camelCase or we map it here.
           // The API I wrote returns the DB columns directly, but let's assume consisteny or map if needed.
           // Current API returns JSON objects with keys matching columns. 
           // My create table used: image_url.
           // Frontend uses: imageUrl. 
           const mappedData = data.map((item: any) => ({
             ...item,
             imageUrl: item.image_url || item.imageUrl
           }));
           setAttractions(mappedData);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch from DB, using static data", e);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Check Auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setCurrentUser(data.user);
          }
        }
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
    fetchAttractions();
  }, []);

  const handleAdminSave = async (data: any) => {
    try {
      const method = editingAttraction ? 'PUT' : 'POST';
      const url = editingAttraction ? `/api/attractions?id=${editingAttraction.id}` : '/api/attractions';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setIsAdminModalOpen(false);
        fetchAttractions(); // Refresh list
      } else {
        alert('操作失败');
      }
    } catch (e) {
      alert('网络错误');
    }
  };

  const handleAdminDelete = async (id: string) => {
    if (!confirm('确定要删除这个景点吗？')) return;
    try {
      const res = await fetch(`/api/attractions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIsAdminModalOpen(false);
        fetchAttractions();
      }
    } catch (e) {
      alert('删除失败');
    }
  };

  const openAddModal = () => {
    setEditingAttraction(null);
    setIsAdminModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, attraction: Attraction) => {
    e.stopPropagation();
    setEditingAttraction(attraction);
    setIsAdminModalOpen(true);
  };

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
    let filtered = attractions;
    if (selectedProvince !== '全部') {
      filtered = filtered.filter(a => a.province === selectedProvince);
    }
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return filtered;
  }, [selectedProvince, searchTerm, attractions]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setCurrentUser(null);
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
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl font-medium ${currentTheme.text}`}>{currentUser?.isAdmin ? '管理面板' : '我的账户'}</Link>
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
        <WeatherWidget />
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
              从古老的河南腹地出发，丈量每一寸山河。实时天气监测，沉浸式旅行体验，带您领略千年文化的独特魅力。
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
        {/* Admin Add Button */}
        {isAuthenticated && currentUser?.isAdmin && (
           <div className="flex justify-end mb-6">
              <button 
                onClick={openAddModal}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-teal-500/30 transition-all font-bold"
              >
                <Plus className="w-5 h-5" /> 新增景点
              </button>
           </div>
        )}

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
                className="relative group"
              >
                <AttractionCard 
                  attraction={attraction} 
                  onClick={setSelectedAttraction} 
                  theme={theme}
                  currentTheme={currentTheme}
                />
                
                {isAuthenticated && currentUser?.isAdmin && (
                  <button 
                    onClick={(e) => openEditModal(e, attraction)}
                    className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredAttractions.length === 0 && (
             <div className="col-span-full text-center py-20 text-slate-500">
                <p>未找到相关景点，试着换个关键词？</p>
             </div>
          )}
        </div>
      </main>
      
      <AdminModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
        onSubmit={handleAdminSave}
        onDelete={handleAdminDelete}
        initialData={editingAttraction}
      />
    </>
  );

  return (
    <Router>
      <ScrollToTop />
      <div className={`min-h-screen transition-colors duration-500 ${currentTheme.bg} ${currentTheme.text} font-sans selection:bg-teal-500 selection:text-white`}>
        <Navbar />

        {isAuthChecking ? (
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<HomeContent />} />
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/profile" /> : (
                <div className="pt-32 pb-20 px-4 flex justify-center items-center min-h-screen">
                  <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${currentTheme.cardBg} ${currentTheme.border} border`}>
                    <LoginForm onLoginSuccess={() => {
                        // After login, re-check auth to update user state including isAdmin
                         setIsAuthChecking(true);
                         fetch('/api/me').then(r => r.json()).then(d => {
                             if(d.authenticated) {
                                 setIsAuthenticated(true);
                                 setCurrentUser(d.user);
                             }
                             setIsAuthChecking(false);
                         });
                    }} />
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
                <div className="pt-32 px-4 max-w-4xl mx-auto min-h-screen">
                  <div className={`p-8 rounded-3xl ${currentTheme.cardBg} border ${currentTheme.border} shadow-xl`}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/20">
                        <UserIcon className="w-8 h-8 text-teal-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold">{currentUser?.username}</h1>
                            {currentUser?.isAdmin && (
                                <span className="bg-red-500/10 text-red-500 text-xs px-2 py-1 rounded-full font-bold border border-red-500/20">管理员</span>
                            )}
                        </div>
                        <p className="opacity-70 mt-1">欢迎回来，您的旅行数据已通过 D1 数据库安全同步。</p>
                      </div>
                    </div>
                    
                    <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} border ${currentTheme.border}`}>
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                         <Map className="w-5 h-5 text-teal-500" />
                         {currentUser?.isAdmin ? '管理概览' : '我的收藏'}
                      </h3>
                      {currentUser?.isAdmin ? (
                          <div className="text-sm opacity-80">
                              您拥有景点数据的增删改查权限。请返回首页进行管理操作。
                          </div>
                      ) : (
                          <p className="text-sm opacity-60">暂无收藏的景点，去首页探索一下吧！</p>
                      )}
                    </div>

                    <div className="mt-8 flex justify-end">
                       <button onClick={handleLogout} className="px-6 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">
                         退出登录
                       </button>
                    </div>
                  </div>
                </div>
              ) : <Navigate to="/login" />
            } />
          </Routes>
        )}

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