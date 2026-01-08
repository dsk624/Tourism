
import React, { useState } from 'react';
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

  if (!attraction) return null;

  const handleBaiduSearch = () => {
    const query = `${attraction.province} ${attraction.name} 旅游攻略 必玩景点 美食`;
    window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(query)}`, '_blank');
  };

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {attraction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <div
              className={`relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] ${isDark ? 'bg-slate-900' : 'bg-white'} rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate__animated animate__zoomIn animate__faster border ${isDark ? 'border-slate-800' : 'border-transparent'}`}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                {onToggleFavorite && (
                    <button
                    onClick={(e) => onToggleFavorite(e, attraction.id)}
                    className="bg-black/20 hover:bg-black/40 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                    <Heart className={`w-6 h-6 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                )}
                <button
                onClick={onClose}
                className="bg-black/20 hover:bg-black/40 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
                style={{ minWidth: '44px', minHeight: '44px' }}
                >
                <X className="w-6 h-6" />
                </button>
            </div>

            {/* Image Section */}
            <div className="w-full md:w-1/2 h-48 md:h-auto relative bg-slate-200">
               <img
                src={attraction.imageUrl}
                alt={attraction.name}
                className="w-full h-full object-cover animate__animated animate__fadeIn"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 to-transparent md:hidden">
                 <h2 className="text-xl sm:text-2xl font-bold text-white">{attraction.name}</h2>
                 <p className="text-white/80 flex items-center gap-1 mt-1">
                   <MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> {attraction.province}
                 </p>
              </div>
            </div>

            {/* Content Section */}
            <div className={`w-full md:w-1/2 p-4 sm:p-6 md:p-8 overflow-y-auto no-scrollbar ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'} flex flex-col`}>
              
              <div className="hidden md:block mb-4 animate__animated animate__fadeInDown animate__delay-1s">
                 <h2 className={`text-3xl font-black tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{attraction.name}</h2>
                 <div className="flex items-center gap-2 text-teal-500 font-bold uppercase tracking-widest text-xs">
                    <MapPin className="w-4 h-4" />
                    <span>中国 · {attraction.province}</span>
                 </div>
              </div>

              {/* Tabs */}
              <div className={`flex p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl mb-6 border ${isDark ? 'border-slate-700' : 'border-transparent'}`}>
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'info' ? (isDark ? 'bg-slate-700 text-teal-400 shadow-md' : 'bg-white text-teal-600 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <BookOpen className="w-4 h-4" /> 介绍
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'map' ? (isDark ? 'bg-slate-700 text-teal-400 shadow-md' : 'bg-white text-teal-600 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <MapIcon className="w-4 h-4" /> 地图
                </button>
              </div>

              {activeTab === 'info' ? (
                <div className="animate__animated animate__fadeIn flex flex-col flex-grow">
                  <div className="prose prose-sm sm:prose-base mb-6 sm:mb-8 flex-grow">
                    <p className={`text-base sm:text-lg leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{attraction.description}</p>
                  </div>

                  {/* Baidu Search Section */}
                  <div className={`${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'} rounded-[2rem] p-4 sm:p-6 border mt-auto`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Search className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <h3 className={`font-black tracking-tight text-base sm:text-lg ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>智能探索</h3>
                    </div>
                    
                    <p className={`text-sm sm:text-base mb-4 font-medium ${isDark ? 'text-blue-400/80' : 'text-blue-700/80'}`}>
                      想了解更多关于 {attraction.name} 的实时攻略、门票价格和游玩路线？
                    </p>

                    <button 
                      onClick={handleBaiduSearch}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5"
                    >
                      <img src="https://www.baidu.com/favicon.ico" alt="Baidu" className="w-4 h-4 bg-white rounded-full p-[1px]" />
                      在百度搜索更多详情
                      <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                    </button>
                  </div>

                  <div className="mt-6 sm:mt-8 flex gap-2 sm:gap-3 flex-wrap">
                     {attraction.tags.map(tag => (
                       <span key={tag} className={`px-3 py-1 ${isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500'} rounded-lg text-xs sm:text-sm font-bold`}>
                         #{tag}
                       </span>
                     ))}
                  </div>
                </div>
              ) : (
                <div className="flex-grow min-h-[300px] flex flex-col animate__animated animate__fadeIn">
                  {attraction.coordinates ? (
                    <LeafletMap 
                      lat={attraction.coordinates.lat} 
                      lng={attraction.coordinates.lng} 
                      name={attraction.name} 
                      allAttractions={allAttractions}
                    />
                  ) : (
                    <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'} w-full h-full rounded-2xl flex items-center justify-center text-slate-400 flex-col border p-8`}>
                       <motion.div
                         animate={{ y: [0, -10, 0] }}
                         transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                       >
                         <Ghost className="w-16 h-16 mb-4 opacity-50" />
                       </motion.div>
                       <p className="font-black tracking-tight text-sm uppercase">暂无地图坐标数据</p>
                       <p className="text-xs opacity-60 mt-2 text-center max-w-[200px] font-medium">
                         该景点暂未收录精确坐标，管理员正在努力完善中...
                       </p>
                    </div>
                  )}
                  {attraction.coordinates && (
                    <p className="text-[10px] text-slate-500 mt-3 text-center font-bold uppercase tracking-widest">
                      地图数据来源：腾讯地图 (Tencent Maps)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
