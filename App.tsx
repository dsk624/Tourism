
import React, { useState, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { HomeContent } from './components/HomeContent';
import { AttractionCard } from './components/AttractionCard';
import { WeatherWidget } from './components/WeatherWidget';
import { api, FavoriteItem } from './services/api';
import { Attraction, User } from './types';
import { User as UserIcon, Map, Loader2, LogOut, Edit, Heart, FolderHeart, ShieldCheck, Eye } from 'lucide-react';

// 懒加载组件
const DetailModal = lazy(() => import('./components/DetailModal').then(module => ({ default: module.DetailModal })));
const AdminModal = lazy(() => import('./components/AdminModal').then(module => ({ default: module.AdminModal })));
const ContactModal = lazy(() => import('./components/ContactModal').then(module => ({ default: module.ContactModal })));
const LoginPromptModal = lazy(() => import('./components/LoginPromptModal').then(module => ({ default: module.LoginPromptModal })));
const CalendarModal = lazy(() => import('./components/CalendarModal').then(module => ({ default: module.CalendarModal })));
const ProfileView = lazy(() => import('./components/ProfileView').then(module => ({ default: module.ProfileView })));
const LoginForm = lazy(() => import('./components/LoginForm'));
const RegisterForm = lazy(() => import('./components/RegisterForm'));
const FeedbackWidget = lazy(() => import('./components/FeedbackWidget').then(module => ({ default: module.FeedbackWidget })));

const ITEMS_PER_PAGE = 9;

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// 增强版全局加载页
const PageLoader = () => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900"
  >
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-teal-500 font-black text-[10px] tracking-[0.4em] uppercase"
      >
        China Travel · 华夏游
      </motion.p>
    </div>
  </motion.div>
);

