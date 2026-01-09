
import React, { useEffect, useState } from 'react';
import { Search, Plus, Loader2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion as FMotion, AnimatePresence as FAnimatePresence } from 'framer-motion';
import { AttractionCard } from './AttractionCard';
import { Attraction, User } from '../types';
import { api } from '../services/api';

interface HomeContentProps {
  theme: 'light' | 'dark' | 'teal';
  currentTheme: any;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isAuthenticated: boolean;
  currentUser: User | null;
  openAddModal: () => void;
  selectedProvince: string;
  setSelectedProvince: (province: string) => void;
  isDataLoading: boolean;
  dynamicProvinces: string[];
  filteredAttractions: Attraction[];
  handleToggleFavorite: (e: React.MouseEvent | null, id: string) => void;
  favorites: Set<string>;
  setSelectedAttraction: (attraction: Attraction | null) => void;
  openEditModal: (e: React.MouseEvent, attraction: Attraction) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const HomeContent: React.FC<HomeContentProps> = ({
  theme,
  currentTheme,
  searchTerm,
  setSearchTerm,
  isAuthenticated,
  currentUser,
  openAddModal,
  selectedProvince,
  setSelectedProvince,
  isDataLoading,
  dynamicProvinces,
  filteredAttractions,
  handleToggleFavorite,
  favorites,
  setSelectedAttraction,
  openEditModal,
  currentPage,
  totalPages,
  onPageChange
}) => {
  const [settings, setSettings] = useState({
    hero_badge: 'Discover The Oriental Beauty',
    hero_title_main: '探索',
    hero_title_highlight: '锦绣中华',
    hero_subtitle: '从古老的河南腹地出发，丈量每一寸山河。沉浸式旅行体验，带您领略千年文化的独特魅力。'
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const data = await api.settings.get();
      if (data && Object.keys(data).length > 0) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.warn('Using default hero text');
    } finally {
      setIsSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener('siteSettingsUpdated', loadSettings);
    return () => window.removeEventListener('siteSettingsUpdated', loadSettings);
  }, []);

  return (
    <>
      <div className="relative pt-24 sm:pt-32">
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900">
          <img 
            src="https://picsum.photos/1200/800?random=99" 
            className="w-full h-[450px] sm:h-[600px] object-cover opacity-80"
            alt="Hero Background"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />
          <div className={`absolute inset-0 bg-gradient-to-b ${theme === 'dark' ? 'from-slate-900/40 via-slate-900/80 to-slate-900' : 'from-slate-900/20 via-slate-900/50 to-slate-50'}`} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-32 text-center">
          <FAnimatePresence mode="wait">
            {isSettingsLoading ? (
              <FMotion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[280px] flex items-center justify-center">
                 <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              </FMotion.div>
            ) : (
              <FMotion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-block px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-sm">
                  {settings.hero_badge}
                </span>
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-none drop-shadow-2xl">
                  {settings.hero_title_main}<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">{settings.hero_title_highlight}</span>
                </h1>
                <p className="text-slate-200 text-sm sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed px-4 opacity-90 drop-shadow">
                  {settings.hero_subtitle}
                </p>

                <div className="relative max-w-xl mx-auto group px-2">
                  <div className="absolute inset-0 bg-teal-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative flex items-center bg-white/95 backdrop-blur-2xl shadow-2xl rounded-[2rem] p-1.5 focus-within:bg-white transition-all">
                    <div className="pl-4 pr-2"><Search className="w-5 h-5 text-teal-600" /></div>
                    <input type="text" placeholder="发现下一个目的地..." className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-500 py-3 text-base font-bold outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
              </FMotion.div>
            )}
          </FAnimatePresence>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 -mt-10 sm:-mt-16 relative z-20">
        <div className="mb-12">
          <div className="flex overflow-x-auto no-scrollbar sm:justify-center py-2">
            <div className={`inline-flex p-1.5 rounded-2xl ${theme === 'dark' ? 'bg-slate-800/80 border border-slate-700' : 'bg-white border border-slate-200'} backdrop-blur-xl shadow-xl whitespace-nowrap`}>
              {dynamicProvinces.map((province) => (
                <button
                  key={province}
                  onClick={() => setSelectedProvince(province)}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 ${
                    selectedProvince === province
                      ? 'bg-teal-500 text-white shadow-lg'
                      : `${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
                  }`}
                >
                  {province}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isDataLoading ? (
          <div className="flex justify-center items-center py-32"><Loader2 className="w-10 h-10 text-teal-500 animate-spin" /></div>
        ) : (
          <FMotion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {filteredAttractions.map((attr) => (
                <div key={attr.id} className="relative group">
                  <AttractionCard attraction={attr} theme={theme} currentTheme={currentTheme} onClick={setSelectedAttraction} isFavorite={favorites.has(attr.id)} onToggleFavorite={handleToggleFavorite} />
                  {isAuthenticated && currentUser?.isAdmin && (
                    <button onClick={(e) => openEditModal(e, attr)} className="absolute top-4 right-14 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl text-teal-600 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"><Edit className="w-4 h-4" /></button>
                  )}
                </div>
             ))}
          </FMotion.div>
        )}

        {totalPages > 1 && (
          <div className="mt-20 flex justify-center items-center gap-6">
            <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="p-3 rounded-2xl border dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><ChevronLeft className="w-6 h-6" /></button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => onPageChange(p)} className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${currentPage === p ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{p}</button>
              ))}
            </div>
            <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="p-3 rounded-2xl border dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><ChevronRight className="w-6 h-6" /></button>
          </div>
        )}
      </main>
    </>
  );
};
