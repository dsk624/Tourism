
import React, { useState, useMemo } from 'react';
import { Attraction, User } from '../types';
import { X, Search, MapPin, ExternalLink, Heart, BookOpen, Map as MapIcon, Ghost, Image as ImageIcon, Sparkles } from 'lucide-react';
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

  // 生成模拟相册数据，包含随机旋转角度以模拟真实相册
  const albumData = useMemo(() => {
    if (!attraction) return [];
    return [
      { id: 1, src: attraction.imageUrl, rotate: -2, date: '2025.01.15' },
      { id: 2, src: `https://picsum.photos/seed/${attraction.id}-1/800/1000`, rotate: 3, date: '2025.01.18' },
      { id: 3, src: `https://picsum.photos/seed/${attraction.id}-2/800/600`, rotate: -1, date: '2025.02.02' },
      { id: 4, src: `https://picsum.photos/seed/${attraction.id}-3/1000/800`, rotate: 4, date: '2025.02.10' },
      { id: 5, src: `https://picsum.photos/seed/${attraction.id}-4/800/1200`, rotate: -3, date: '2025.02.14' },
      { id: 6, src: `https://picsum.photos/seed/${attraction.id}-5/1200/800`, rotate: 2, date: '2025.02.20' },
    ];
  }, [attraction]);

  if (!attraction) return null;

  const handleBaiduSearch = () => {
    const query = `${attraction.province} ${attraction.name} 旅游攻略 必玩景点 美食`;
    window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(query)}`, '_blank');
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

            {/* 左侧：封面图 */}
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

            {/* 右侧：内容区/相册区 */}
            <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 overflow-y-auto no-scrollbar bg-white flex flex-col">
              
              <div className="hidden md:block mb-4 animate__animated animate__fadeInDown animate__delay-1s">
                 <h2 className="text-3xl font-bold text-slate-800 mb-2">{attraction.name}</h2>
                 <div className="flex items-center gap-2 text-teal-600 font-medium">
                    <MapPin className="w-4 h-4" />
                    <span>中国 · {attraction.province}</span>
                 </div>
              </div>

              {/* 标签页切换 */}
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
                {/* 仅管理员可见：电子相册入口 */}
                {currentUser?.isAdmin && (
                  <button
                    onClick={() => setActiveTab('album')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'album' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <ImageIcon className="w-4 h-4" /> 相册
                  </button>
                )}
              </div>

              {/* 标签内容展示 */}
              <AnimatePresence mode="wait">
                {activeTab === 'info' && (
                  <motion.div 
                    key="info"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex flex-col flex-grow"
                  >
                    <div className="prose prose-slate prose-sm sm:prose-base mb-6 sm:mb-8 flex-grow">
                      <p className="text-base sm:text-lg leading-relaxed text-slate-600">{attraction.description}</p>
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-4 sm:p-6 border border-blue-100 mt-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        <h3 className="font-bold text-blue-800 text-base sm:text-lg">智能探索</h3>
                      </div>
                      <button 
                        onClick={handleBaiduSearch}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        在百度搜索更多详情
                        <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'map' && (
                  <motion.div 
                    key="map"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="flex-grow min-h-[300px] flex flex-col"
                  >
                    {attraction.coordinates ? (
                      <LeafletMap 
                        lat={attraction.coordinates.lat} 
                        lng={attraction.coordinates.lng} 
                        name={attraction.name} 
                        allAttractions={allAttractions}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 flex-col border border-slate-100 p-8">
                         <Ghost className="w-16 h-16 mb-4 text-slate-300" />
                         <p className="font-medium text-slate-500">暂无地图坐标数据</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 管理员电子相册视图 */}
                {activeTab === 'album' && currentUser?.isAdmin && (
                  <motion.div 
                    key="album"
                    initial={{ opacity: 0, rotateY: -20 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: 20 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="flex-grow flex flex-col perspective-1000"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-slate-800 flex items-center gap-2">
                           <Sparkles className="w-5 h-5 text-amber-500" />
                           珍藏影像集
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 italic">Administrators Archive Edition</p>
                      </div>
                      <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full border border-rose-100">
                        私密存档
                      </span>
                    </div>

                    {/* 相册网格布局 */}
                    <div className="grid grid-cols-2 gap-4 pb-4">
                      {albumData.map((item, idx) => (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, y: 30, rotate: item.rotate * 2 }}
                          animate={{ opacity: 1, y: 0, rotate: item.rotate }}
                          transition={{ delay: idx * 0.1, type: 'spring' }}
                          whileHover={{ 
                            scale: 1.1, 
                            rotate: 0, 
                            zIndex: 20,
                            transition: { duration: 0.3 }
                          }}
                          className="relative bg-white p-2 pb-8 rounded-sm shadow-xl border border-slate-200 cursor-pointer overflow-hidden group"
                        >
                          {/* 模拟相册角落的胶带效果 */}
                          <div className="absolute -top-1 -left-4 w-12 h-4 bg-teal-500/20 rotate-45 z-10 opacity-40"></div>
                          <div className="absolute -top-1 -right-4 w-12 h-4 bg-teal-500/20 -rotate-45 z-10 opacity-40"></div>

                          {/* 图片本体 */}
                          <div className="w-full aspect-[4/5] bg-slate-100 overflow-hidden rounded-[1px] shadow-inner">
                            <img 
                              src={item.src} 
                              alt={`Archive ${idx}`} 
                              className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
                              loading="lazy"
                            />
                          </div>
                          
                          {/* 底部日期标注 */}
                          <div className="absolute bottom-2 left-0 right-0 text-center">
                            <span className="text-[10px] font-serif italic text-slate-400">
                              Captured on {item.date}
                            </span>
                          </div>

                          {/* 悬停时的光晕效果 */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </motion.div>
                      ))}
                    </div>

                    {/* 相册底部的装饰文案 */}
                    <div className="mt-auto py-4 border-t border-dashed border-slate-200 flex items-center justify-between">
                      <div className="flex -space-x-2">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                         ))}
                         <div className="w-6 h-6 rounded-full border-2 border-white bg-teal-500 flex items-center justify-center text-[10px] text-white font-bold">
                           +3
                         </div>
                      </div>
                      <p className="text-[10px] text-slate-300 font-mono">CONFIDENTIAL // ARCHIVE_0029</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
