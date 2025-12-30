import React, { useState, useMemo } from 'react';
import { Attraction, User } from '../types';
import { X, Search, MapPin, ExternalLink, Heart, BookOpen, Map as MapIcon, Ghost, Image as ImageIcon, Sparkles, Camera } from 'lucide-react';
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

  // 管理员标识
  const isAdmin = currentUser?.isAdmin === true;

  // 生成拍立得相册数据
  const albumData = useMemo(() => {
    if (!attraction) return [];
    return [
      { id: 1, src: attraction.imageUrl, rotate: -3, date: '2025.01.10', title: '景区正门' },
      { id: 2, src: `https://picsum.photos/seed/${attraction.id}-1/600/800`, rotate: 4, date: '2025.01.12', title: '清晨云海' },
      { id: 3, src: `https://picsum.photos/seed/${attraction.id}-2/800/600`, rotate: -2, date: '2025.01.15', title: '古道斜阳' },
      { id: 4, src: `https://picsum.photos/seed/${attraction.id}-3/700/700`, rotate: 5, date: '2025.01.18', title: '文化遗存' },
      { id: 5, src: `https://picsum.photos/seed/${attraction.id}-4/600/900`, rotate: -4, date: '2025.01.22', title: '冬日残雪' },
      { id: 6, src: `https://picsum.photos/seed/${attraction.id}-5/900/600`, rotate: 2, date: '2025.02.01', title: '春暖花开' },
    ];
  }, [attraction]);

  if (!attraction) return null;

  const handleBaiduSearch = () => {
    const query = `${attraction.province} ${attraction.name} 旅游攻略`;
    window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          className="relative w-full max-w-5xl h-[85vh] bg-stone-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-stone-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 装饰性相册书脊 (仅PC) */}
          <div className="hidden md:block w-3 bg-stone-300 shadow-inner z-20" />

          {/* 顶部控制栏 (移动端适配) */}
          <div className="absolute top-4 right-4 z-30 flex gap-2">
            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-xl rounded-full text-slate-800 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 左侧：精选封面 */}
          <div className="w-full md:w-2/5 h-48 md:h-auto relative bg-stone-200 overflow-hidden group">
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              src={attraction.imageUrl}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              alt={attraction.name}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
              <motion.h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{attraction.name}</motion.h2>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <MapPin className="w-4 h-4" /> {attraction.province} · 华夏精品
              </div>
            </div>
          </div>

          {/* 右侧：电子相册本内容 */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* 标签栏 - 模仿纸质书签 */}
            <div className="flex px-6 pt-6 gap-2">
              <TabButton 
                active={activeTab === 'info'} 
                onClick={() => setActiveTab('info')} 
                icon={<BookOpen className="w-4 h-4" />} 
                label="景点志" 
              />
              <TabButton 
                active={activeTab === 'map'} 
                onClick={() => setActiveTab('map')} 
                icon={<MapIcon className="w-4 h-4" />} 
                label="舆图" 
              />
              {isAdmin && (
                <TabButton 
                  active={activeTab === 'album'} 
                  onClick={() => setActiveTab('album')} 
                  icon={<Camera className="w-4 h-4" />} 
                  label="管理员影像" 
                  isSpecial
                />
              )}
            </div>

            {/* 内容滚动区 */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'info' && (
                  <motion.div
                    key="info"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="relative">
                      <Sparkles className="absolute -top-6 -left-4 w-10 h-10 text-stone-200 opacity-50" />
                      <p className="text-stone-700 text-lg leading-relaxed first-letter:text-4xl first-letter:font-bold first-letter:mr-2 first-letter:text-teal-600 first-letter:float-left">
                        {attraction.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4">
                      {attraction.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-stone-100 text-stone-500 rounded-md text-xs border border-stone-200">#{tag}</span>
                      ))}
                    </div>
                    <button 
                      onClick={handleBaiduSearch}
                      className="inline-flex items-center gap-2 text-teal-600 font-bold hover:underline group"
                    >
                      前往百度查看更多文献 <ExternalLink className="w-4 h-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                  </motion.div>
                )}

                {activeTab === 'map' && (
                  <motion.div
                    key="map"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full min-h-[400px]"
                  >
                    {attraction.coordinates ? (
                      <LeafletMap lat={attraction.coordinates.lat} lng={attraction.coordinates.lng} name={attraction.name} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-stone-400">
                        <Ghost className="w-12 h-12 mb-2" />
                        <p>舆图暂缺</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'album' && isAdmin && (
                  <motion.div
                    key="album"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 gap-6"
                  >
                    {albumData.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 30, rotate: item.rotate * 2 }}
                        animate={{ opacity: 1, y: 0, rotate: item.rotate }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ rotate: 0, scale: 1.05, zIndex: 10, transition: { duration: 0.2 } }}
                        className="bg-white p-3 pb-10 shadow-xl border border-stone-200 relative group cursor-pointer"
                      >
                        {/* 拍立得照片本体 */}
                        <div className="aspect-[4/5] overflow-hidden bg-stone-100">
                          <img src={item.src} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" alt="" />
                        </div>
                        {/* 模拟手写字 */}
                        <div className="absolute bottom-2 left-4 right-4 text-center">
                          <p className="font-['Zhi_Mang_Xing'] text-stone-500 text-lg">{item.title}</p>
                          <p className="text-[10px] text-stone-300 font-mono mt-1">{item.date}</p>
                        </div>
                        {/* 模拟胶带 */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-6 bg-teal-500/10 rotate-3 border-x border-teal-500/20 backdrop-blur-[2px]" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* 底部页码感装饰 */}
            <div className="px-10 py-4 flex justify-between items-center border-t border-stone-100 text-[10px] text-stone-300 font-mono tracking-widest">
              <span>CHINA TRAVEL ARCHIVE // {attraction.id}</span>
              <span>PAGE {activeTab === 'info' ? '01' : activeTab === 'map' ? '02' : '03'}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const TabButton = ({ active, onClick, icon, label, isSpecial = false }: { active: boolean, onClick: () => void, icon: any, label: string, isSpecial?: boolean }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-t-xl flex items-center gap-2 text-sm font-bold transition-all border-b-2 ${
      active 
        ? (isSpecial ? 'bg-rose-50 text-rose-600 border-rose-500' : 'bg-stone-100 text-teal-600 border-teal-500') 
        : 'text-stone-400 border-transparent hover:text-stone-600'
    }`}
  >
    {icon} {label}
  </button>
);
