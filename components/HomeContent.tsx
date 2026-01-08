
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Loader2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
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
  return (
    <>
      <div className="relative pt-16 sm:pt-20">
        {/* 此处原有的 WeatherWidget 已移除，改为由 App.tsx 统一渲染 */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/1920/1080?random=99" 
            className="w-full h-[400px] sm:h-[500px] object-cover opacity-90 animate__animated animate__fadeIn"
            alt="Hero Background" 
          />
          <div className={`absolute inset-0 bg-gradient-to-b ${theme === 'dark' ? 'from-slate-900/40 via-slate-900/80 to-slate-900' : 'from-slate-900/20 via-slate-900/50 to-slate-50'}`} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-20 sm:pb-24 text-center">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-4 sm:mb-6 backdrop-blur-sm animate__animated animate__fadeInDown">
              Discover The Oriental Beauty
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-tight animate__animated animate__fadeInDown animate__delay-0.5s">
              探索<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">锦绣中华</span>
            </h1>
            <p className="text-slate-200 text-sm sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 font-light leading-relaxed px-4 animate__animated animate__fadeInUp animate__delay-0.5s">
              从古老的河南腹地出发，丈量每一寸山河。沉浸式旅行体验，带您领略千年文化的独特魅力。
            </p>

            <div className="relative max-w-lg mx-auto group animate__animated animate__fadeInUp animate__delay-1s px-2">
              <div className="absolute inset-0 bg-teal-500/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
              
              <div className="relative flex items-center bg-white/80 backdrop-blur-md shadow-2xl shadow-teal-900/20 rounded-full p-1 sm:p-1.5 transition-all transform focus-within:bg-white">
                <div className="pl-3 pr-2">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                </div>
                <input 
                  type="text"
                  placeholder="搜索景点、历史或文化..."
                  className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-600 px-2 py-1.5 sm:py-2 text-sm sm:text-base font-medium outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="p-1.5 text-slate-500 hover:text-slate-700 transition-colors mr-1"
                  >
                    <Plus className="w-4 h-4 rotate-45" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 -mt-6 sm:-mt-10 relative z-20">
        {isAuthenticated && currentUser?.isAdmin && (
           <div className="flex justify-end mb-6 animate__animated animate__fadeInRight">
              <button 
                onClick={openAddModal}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-teal-500/30 transition-all font-bold text-sm"
              >
                <Plus className="w-4 h-4 sm:w-5 h-5" /> 新增景点
              </button>
           </div>
        )}

        <div className="mb-8 sm:mb-12 animate__animated animate__fadeInUp">
          <div className="flex overflow-x-auto no-scrollbar sm:justify-center py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className={`inline-flex p-1 sm:p-1.5 rounded-xl sm:rounded-2xl ${theme === 'dark' ? 'bg-slate-800/80 border border-slate-700' : 'bg-white border border-slate-200'} backdrop-blur-sm shadow-lg whitespace-nowrap`}>
              {isDataLoading ? (
                 <div className="px-5 py-2 text-slate-400 text-sm">加载中...</div>
              ) : (
                dynamicProvinces.map((province) => (
                  <button
                    key={province}
                    onClick={() => setSelectedProvince(province)}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
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
        </div>

        {isDataLoading ? (
          <div className="flex justify-center items-center py-20">
             <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
          </div>
        ) : (
          <>
            <motion.div 
              key={`${selectedProvince}-${searchTerm}-${currentPage}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              <AnimatePresence mode="popLayout">
                {filteredAttractions.map((attraction, i) => (
                  <motion.div
                    key={attraction.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="relative group active:scale-95 transition-transform"
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
                        className="absolute top-4 right-14 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-full text-teal-600 dark:text-teal-400 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
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
            </motion.div>

            {totalPages > 1 && (
              <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row justify-center items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      onPageChange(currentPage - 1);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className={`p-3 sm:p-2 rounded-xl border transition-all ${
                      currentPage === 1 
                        ? 'opacity-30 cursor-not-allowed text-slate-400 border-slate-200 dark:border-slate-800' 
                        : `${theme === 'dark' ? 'border-slate-700 text-slate-100 hover:bg-slate-800 active:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100'}`
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex gap-1 sm:gap-2 mx-1 sm:mx-4 overflow-x-auto no-scrollbar px-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => {
                          onPageChange(page);
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        className={`min-w-[40px] h-10 rounded-xl font-bold transition-all ${
                          currentPage === page
                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                            : `${theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'}`
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      onPageChange(currentPage + 1);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className={`p-3 sm:p-2 rounded-xl border transition-all ${
                      currentPage === totalPages 
                        ? 'opacity-30 cursor-not-allowed text-slate-400 border-slate-200 dark:border-slate-800' 
                        : `${theme === 'dark' ? 'border-slate-700 text-slate-100 hover:bg-slate-800 active:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100'}`
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest sm:hidden">
                  第 {currentPage} 页 / 共 {totalPages} 页
                </span>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
};
