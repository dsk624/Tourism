
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
  const [activeProfileTab, setActiveProfileTab] = useState<'management' | 'favorites'>('favorites');
  const hasIncrementedView = useRef(false);

  // Auth & Admin State
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('china_travel_user'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('china_travel_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthChecking, setIsAuthChecking] = useState(() => !localStorage.getItem('china_travel_user'));

  // Favorites & Data State
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteNotes, setFavoriteNotes] = useState<Record<string, string>>({});
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Computed Provinces
  const dynamicProvinces = useMemo(() => {
    const allProvinces = attractions.map(a => a.province).filter(Boolean);
    return ['全部', ...Array.from(new Set(allProvinces))];
  }, [attractions]);

  // Modals
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);

  // Fetch Logic
  const fetchAttractions = async () => {
    setIsDataLoading(true);
    try {
      const data = await api.attractions.getAll();
      if (Array.isArray(data)) {
         setAttractions(data.map((item: any) => ({ ...item, imageUrl: item.image_url || item.imageUrl })));
      }
    } catch (e) { setAttractions([]); }
    finally { setIsDataLoading(false); }
  };

  const handleStats = async () => {
    if (hasIncrementedView.current) return;
    hasIncrementedView.current = true;
    try {
      const data = await api.stats.incrementViews();
      setViewCount(data.views);
    } catch (e) {
      try {
        const data = await api.stats.getViews();
        setViewCount(data.views);
      } catch (err) {}
    }
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await api.auth.me();
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
          localStorage.setItem('china_travel_user', JSON.stringify(data.user));
          if (data.user.isAdmin) setActiveProfileTab('management');
          fetchFavorites();
        } else { handleAuthFailure(); }
      } catch (e) { handleAuthFailure(); }
      finally { setIsAuthChecking(false); }
    };
    checkAuth();
    fetchAttractions();
    handleStats();
  }, []);

  const handleAuthFailure = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('china_travel_user');
    setFavorites(new Set());
    setFavoriteNotes({});
  };

  const fetchFavorites = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.favorites.getAll();
      setFavorites(new Set(data.favorites));
      if (data.notes) setFavoriteNotes(data.notes);
    } catch (e) {}
  };

  useEffect(() => {
    if (isAuthenticated) fetchFavorites();
    else { setFavorites(new Set()); setFavoriteNotes({}); }
  }, [isAuthenticated]);

  const themes = {
    light: { primary: 'bg-teal-600', primaryText: 'text-teal-600', bg: 'bg-slate-50', cardBg: 'bg-white', text: 'text-slate-800', border: 'border-slate-200' },
    dark: { primary: 'bg-teal-500', primaryText: 'text-teal-400', bg: 'bg-slate-900', cardBg: 'bg-slate-800', text: 'text-slate-100', border: 'border-slate-700' },
    teal: { primary: 'bg-teal-600', primaryText: 'text-teal-700', bg: 'bg-teal-50', cardBg: 'bg-white', text: 'text-teal-900', border: 'border-teal-100' }
  };
  const currentTheme = themes[theme];

  const { filteredAttractions, paginatedAttractions, totalPages } = useMemo(() => {
    let filtered = attractions;
    if (selectedProvince !== '全部') filtered = filtered.filter(a => a.province === selectedProvince);
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        (a.name || '').toLowerCase().includes(lowerTerm) || 
        (a.description || '').toLowerCase().includes(lowerTerm) ||
        (a.tags || []).some(tag => (tag || '').toLowerCase().includes(lowerTerm))
      );
    }
    const total = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    return { filteredAttractions: filtered, paginatedAttractions: paginated, totalPages: total };
  }, [selectedProvince, searchTerm, attractions, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProvince, searchTerm]);

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

        {isAuthChecking ? (
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
                dynamicProvinces={dynamicProvinces} 
                filteredAttractions={paginatedAttractions}
                handleToggleFavorite={handleToggleFavorite} 
                favorites={favorites} 
                setSelectedAttraction={setSelectedAttraction} 
                openEditModal={(e, a) => { e.stopPropagation(); setEditingAttraction(a); setIsAdminModalOpen(true); }}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />} 
            />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/profile" /> : <div className="pt-32 pb-20 px-4 flex justify-center items-center min-h-screen"><div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${currentTheme.cardBg} ${currentTheme.border} border`}><LoginForm onLoginSuccess={async () => { setIsAuthChecking(true); try { const data = await api.auth.me(); if(data.authenticated && data.user) { setIsAuthenticated(true); setCurrentUser(data.user); localStorage.setItem('china_travel_user', JSON.stringify(data.user)); } } catch(e){} setIsAuthChecking(false); }} /></div></div>} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/profile" /> : <div className="pt-32 pb-20 px-4 flex justify-center items-center min-h-screen"><div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${currentTheme.cardBg} ${currentTheme.border} border`}><RegisterForm /></div></div>} />
            <Route path="/profile" element={isAuthenticated ? (
              <div className="pt-32 px-4 max-w-6xl mx-auto min-h-screen pb-20">
                {/* User Info Header */}
                <div className={`p-8 rounded-3xl ${currentTheme.cardBg} border ${currentTheme.border} shadow-xl mb-10 relative overflow-hidden`}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20 transform rotate-3 shadow-inner">
                        <UserIcon className="w-10 h-10 text-teal-500" />
                      </div>
                      <div className="text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <h1 className="text-3xl font-black tracking-tight">{currentUser?.username}</h1>
                          {currentUser?.isAdmin && (
                            <span className="bg-red-500/10 text-red-500 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-red-500/20 inline-block w-fit mx-auto sm:mx-0">管理员</span>
                          )}
                        </div>
                        <p className="opacity-60 mt-1.5 text-sm font-medium">您的个人旅行数字化中心</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleLogoutAction}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700/50 hover:bg-red-500 hover:text-white border border-slate-200 dark:border-slate-600 rounded-2xl transition-all font-bold text-sm"
                    >
                      <LogOut className="w-4 h-4" /> 退出登录
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                </div>

                {/* Statistics Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                   {currentUser?.isAdmin && (
                    <>
                      <div className={`p-6 rounded-3xl ${currentTheme.cardBg} border ${currentTheme.border} shadow-sm group`}>
                         <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-teal-500/10 rounded-xl text-teal-500 group-hover:scale-110 transition-transform"><Map className="w-4 h-4" /></div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">总景点</span>
                         </div>
                         <div className="text-3xl font-black">{attractions.length}</div>
                      </div>
                      <div className={`p-6 rounded-3xl ${currentTheme.cardBg} border ${currentTheme.border} shadow-sm group`}>
                         <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 group-hover:scale-110 transition-transform"><Eye className="w-4 h-4" /></div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">总浏览量</span>
                         </div>
                         <div className="text-3xl font-black">{viewCount || '...'}</div>
                      </div>
                    </>
                   )}
                   <div className={`p-6 rounded-3xl ${currentTheme.cardBg} border ${currentTheme.border} shadow-sm group`}>
                      <div className="flex items-center gap-3 mb-3">
                         <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500 group-hover:scale-110 transition-transform"><Heart className="w-4 h-4" /></div>
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">我的收藏</span>
                      </div>
                      <div className="text-3xl font-black">{favorites.size}</div>
                   </div>
                   <div className={`p-6 rounded-3xl ${currentTheme.cardBg} border ${currentTheme.border} shadow-sm group`}>
                      <div className="flex items-center gap-3 mb-3">
                         <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 group-hover:scale-110 transition-transform"><BarChart3 className="w-4 h-4" /></div>
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">活动等级</span>
                      </div>
                      <div className="text-3xl font-black">LV.{Math.min(9, Math.floor(favorites.size / 5) + 1)}</div>
                   </div>
                </div>

                {/* Tabs */}
                {currentUser?.isAdmin && (
                  <div className="flex gap-1 mb-8 p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-fit">
                    <button 
                      onClick={() => setActiveProfileTab('management')}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeProfileTab === 'management' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Map className="w-4 h-4" /> 景点管理
                    </button>
                    <button 
                      onClick={() => setActiveProfileTab('favorites')}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeProfileTab === 'favorites' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Heart className="w-4 h-4" /> 我的收藏
                    </button>
                  </div>
                )}

                {/* Content Section */}
                <div className="mb-20">
                  <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-500">
                        {activeProfileTab === 'management' ? <Map className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                      </div>
                      {activeProfileTab === 'management' ? '管理概览' : '我的收藏记录'}
                    </h3>
                    {currentUser?.isAdmin && activeProfileTab === 'management' && (
                      <button 
                        onClick={() => { setEditingAttraction(null); setIsAdminModalOpen(true); }}
                        className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-teal-500/20 transition-all transform hover:-translate-y-0.5"
                      >
                        <Plus className="w-4 h-4" /> 新增景点
                      </button>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeProfileTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {activeProfileTab === 'management' ? (
                        attractions.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {attractions.map(a => (
                              <div key={a.id} className="relative group">
                                 <AttractionCard 
                                    attraction={a} 
                                    onClick={setSelectedAttraction} 
                                    theme={theme} 
                                    currentTheme={currentTheme} 
                                    isFavorite={favorites.has(a.id)} 
                                    onToggleFavorite={handleToggleFavorite} 
                                 />
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingAttraction(a); setIsAdminModalOpen(true); }}
                                    className="absolute top-4 right-14 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-2.5 rounded-xl text-teal-600 shadow-xl border border-teal-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                    title="编辑景点"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={`p-20 text-center rounded-[2.5rem] ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-100/50'} border-2 border-dashed ${currentTheme.border}`}>
                            <Map className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                            <p className="text-xl font-bold opacity-60 mb-6">数据库中尚无景点信息</p>
                            <button onClick={() => { setEditingAttraction(null); setIsAdminModalOpen(true); }} className="px-8 py-3 bg-teal-500 text-white rounded-2xl font-black shadow-lg shadow-teal-500/30">立即添加第一个景点</button>
                          </div>
                        )
                      ) : (
                        favorites.size > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {attractions.filter(a => favorites.has(a.id)).map(a => (
                              <AttractionCard 
                                key={a.id} 
                                attraction={a} 
                                onClick={setSelectedAttraction} 
                                theme={theme} 
                                currentTheme={currentTheme} 
                                isFavorite={true} 
                                onToggleFavorite={handleToggleFavorite} 
                                note={favoriteNotes[a.id]} 
                                onUpdateNote={async (id, note) => { 
                                  if (!isAuthenticated) return; 
                                  setFavoriteNotes(prev => ({ ...prev, [id]: note })); 
                                  try { await api.favorites.updateNote(id, note); } catch(e){} 
                                }} 
                              />
                            ))}
                          </div>
                        ) : (
                          <div className={`p-20 text-center rounded-[2.5rem] ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-100/50'} border-2 border-dashed ${currentTheme.border}`}>
                            <Heart className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                            <p className="text-xl font-bold opacity-60 mb-6">您还没有收藏任何精彩景点</p>
                            <Link to="/"><button className="px-8 py-3 bg-teal-500 text-white rounded-2xl font-black shadow-lg shadow-teal-500/30">去探索发现</button></Link>
                          </div>
                        )
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            ) : <Navigate to="/login" />} />
          </Routes>
        )}

        <footer className={`py-16 border-t ${currentTheme.border} ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex justify-center items-center gap-3 mb-6 opacity-60">
              <div className="w-10 h-1 bg-teal-500 rounded-full"></div>
              <span className="font-black tracking-tighter text-xl uppercase">华夏游</span>
              <div className="w-10 h-1 bg-teal-500 rounded-full"></div>
            </div>
            
            <div className="flex flex-col items-center gap-2 mb-8">
               <div className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 text-sm font-bold border border-slate-300/30 dark:border-slate-700/30 shadow-inner">
                  <Eye className="w-4 h-4 text-teal-500" />
                  <span className="opacity-60">全站浏览量统计：</span>
                  <span className="text-teal-500 font-black tracking-widest">{viewCount !== null ? viewCount.toLocaleString() : '数据同步中...'}</span>
               </div>
            </div>

            <p className="text-xs opacity-40 font-medium tracking-wide">© 2025 China Travel Digital Experience. Powered by Cloudflare D1 & React 19.</p>
          </div>
        </footer>

        <DetailModal attraction={selectedAttraction} allAttractions={attractions} onClose={() => setSelectedAttraction(null)} isFavorite={selectedAttraction ? favorites.has(selectedAttraction.id) : false} onToggleFavorite={handleToggleFavorite} />
        <FeedbackWidget />
        <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
        <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} onSubmit={async (data) => { try { if (editingAttraction) await api.attractions.update(editingAttraction.id, data); else await api.attractions.create(data); setIsAdminModalOpen(false); fetchAttractions(); } catch(e){ alert('操作失败'); } }} onDelete={async (id) => { if (confirm('确定删除此景点？')) { try { await api.attractions.delete(id); setIsAdminModalOpen(false); fetchAttractions(); } catch(e){ alert('删除失败'); } } }} initialData={editingAttraction} />
        <LoginPromptModal isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
      </div>
    </Router>
  );
};

export default App;
