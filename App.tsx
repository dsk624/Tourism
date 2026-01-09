
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DetailModal } from './components/DetailModal';
import { FeedbackWidget } from './components/FeedbackWidget';
import { AdminModal } from './components/AdminModal';
import { ContactModal } from './components/ContactModal';
import { LoginPromptModal } from './components/LoginPromptModal';
import { Navbar } from './components/Navbar';
import { HomeContent } from './components/HomeContent';
import { AttractionCard } from './components/AttractionCard';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import { Attraction, User } from './types';
import { User as UserIcon, Map, Loader2, LogOut, Edit, Plus, Heart, FolderHeart, ShieldCheck, Eye, BarChart3 } from 'lucide-react';
import { api, FavoriteItem } from './services/api';
import { WeatherWidget } from './components/WeatherWidget';

const ITEMS_PER_PAGE = 9;

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProvince, setSelectedProvince] = useState<string>('全部');
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'teal'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeProfileTab, setActiveProfileTab] = useState<'management' | 'favorites'>('favorites');
  const [viewCount, setViewCount] = useState<number>(0);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const hasIncrementedView = useRef(false);

  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('china_travel_user'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('china_travel_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [favoritesList, setFavoritesList] = useState<FavoriteItem[]>([]);
  const [favoritesIds, setFavoritesIds] = useState<Set<string>>(new Set());
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const staticProvinces = ['全部', '河南', '北京', '四川', '云南', '陕西', '浙江', '江苏', '广东', '湖南', '新疆', '上海', '西藏'];

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminModalTab, setAdminModalTab] = useState<'attraction' | 'notification' | 'settings'>('attraction');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const fetchPaginatedData = async (page: number, province: string, search: string) => {
    setIsDataLoading(true);
    try {
      const response = await api.attractions.getAll({ page, limit: ITEMS_PER_PAGE, province, search });
      setAttractions(response.data);
      setTotalPages(response.totalPages);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsDataLoading(false);
    }
  };

  const fetchFavorites = async (force: boolean = false) => {
    if (!force && !isAuthenticated) return;
    
    try {
      const data = await api.favorites.getAll();
      if (Array.isArray(data)) {
        setFavoritesList(data);
        setFavoritesIds(new Set(data.map(item => item.id)));
      }
    } catch (e) {
      console.warn('Fetch favorites failed');
    }
  };

  const handleIncrementStats = async () => {
    if (hasIncrementedView.current) return;
    try {
      const res = await api.stats.incrementViews();
      if (res && res.views) {
        setViewCount(res.views);
        hasIncrementedView.current = true;
      }
    } catch (e) {
      try {
        const res = await api.stats.getViews();
        if (res && res.views) setViewCount(res.views);
      } catch (err) {}
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPaginatedData(currentPage, selectedProvince, searchTerm);
    }, searchTerm ? 500 : 0);
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, selectedProvince, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProvince, searchTerm]);

  const handleLogoutAction = async () => {
    try {
      await api.auth.logout();
      handleAuthFailure();
      navigate('/login');
    } catch (e) {
      handleAuthFailure();
      navigate('/login');
    }
  };

  const handleAuthFailure = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('china_travel_user');
    setFavoritesList([]);
    setFavoritesIds(new Set());
  };

  useEffect(() => {
    const initializeApp = async () => {
      handleIncrementStats();
      try {
        const res = await api.auth.me();
        if (res.authenticated && res.user) {
          setIsAuthenticated(true);
          setCurrentUser(res.user);
          localStorage.setItem('china_travel_user', JSON.stringify(res.user));
          if (res.user.isAdmin) setActiveProfileTab('management');
          fetchFavorites(true);
        } else {
          handleAuthFailure();
        }
      } catch (e) {
        handleAuthFailure();
      } finally {
        setIsAuthChecking(false);
      }
    };
    initializeApp();
  }, []);

  const themes = {
    light: { primary: 'bg-teal-600', primaryText: 'text-teal-600', bg: 'bg-slate-50', cardBg: 'bg-white', text: 'text-slate-800', border: 'border-slate-200' },
    dark: { primary: 'bg-teal-500', primaryText: 'text-teal-400', bg: 'bg-slate-900', cardBg: 'bg-slate-800', text: 'text-white', border: 'border-slate-700' },
    teal: { primary: 'bg-teal-600', primaryText: 'text-teal-700', bg: 'bg-teal-50', cardBg: 'bg-white', text: 'text-teal-900', border: 'border-teal-100' }
  };
  const currentTheme = themes[theme];

  const handleToggleFavorite = async (e: React.MouseEvent | null, id: string) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (!isAuthenticated) { setIsLoginPromptOpen(true); return; }
    
    const isFav = favoritesIds.has(id);
    const newIds = new Set(favoritesIds);
    if (isFav) newIds.delete(id); else newIds.add(id);
    setFavoritesIds(newIds);
    
    try { 
      if (isFav) await api.favorites.remove(id); 
      else await api.favorites.add(id); 
      fetchFavorites(true);
    } catch(e) { 
      fetchFavorites(true); 
    }
  };

  const openAdminModal = (tab: 'attraction' | 'notification' | 'settings' = 'attraction', data: Attraction | null = null) => {
    setAdminModalTab(tab);
    setEditingAttraction(data);
    setIsAdminModalOpen(true);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${currentTheme.bg} ${currentTheme.text} font-sans selection:bg-teal-500 selection:text-white`}>
      <ScrollToTop />
      <Navbar 
        theme={theme} setTheme={setTheme}
        isAuthenticated={isAuthenticated} currentUser={currentUser}
        handleLogout={handleLogoutAction}
        setIsContactModalOpen={setIsContactModalOpen}
        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}
        onOpenAdminNotifications={() => openAdminModal('notification')}
        onNotificationVisibilityChange={setIsNotificationVisible}
      />

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" />
        )}
      </AnimatePresence>

      <WeatherWidget topOffset={isNotificationVisible ? 40 : 0} />

      {isAuthChecking && isDataLoading && attractions.length === 0 ? (
        <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-teal-500 animate-spin" /></div>
      ) : (
        <Routes>
          <Route path="/" element={
            <HomeContent 
              theme={theme} currentTheme={currentTheme} 
              searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
              isAuthenticated={isAuthenticated} currentUser={currentUser} 
              openAddModal={() => openAdminModal('attraction')} 
              selectedProvince={selectedProvince} setSelectedProvince={setSelectedProvince} 
              isDataLoading={isDataLoading} dynamicProvinces={staticProvinces} 
              filteredAttractions={attractions} handleToggleFavorite={handleToggleFavorite} 
              favorites={favoritesIds} setSelectedAttraction={setSelectedAttraction} 
              openEditModal={(e, a) => { e.stopPropagation(); openAdminModal('attraction', a); }}
              currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
            />} 
          />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/profile" /> : <div className="pt-32 pb-20 px-4 flex justify-center items-center min-h-screen"><div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${currentTheme.cardBg} ${currentTheme.border} border`}><LoginForm onLoginSuccess={() => { 
              setIsAuthChecking(true); 
              api.auth.me().then(res => { 
                if(res.authenticated && res.user){ 
                  setIsAuthenticated(true); 
                  setCurrentUser(res.user); 
                  localStorage.setItem('china_travel_user', JSON.stringify(res.user)); 
                  fetchFavorites(true);
                } 
                setIsAuthChecking(false); 
              }); 
            }} /></div></div>} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/profile" /> : <div className="pt-32 pb-20 px-4 flex justify-center items-center min-h-screen"><div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${currentTheme.cardBg} ${currentTheme.border} border`}><RegisterForm /></div></div>} />
          <Route path="/profile" element={isAuthenticated ? (
            <div className="pt-32 px-4 max-w-6xl mx-auto min-h-screen pb-20">
              <div className={`p-8 rounded-[2.5rem] ${currentTheme.cardBg} border ${currentTheme.border} shadow-2xl mb-10 relative overflow-hidden`}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20 transform rotate-3 shadow-inner">
                      <UserIcon className="w-10 h-10 text-teal-500" />
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <h1 className={`text-3xl font-black tracking-tight ${currentTheme.text}`}>{currentUser?.username}</h1>
                        {currentUser?.isAdmin && (
                          <span className="bg-red-500/10 text-red-500 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-red-500/20 inline-block w-fit mx-auto sm:mx-0">管理员</span>
                        )}
                      </div>
                      <p className={`mt-1.5 text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>您的个人旅行数字化中心</p>
                    </div>
                  </div>
                  <button onClick={handleLogoutAction} className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-red-500 hover:text-white text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-2xl transition-all font-bold text-sm shadow-sm">
                    <LogOut className="w-4 h-4" /> 退出登录
                  </button>
                </div>
              </div>
              <div className="mb-20">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                  <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <button onClick={() => setActiveProfileTab('favorites')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeProfileTab === 'favorites' ? 'bg-white dark:bg-slate-700 text-teal-500 shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}><Heart className="w-4 h-4" /> 我的收藏</button>
                    {currentUser?.isAdmin && (
                      <button onClick={() => setActiveProfileTab('management')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeProfileTab === 'management' ? 'bg-white dark:bg-slate-700 text-teal-500 shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}><ShieldCheck className="w-4 h-4" /> 景点管理</button>
                    )}
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  {activeProfileTab === 'favorites' ? (
                    <motion.div key="fav-grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {favoritesList.length > 0 ? (
                        favoritesList.map(item => (
                          <AttractionCard key={item.id} attraction={item} theme={theme} currentTheme={currentTheme} onClick={setSelectedAttraction} isFavorite={true} onToggleFavorite={handleToggleFavorite} note={item.note} />
                        ))
                      ) : (
                        <div className="col-span-full py-32 flex flex-col items-center text-slate-400 dark:text-slate-300">
                          <FolderHeart className="w-20 h-20 opacity-10 mb-6" />
                          <p className="font-bold text-lg">暂无收藏记录</p>
                          <Link to="/" className="text-teal-500 text-sm mt-4 hover:underline">去首页探索更多目的地</Link>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="admin-grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                       {attractions.map(attr => (
                          <div key={attr.id} className="relative group">
                            <AttractionCard attraction={attr} theme={theme} currentTheme={currentTheme} onClick={setSelectedAttraction} isFavorite={favoritesIds.has(attr.id)} onToggleFavorite={handleToggleFavorite} />
                            <button onClick={(e) => { e.stopPropagation(); openAdminModal('attraction', attr); }} className="absolute top-4 right-14 z-20 bg-white/90 backdrop-blur-md p-2.5 rounded-xl text-teal-600 shadow-xl transition-all opacity-0 group-hover:opacity-100"><Edit className="w-5 h-5" /></button>
                          </div>
                       ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : <Navigate to="/login" />} />
        </Routes>
      )}

      <footer className={`py-12 border-t ${currentTheme.border} ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
          <div className="flex items-center gap-8 py-4 px-8 rounded-2xl bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200 dark:border-slate-800">
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-1">今日浏览</span>
                <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-teal-500" /><span className="text-xl font-black text-slate-800 dark:text-white tabular-nums">{viewCount ? viewCount.toLocaleString() : '---'}</span></div>
             </div>
             <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-1">站点状态</span>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-sm font-bold text-slate-700 dark:text-slate-200">运行中</span></div>
             </div>
          </div>
          <p className="text-sm opacity-60 dark:opacity-80 font-bold tracking-wide text-slate-500 dark:text-slate-400">© 2025 China Travel Digital Experience.</p>
        </div>
      </footer>

      <DetailModal attraction={selectedAttraction} allAttractions={attractions} onClose={() => setSelectedAttraction(null)} isFavorite={selectedAttraction ? favoritesIds.has(selectedAttraction.id) : false} onToggleFavorite={handleToggleFavorite} theme={theme} />
      <FeedbackWidget isAuthenticated={isAuthenticated} onOpenLogin={() => setIsLoginPromptOpen(true)} />
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
      <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} defaultTab={adminModalTab} onSubmit={async (data) => { try { if (editingAttraction) await api.attractions.update(editingAttraction.id, data); else await api.attractions.create(data); setIsAdminModalOpen(false); fetchPaginatedData(currentPage, selectedProvince, searchTerm); } catch(e){ alert('操作失败'); } }} onDelete={async (id) => { if (confirm('确定删除此景点？')) { try { await api.attractions.delete(id); setIsAdminModalOpen(false); fetchPaginatedData(currentPage, selectedProvince, searchTerm); } catch(e){ alert('删除失败'); } } }} initialData={editingAttraction} />
      <LoginPromptModal isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
    </div>
  );
};

export default App;
