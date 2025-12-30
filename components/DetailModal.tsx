
import React, { useState, useMemo } from 'react';
import { Attraction, User } from '../types';
import { X, Search, MapPin, ExternalLink, Heart, BookOpen, Map as MapIcon, Ghost, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeafletMap } from './LeafletMap';

interface Props {
  attraction: Attraction | null;
  allAttractions: Attraction[];
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent | null, id: string) => void;
  currentUser?: User | null;
}

export const DetailModal: React.FC<Props> = ({ 
  attraction, 
  allAttractions, 
  onClose, 
  isFavorite, 
  onToggleFavorite,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'map' | 'album'>('info');

  // 生成模拟相册数据
  const albumImages = useMemo(() => {
    if (!attraction) return [];
    return [
      attraction.imageUrl,
      `https://picsum.photos/seed/${attraction.id}-1/800/1000`,
      `https://picsum.photos/seed/${attraction.id}-2/800/600`,
      `https://picsum.photos/seed/${attraction.id}-3/1000/800`,
      `https://picsum.photos/seed/${attraction.id}-4/800/1200`,
      `https://picsum.photos/seed/${attraction.id}-5/1200/800`,
    ];
  }, [attraction]);

  if (!attraction) return null;

  const handleBaiduSearch = () => {
    const query = `${attraction.province} ${attraction.name} 旅游攻略 必玩景点 美食`;
    window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(query)}`, '_blank');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, rotate: -2 },
    show: { opacity: 1, y: 0, rotate: 0 }
  };

  return (
    <AnimatePresence>
      {attraction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          
          <div
              className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate__animated animate__zoomIn animate__faster"
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
            <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 overflow-y-auto no-scrollbar bg-white flex flex-col">
              
              <div className="hidden md:block mb-4 animate__animated animate__fadeInDown animate__delay-1s">
                 <h2 className="text-3xl font-bold text-slate-800 mb-2">{attraction.name}</h2>
                 <div className="flex items-center gap-2 text-teal-600 font-medium">
                    <MapPin className="w-4 h-4" />
                    <span>中国 · {attraction.province}</span>
                 </div>
              </div>

              {/* Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'info' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <BookOpen className="w-4 h-4" /> 介绍
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'map' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <MapIcon className="w-4 h-4" /> 地图
                </button>
                {/* 管理员专属相册标签 */}
                {currentUser?.isAdmin && (
                  <button
                    onClick={() => setActiveTab('album')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'album' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <ImageIcon className="w-4 h-4" /> 相册
                  </button>
                )}
              </div>

              {activeTab === 'info' && (
                <div className="animate__animated animate__fadeIn flex flex-col flex-grow">
                  <div className="prose prose-slate prose-sm sm:prose-base mb-6 sm:mb-8 flex-grow">
                    <p className="text-base sm:text-lg leading-relaxed text-slate-600">{attraction.description}</p>
                  </div>

                  <div className="bg-blue-50 rounded-2xl p-4 sm:p-6 border border-blue-100 mt-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      <h3 className="font-bold text-blue-800 text-base sm:text-lg">智能探索</h3>
                    </div>
                    <p className="text-sm sm:text-base text-blue-700/80 mb-3 sm:mb-4">
                      想了解更多关于 {attraction.name} 的实时攻略和路线？
                    </p>
                    <button 
                      onClick={handleBaiduSearch}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <img src="https://www.baidu.com/favicon.ico" alt="Baidu" className="w-4 h-4 bg-white rounded-full p-[1px]" />
                      在百度搜索更多详情
                      <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                    </button>
                  </div>

                  <div className="mt-6 sm:mt-8 flex gap-2 sm:gap-3 flex-wrap">
                     {attraction.tags.map(tag => (
                       <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs sm:text-sm font-medium">
                         #{tag}
                       </span>
                     ))}
                  </div>
                </div>
              )}

              {activeTab === 'map' && (
                <div className="flex-grow min-h-[300px] flex flex-col animate__animated animate__fadeIn">
                  {attraction.coordinates ? (
                    <LeafletMap 
                      lat={attraction.coordinates.lat} 
                      lng={attraction.coordinates.lng} 
                      name={attraction.name} 
                      allAttractions={allAttractions}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 flex-col border border-slate-100 p-8">
                       <motion.div
                         animate={{ y: [0, -10, 0] }}
                         transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                       >
                         <Ghost className="w-16 h-16 mb-4 text-slate-300" />
                       </motion.div>
                       <p className="font-medium text-slate-500">暂无地图坐标数据</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'album' && (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="flex-grow flex flex-col"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <div className="w-1 h-4 bg-teal-500 rounded-full"></div>
                      管理员电子相册
                    </h3>
                    <span className="text-xs text-slate-400">滑动探索精彩瞬间</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-4">
                    {albumImages.map((src, idx) => (
                      <motion.div 
                        key={idx}
                        variants={itemVariants}
                        whileHover={{ scale: 1.05, rotate: 1, zIndex: 10 }}
                        className="relative aspect-[4/5] bg-white p-2 rounded-lg shadow-md border border-slate-100 overflow-hidden group"
                      >
                        <div className="w-full h-full overflow-hidden rounded shadow-inner">
                          <img 
                            src={src} 
                            alt={`Album ${idx}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        </div>
                        {/* 模拟纸质相册底部文案 */}
                        <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          IMG_2025_{idx.toString().padStart(2, '0')}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-auto pt-6 border-t border-dashed border-slate-200">
                    <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100">
                      <p className="text-xs text-teal-700 leading-relaxed font-medium">
                        <span className="font-bold">💡 管理提示：</span> 
                        此相册仅作为数据存档展示。如需更新景点主图，请前往“管理面板”或首页使用编辑功能。
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