const App: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProvince, setSelectedProvince] = useState<string>('全部');
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'teal'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewCount, setViewCount] = useState<number>(0);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('china_travel_user'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('china_travel_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [favoritesIds, setFavoritesIds] = useState<Set<string>>(new Set());
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isFavoriteActionLoading, setIsFavoriteActionLoading] = useState<string | null>(null);

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
        setFavoritesIds(new Set(data.map(item => item.id)));
      }
    } catch (e) {
      console.warn('Fetch favorites failed');
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPaginatedData(currentPage, selectedProvince, searchTerm);
    }, searchTerm ? 400 : 0);
    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, selectedProvince, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProvince, searchTerm]);

  useEffect(() => {
    const initializeApp = async () => {
      setIsAuthChecking(true);
      const tasks = [
        api.auth.me().catch(() => ({ authenticated: false })),
        api.stats.incrementViews().catch(() => null),
        api.stats.getViews().catch(() => ({ views: 0 }))
      ];

      const [authRes, incRes, viewsRes] = await Promise.all(tasks);

      if (authRes?.authenticated && authRes?.user) {
        setIsAuthenticated(true);
        setCurrentUser(authRes.user);
        localStorage.setItem('china_travel_user', JSON.stringify(authRes.user));
        fetchFavorites(true);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem('china_travel_user');
      }

      if (viewsRes) setViewCount(viewsRes.views);
      setIsAuthChecking(false);
    };

    initializeApp();
  }, []);

  const themes = {
    light: { primary: 'bg-teal-600', bg: 'bg-slate-50', cardBg: 'bg-white', text: 'text-slate-800', border: 'border-slate-200' },
    dark: { primary: 'bg-teal-500', bg: 'bg-slate-900', cardBg: 'bg-slate-800', text: 'text-white', border: 'border-slate-700' },
    teal: { primary: 'bg-teal-600', bg: 'bg-teal-50', cardBg: 'bg-white', text: 'text-teal-900', border: 'border-teal-100' }
  };
  const currentTheme = themes[theme];

  const handleLogoutAction = () => {
    api.auth.logout();
    localStorage.removeItem('china_travel_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate('/');
    location.reload();
  };

  const handleToggleFavorite = async (e: React.MouseEvent | null, id: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // 关键：阻止事件冒泡到卡片的 onClick
    }

    if (!isAuthenticated) {
      setIsLoginPromptOpen(true);
      return;
    }

    if (isFavoriteActionLoading === id) return;

    setIsFavoriteActionLoading(id);
    try {
      if (favoritesIds.has(id)) {
        await api.favorites.remove(id);
      } else {
        await api.favorites.add(id);
      }
      await fetchFavorites(true);
    } catch (err) {
      console.error('Favorite action failed', err);
    } finally {
      setIsFavoriteActionLoading(null);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${currentTheme.bg} ${currentTheme.text} font-sans selection:bg-teal-500 selection:text-white`}>
      <ScrollToTop />
      
      <AnimatePresence>
        {isAuthChecking && <PageLoader />}
      </AnimatePresence>

      <Navbar 
        theme={theme} setTheme={setTheme}
        isAuthenticated={isAuthenticated} currentUser={currentUser}
        handleLogout={handleLogoutAction}
        setIsContactModalOpen={setIsContactModalOpen}
        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}
        onOpenAdminNotifications={() => { setAdminModalTab('notification'); setIsAdminModalOpen(true); }}
        onNotificationVisibilityChange={setIsNotificationVisible}
        onOpenCalendar={() => setIsCalendarOpen(true)}
      />

      <WeatherWidget topOffset={isNotificationVisible ? 40 : 0} />

      <Suspense fallback={<PageLoader />}>
        {!isAuthChecking && (
          <Routes>
            <Route path="/" element={
              <HomeContent 
                theme={theme} currentTheme={currentTheme} 
                searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
                isAuthenticated={isAuthenticated} currentUser={currentUser} 
                openAddModal={() => { setAdminModalTab('attraction'); setIsAdminModalOpen(true); }} 
                selectedProvince={selectedProvince} setSelectedProvince={setSelectedProvince} 
                isDataLoading={isDataLoading} dynamicProvinces={staticProvinces} 
                filteredAttractions={attractions} 
                handleToggleFavorite={handleToggleFavorite} 
                favorites={favoritesIds} 
                setSelectedAttraction={setSelectedAttraction} 
                openEditModal={(e, a) => { e.stopPropagation(); setEditingAttraction(a); setIsAdminModalOpen(true); }}
                currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
                favoriteActionLoadingId={isFavoriteActionLoading}
              />} 
            />
            <Route path="/login" element={<div className="pt-32 max-w-md mx-auto px-4 pb-20"><LoginForm onLoginSuccess={() => { setIsAuthenticated(true); navigate('/profile'); }} /></div>} />
            <Route path="/profile" element={
              isAuthenticated ? (
                <ProfileView 
                  currentUser={currentUser} 
                  theme={theme} 
                  currentTheme={currentTheme} 
                  handleLogout={handleLogoutAction}
                  onSelectAttraction={setSelectedAttraction}
                  onToggleFavorite={handleToggleFavorite}
                  favoriteActionLoadingId={isFavoriteActionLoading}
                />
              ) : <Navigate to="/login" />
            } />
          </Routes>
        )}

        <footer className={`py-12 border-t ${currentTheme.border} ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
            <div className="flex items-center gap-8 py-4 px-8 rounded-2xl bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200 dark:border-slate-800">
               <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-1">站点浏览</span>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-teal-500" />
                    <span className="text-xl font-black text-slate-800 dark:text-white">
                      {viewCount > 0 ? viewCount.toLocaleString() : '---'}
                    </span>
                  </div>
               </div>
            </div>
            <p className="text-sm opacity-60 font-bold tracking-wide">© 2025 China Travel Digital Experience.</p>
          </div>
        </footer>

        {selectedAttraction && (
          <DetailModal 
            attraction={selectedAttraction} 
            allAttractions={attractions} 
            onClose={() => setSelectedAttraction(null)} 
            theme={theme} 
            isFavorite={favoritesIds.has(selectedAttraction.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
        <FeedbackWidget isAuthenticated={isAuthenticated} onOpenLogin={() => setIsLoginPromptOpen(true)} />
        <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
        {isAdminModalOpen && <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} defaultTab={adminModalTab} initialData={editingAttraction} onSubmit={async () => location.reload()} />}
        <LoginPromptModal isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
        <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} isAuthenticated={isAuthenticated} />
      </Suspense>
    </div>
  );
};

export default App;
