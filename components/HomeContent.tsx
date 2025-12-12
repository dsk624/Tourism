import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Loader2, Edit } from 'lucide-react';
import { WeatherWidget } from './WeatherWidget';
import { AttractionCard } from './AttractionCard';
import { Attraction, User } from '../types';

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
  openEditModal
}) => {
  return (
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
              从古老的河南腹地出发，丈量每一寸山河。沉浸式旅行体验，带您领略千年文化的独特魅力。
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
            {isDataLoading ? (
               <div className="px-5 py-2.5 text-slate-400">加载地区...</div>
            ) : (
              dynamicProvinces.map((province) => (
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
              ))
            )}
          </div>
        </div>

        {/* Grid */}
        {isDataLoading ? (
          <div className="flex justify-center items-center py-20">
             <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
          </div>
        ) : (
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
                    searchTerm={searchTerm}
                    isFavorite={favorites.has(attraction.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                  
                  {isAuthenticated && currentUser?.isAdmin && (
                    <button 
                      onClick={(e) => openEditModal(e, attraction)}
                      className="absolute top-4 right-14 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
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
        )}
      </main>
    </>
  );
};