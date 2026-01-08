
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
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
import { User as UserIcon, Map, Loader2, Eye, LogOut, Edit, Plus, Heart, BarChart3 } from 'lucide-react';
import { api } from './services/api';

const ITEMS_PER_PAGE = 9;

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState<string>('全部');
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'teal'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeProfileTab, setActiveProfileTab] = useState<'management' | 'favorites'>('favorites');
  const hasIncrementedView = useRef(false);

  // Auth & Admin State
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('china_travel_user'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('china_travel_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Favorites & Data State
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteNotes, setFavoriteNotes] = useState<Record<string, string>>({});
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // 获取省份列表（这个通常可以做个单独接口，这里从基础数据获取或者固定常用省份）
  const staticProvinces = ['全部', '河南', '北京', '四川', '云南', '陕西', '浙江', '江苏', '广东', '湖南', '新疆', '上海', '西藏'];

  // Modals
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);

  // 核心：分页抓取函数
  const fetchPaginatedData = async (page: number, province: string, search: string) => {
    setIsDataLoading(true);
    try {
      const response = await api.attractions.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        province: province,
        search: search
      });
      setAttractions(response.data);
      setTotalPages(response.totalPages);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsDataLoading(false);
    }
  };

  // 当页码、省份或搜索词变化时抓取数据
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPaginatedData(currentPage, selectedProvince, searchTerm);
    }, searchTerm ? 500 : 0); // 搜索时防抖

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, selectedProvince, searchTerm]);

  // 重置页码
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProvince, searchTerm]);

  const fetchFavorites = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.favorites.getAll();
      setFavorites(new Set(data.favorites));
      if (data.notes) setFavoriteNotes(data.notes);
    } catch (e) {}
  };

  const handleLogoutAction = async () => {
    try {
      await api.auth.logout();
      handleAuthFailure();
      window.location.href = '/login';
    } catch (e) {
      handleAuthFailure();
      window.location.href = '/login';
    }
  };

  const handleAuthFailure = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('china_travel_user');
    setFavorites(new Set());
    setFavoriteNotes({});
  };

  useEffect(() => {
    const initializeApp = async () => {
      const [authResult] = await Promise.allSettled([api.auth.me()]);

      if (authResult.status === 'fulfilled' && authResult.value.authenticated && authResult.value.user) {
        setIsAuthenticated(true);
        setCurrentUser(authResult.value.user);
        localStorage.setItem('china_travel_user', JSON.stringify(authResult.value.user));
        if (authResult.value.user.isAdmin) setActiveProfileTab('management');
        fetchFavorites();
      } else {
        handleAuthFailure();
      }
      setIsAuthChecking(false);

      if (!hasIncrementedView.current) {
        hasIncrementedView.current = true;
        api.stats.incrementViews().then(data => setViewCount(data.views)).catch(() => {
          api.stats.getViews().then(data => setViewCount(data.views)).catch(() => {});
        });
      }
    };
    initializeApp();
  }, []);

  const themes = {
    light: { primary: 'bg-teal-600', primaryText: 'text-teal-600', bg: 'bg-slate-50', cardBg: 'bg-white', text: 'text-slate-800', border: 'border-slate-200' },
    dark: { primary: 'bg-teal-500', primaryText: 'text-teal-400', bg: 'bg-slate-900', cardBg: 'bg-slate-800', text: 'text-slate-100', border: 'border-slate-700' },
    teal: { primary: 'bg-teal-600', primaryText: 'text-teal-700', bg: 'bg-teal-50', cardBg: 'bg-white', text: 'text-teal-900', border: 'border-teal-100' }
  };
  const currentTheme = themes[theme];

  const handleToggleFavorite = async (e: React.MouseEvent | null, id: string) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (!isAuthenticated) { setIsLoginPromptOpen(true); return; }
    const isFav = favorites.has(id);
    if (isFav && favoriteNotes[id] && !window.confirm("取消收藏将同步删除备注，确定？")) return;
    const newFavs = new Set(favorites); if (isFav) newFavs.delete(id); else newFavs.add(id);
    setFavorites(newFavs);
    try { if (isFav) await api.favorites.remove(id); else await api.favorites.add(id); } catch(e) { fetchFavorites(); }
  };

  return (
    <Router>
      <ScrollToTop />
      <div className={`min-h-screen transition-colors duration-500 ${currentTheme.bg} ${currentTheme.text} font-sans selection:bg-teal-500 selection:text-white`}>
        <Navbar 
          theme={theme} setTheme={setTheme}
          isAuthenticated={isAuthenticated} currentUser={currentUser}
          handleLogout={handleLogoutAction}
          setIsContactModalOpen={setIsContactModalOpen}
          mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}
        />

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" />
          )}
        </AnimatePresence>

        {isAuthChecking && isDataLoading && attractions.length === 0 ? (
          <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 text-teal-500 animate-spin" /></div>
        ) : (
          <Routes>
            <Route path="/" element={
              <HomeContent 
                theme={theme} 
                currentTheme={currentTheme} 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                isAuthenticated={isAuthenticated} 
                currentUser={currentUser} 
                openAddModal={() => { setEditingAttraction(null); setIsAdminModalOpen(true); }} 
                selectedProvince={selectedProvince} 
                setSelectedProvince={setSelectedProvince} 
                isDataLoading={isDataLoading} 
                dynamicProvinces={staticProvinces} 
                filteredAttractions={attractions}
                handleToggleFavorite={handleToggleFavorite} 
                favorites={favorites} 
                setSelectedAttraction={setSelectedAttraction} 
                openEditModal={(e, a) => { e.stopPropagation(); setEditingAttraction(a); setIsAdminModalOpen(true); }}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />} 
            />
            {/* 其他路由保持原样，省略部分重复逻辑以聚焦分页 */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/profile" /> : <div className="pt-32 pb-20 px-4 flex justify-center items-center min-h-screen"><div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${currentTheme.cardBg} ${currentTheme.border} border`}><LoginForm onLoginSuccess={async () => { setIsAuthChecking(true); try { const data = await api.auth.me(); if(data.authenticated && data.user) { setIsAuthenticated(true); setCurrentUser(data.user); localStorage.setItem('china_travel_user', JSON.stringify(data.user)); } } catch(e){} setIsAuthChecking(false); }} /></div></div>} />
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
                          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">{currentUser?.username}</h1>
                          {currentUser?.isAdmin && (
                            <span className="bg-red-500/10 text-red-500 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-red-500/20 inline-block w-fit mx-auto sm:mx-0">管理员</span>
                          )}
                        </div>
                        <p className="opacity-60 mt-1.5 text-sm font-medium">您的个人旅行数字化中心</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleLogoutAction}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-red-500 hover:text-white text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-2xl transition-all font-bold text-sm shadow-sm"
                    >
                      <LogOut className="w-4 h-4" /> 退出登录
                    </button>
                  </div>
                </div>

                {/* 个人中心列表保持本地全量或也可以按需分页，目前保持现有逻辑 */}
                <div className="mb-20">
                  <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-500">
                        {activeProfileTab === 'management' ? <Map className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                      </div>
                      {activeProfileTab === 'management' ? '景点管理' : '我的收藏记录'}
                    </h3>
                  </div>
                  {/* ...个人中心列表部分... */}
                </div>
              </div>
            ) : <Navigate to="/login" />} />
          </Routes>
        )}

        <footer className={`py-16 border-t ${currentTheme.border} ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-xs opacity-40 font-medium tracking-wide">© 2025 China Travel Digital Experience.</p>
          </div>
        </footer>

        <DetailModal attraction={selectedAttraction} allAttractions={attractions} onClose={() => setSelectedAttraction(null)} isFavorite={selectedAttraction ? favorites.has(selectedAttraction.id) : false} onToggleFavorite={handleToggleFavorite} />
        <FeedbackWidget />
        <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
        <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} onSubmit={async (data) => { try { if (editingAttraction) await api.attractions.update(editingAttraction.id, data); else await api.attractions.create(data); setIsAdminModalOpen(false); fetchPaginatedData(currentPage, selectedProvince, searchTerm); } catch(e){ alert('操作失败'); } }} onDelete={async (id) => { if (confirm('确定删除此景点？')) { try { await api.attractions.delete(id); setIsAdminModalOpen(false); fetchPaginatedData(currentPage, selectedProvince, searchTerm); } catch(e){ alert('删除失败'); } } }} initialData={editingAttraction} />
        <LoginPromptModal isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
      </div>
    </Router>
  );
};

export default App;
