
import React, { useState, useEffect } from 'react';
import { Attraction } from '../types';
import { X, Search, MapPin, ExternalLink, Heart, BookOpen, Map as MapIcon, Ghost } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeafletMap } from './LeafletMap';

interface Props {
  attraction: Attraction | null;
  allAttractions: Attraction[];
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent | null, id: string) => void;
  theme?: 'light' | 'dark' | 'teal';
}

export const DetailModal: React.FC<Props> = ({ attraction, allAttractions, onClose, isFavorite, onToggleFavorite, theme = 'light' }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'map'>('info');

  useEffect(() => {
    if (attraction) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [attraction]);

  if (!attraction) return null;

  const handleBaiduSearch = () => {
    const query = `${attraction.province} ${attraction.name} 旅游攻略 必玩景点 美食`;
    window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(query)}`, '_blank');
  };

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {attraction && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto no-scrollbar py-6 sm:py-12 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`relative w-full max-w-4xl h-auto max-h-[calc(100dvh-4rem)] ${isDark ? 'bg-slate-900' : 'bg-white'} rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border ${isDark ? 'border-slate-800' : 'border-transparent'} z-10`}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="absolute top-4 right-4 z-20 flex gap-2">
                {onToggleFavorite && (
                    <button
                    onClick={(e) => onToggleFavorite(e, attraction.id)}
                    className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-md"
                    >
                    <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                )}
                <button
                onClick={onClose}
                className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-md"
                >
                <X className="w-5 h-5" />
                </button>
            </div>

            {/* Image Section */}
            <div className="w-full md:w-1/2 h-64 sm:h-72 md:h-auto relative bg-slate-200 flex-shrink-0">
               <img
                src={attraction.imageUrl}
                alt={attraction.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent md:hidden">
                 <h2 className="text-xl font-black text-white leading-tight">{attraction.name}</h2>
                 <p className="text-white/80 flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-widest">
                   <MapPin className="w-3 h-3" /> {attraction.province}
                 </p>
              </div>
            </div>

            {/* Content Section */}
            <div className={`w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto no-scrollbar ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'} flex flex-col`}>
              
              <div className="hidden md:block mb-6">
                 <h2 className={`text-2xl font-black tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{attraction.name}</h2>
                 <div className="flex items-center gap-2 text-teal-500 font-black uppercase tracking-widest text-[10px]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>中国 · {attraction.province}</span>
                 </div>
              </div>

              {/* Tabs */}
              <div className={`flex p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl mb-6 border ${isDark ? 'border-slate-700' : 'border-transparent'} flex-shrink-0`}>
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'info' ? (isDark ? 'bg-slate-700 text-teal-400 shadow-md' : 'bg-white text-teal-600 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <BookOpen className="w-4 h-4" /> 详情
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'map' ? (isDark ? 'bg-slate-700 text-teal-400 shadow-md' : 'bg-white text-teal-600 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <MapIcon className="w-4 h-4" /> 地图
                </button>
              </div>

              {activeTab === 'info' ? (
                <div className="flex flex-col flex-grow">
                  <div className="mb-6 flex-grow">
                    <p className={`text-sm sm:text-base leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
                      {attraction.description}
                    </p>
                  </div>

                  <div className={`${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50/50 border-blue-100'} rounded-2xl p-5 border mt-auto`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Search className={`w-3.5 h-3.5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                      <h3 className={`font-black tracking-tight text-[10px] uppercase ${isDark ? 'text-blue-100' : 'text-blue-800'}`}>智能探索</h3>
                    </div>
                    <button 
                      onClick={handleBaiduSearch}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-xs transition-all shadow-md active:scale-95"
                    >
                      <img src="https://www.baidu.com/favicon.ico" alt="Baidu" className="w-3.5 h-3.5 bg-white rounded-full p-[1px]" />
                      在百度搜索更多详情
                      <ExternalLink className="w-3 h-3 ml-1 opacity-80" />
                    </button>
                  </div>

                  <div className="mt-6 flex gap-2 flex-wrap">
                     {attraction.tags.map(tag => (
                       <span key={tag} className={`px-2.5 py-1 ${isDark ? 'bg-slate-800 text-teal-300 border border-slate-700' : 'bg-slate-100 text-slate-500'} rounded-lg text-[9px] font-black uppercase tracking-widest`}>
                         #{tag}
                       </span>
                     ))}
                  </div>
                </div>
              ) : (
                <div className="flex-grow min-h-[300px] sm:min-h-[400px] flex flex-col">
                  {attraction.coordinates ? (
                    <LeafletMap 
                      lat={attraction.coordinates.lat} 
                      lng={attraction.coordinates.lng} 
                      name={attraction.name} 
                      allAttractions={allAttractions}
                    />
                  ) : (
                    <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'} w-full h-full rounded-2xl flex items-center justify-center text-slate-400 flex-col border p-8`}>
                       <Ghost className="w-12 h-12 mb-2 opacity-30" />
                       <p className="font-black tracking-tight text-[10px] uppercase">暂无地图数据</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
