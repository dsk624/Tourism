
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
import { User as UserIcon, Map, Loader2, Eye } from 'lucide-react';
import { api } from './services/api';

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
      // If increment fails, try just getting the current count
      try {
        const data = await api.stats.getViews();
        setViewCount(data.views);
      } catch (err) {}
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

  const filteredAttractions = useMemo(() => {
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
    return filtered;
  }, [selectedProvince, searchTerm, attractions]);

  return (
    <Router>
      <ScrollToTop />
      <div className={`min-h-screen transition-colors duration-500 ${currentTheme.bg} ${currentTheme.text} font-sans selection:bg-teal-500 selection:text-white`}>
        <Navbar 
          theme={theme} setTheme={setTheme}
          isAuthenticated={isAuthenticated} currentUser={currentUser}
          handleLogout={async () => { try { await api.auth.logout(); handleAuthFailure(); window.location.href = '/login'; } catch(e){} }}
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
            <Route path="/" element={<HomeContent theme={theme} currentTheme={currentTheme} searchTerm={searchTerm} setSearchTerm={setSearchTerm} isAuthenticated={isAuthenticated} currentUser={currentUser} openAddModal={() => { setEditingAttraction(null); setIsAdminModalOpen(true); }} selectedProvince={selectedProvince} setSelectedProvince={setSelectedProvince} isDataLoading={isDataLoading} dynamicProvinces={dynamicProvinces} filteredAttractions={filteredAttractions} handleToggleFavorite={async (e, id) => {
              if (e) { e.stopPropagation(); e.preventDefault(); }
              if (!isAuthenticated) { setIsLoginPromptOpen(true); return; }
              const isFav = favorites.has(id);
              if (isFav && favoriteNotes[id] && !window.confirm("取消收藏将同步删除备注，确定？")) return;
              const newFavs = new Set(favorites); if (isFav) newFavs.delete(id); else newFavs.add(id);
              setFavorites(newFavs);
              try { if (isFav) await api.favorites.remove(id); else await api.favorites.add(id); } catch(e) { fetchFavorites(); }
            }} favorites={favorites} setSelectedAttraction={setSelectedAttraction} openEditModal={(e, a) => { e.stopPropagation(); setEditingAttraction(a); setIsAdminModalOpen(true); }} />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/profile" /> : <div className="pt-32 pb-20 px-4 flex justify-center items-center min-h-screen"><div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${currentTheme.cardBg} ${currentTheme.border} border`}><LoginForm onLoginSuccess={async () => { setIsAuthChecking(true); try { const data = await api.auth.me(); if(data.authenticated && data.user) { setIsAuthenticated(true); setCurrentUser(data.user); localStorage.setItem('china_travel_user', JSON.stringify(data.user)); } } catch(e){} setIsAuthChecking(false); }} /></div></div>} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/profile" /> : <div className="pt-32 pb-20 px-4 flex justify-center items-center min-h-screen"><div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${currentTheme.cardBg} ${currentTheme.border} border`}><RegisterForm /></div></div>} />
            <Route path="/profile" element={isAuthenticated ? (
              <div className="pt-32 px-4 max-w-6xl mx-auto min-h-screen pb-20">
                <div className={`p-8 rounded-3xl ${currentTheme.cardBg} border ${currentTheme.border} shadow-xl mb-10`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/20"><UserIcon className="w-8 h-8 text-teal-500" /></div>
                    <div>
                      <div className="flex items-center gap-2"><h1 className="text-3xl font-bold">{currentUser?.username}</h1>{currentUser?.isAdmin && <span className="bg-red-500/10 text-red-500 text-xs px-2 py-1 rounded-full font-bold border border-red-500/20">管理员</span>}</div>
                      <p className="opacity-70 mt-1">欢迎回来，您的旅行数据已通过 D1 数据库同步。</p>
                    </div>
                  </div>
                </div>
                <div className="mb-10">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 px-2"><div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">{currentUser?.isAdmin ? <Map className="w-5 h-5" /> : <div className="text-red-500">❤</div>}</div>{currentUser?.isAdmin ? '管理概览' : '我的旅行收藏'}</h3>
                  {!currentUser?.isAdmin && (favorites.size > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{attractions.filter(a => favorites.has(a.id)).map(a => <AttractionCard key={a.id} attraction={a} onClick={setSelectedAttraction} theme={theme} currentTheme={currentTheme} isFavorite={true} onToggleFavorite={() => {}} note={favoriteNotes[a.id]} onUpdateNote={async (id, note) => { if (!isAuthenticated) return; setFavoriteNotes(prev => ({ ...prev, [id]: note })); try { await api.favorites.updateNote(id, note); } catch(e){} }} />)}</div> : <div className={`p-12 text-center rounded-2xl ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50'} border ${currentTheme.border} border-dashed`}><p className="text-lg opacity-60 mb-4">暂无收藏</p><Link to="/"><button className="px-6 py-2 bg-teal-500 text-white rounded-full font-medium">去探索</button></Link></div>)}
                </div>
              </div>
            ) : <Navigate to="/login" />} />
          </Routes>
        )}

        <footer className={`py-12 border-t ${currentTheme.border} ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex justify-center items-center gap-2 mb-4 opacity-50"><div className="w-5 h-5 bg-teal-500/50 rounded-full"></div><span className="font-bold">华夏游</span></div>
            
            {/* 浏览量统计展示 */}
            <div className="flex flex-col items-center gap-2 mb-6">
               <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-xs font-medium border border-slate-300/30 dark:border-slate-700/30">
                  <Eye className="w-3.5 h-3.5 text-teal-500" />
                  <span className="opacity-60">全站浏览量：</span>
                  <span className="text-teal-500 font-bold">{viewCount !== null ? viewCount.toLocaleString() : '...'}</span>
               </div>
            </div>

            <p className="text-sm opacity-40">© 2025 China Travel Guide. Powered by Cloudflare Pages & D1.</p>
          </div>
        </footer>

        <DetailModal attraction={selectedAttraction} allAttractions={attractions} onClose={() => setSelectedAttraction(null)} isFavorite={selectedAttraction ? favorites.has(selectedAttraction.id) : false} onToggleFavorite={() => {}} />
        <FeedbackWidget />
        <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
        <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} onSubmit={async (data) => { try { if (editingAttraction) await api.attractions.update(editingAttraction.id, data); else await api.attractions.create(data); setIsAdminModalOpen(false); fetchAttractions(); } catch(e){ alert('操作失败'); } }} onDelete={async (id) => { if (confirm('确定删除？')) { try { await api.attractions.delete(id); setIsAdminModalOpen(false); fetchAttractions(); } catch(e){ alert('失败'); } } }} initialData={editingAttraction} />
        <LoginPromptModal isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
      </div>
    </Router>
  );
};

export default App;
