import React, { useState, useMemo } from 'react';
import { WeatherWidget } from './components/WeatherWidget';
import { AttractionCard } from './components/AttractionCard';
import { DetailModal } from './components/DetailModal';
import { FeedbackWidget } from './components/FeedbackWidget';
import { ATTRACTIONS, PROVINCES } from './constants';
import { Attraction } from './types';
import { motion } from 'framer-motion';
import { Mountain, Search } from 'lucide-react';

const App: React.FC = () => {
  // Default to '河南' as requested for priority
  const [selectedProvince, setSelectedProvince] = useState<string>('河南');
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAttractions = useMemo(() => {
    let filtered = ATTRACTIONS;

    if (selectedProvince !== '全部') {
      filtered = filtered.filter(a => a.province === selectedProvince);
    }

    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [selectedProvince, searchTerm]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
               <div className="bg-teal-600 p-2 rounded-lg">
                 <Mountain className="text-white w-6 h-6" />
               </div>
               <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-cyan-600">
                 华夏游
               </span>
            </div>
            <WeatherWidget />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[500px] bg-slate-900 overflow-hidden">
        <img 
          src="https://picsum.photos/1920/1080?random=100" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          alt="Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/90" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
              探索<span className="text-teal-400">中华</span>之美
            </h1>
            <p className="text-slate-200 text-lg md:text-xl max-w-2xl mx-auto mb-8 font-light">
              寻访名山大川，品味千年文化。从河南出发，丈量每一寸锦绣河山。
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto w-full">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search className="h-5 w-5 text-gray-400" />
               </div>
               <input
                 type="text"
                 className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-full leading-5 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-teal-400 backdrop-blur-sm sm:text-sm transition-all"
                 placeholder="搜索景点..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
          </motion.div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">
        
        {/* Province Filter */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-12">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="font-bold text-lg text-slate-800 shrink-0">热门省份</h3>
            <div className="h-px bg-slate-100 w-full"></div>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {['全部', ...PROVINCES].map((province) => (
              <button
                key={province}
                onClick={() => setSelectedProvince(province)}
                className={`
                  px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap
                  ${selectedProvince === province 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-200 scale-105' 
                    : 'bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-600'}
                `}
              >
                {province}
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="mb-8 flex items-center justify-between">
           <h2 className="text-2xl font-bold text-slate-800">
             {selectedProvince === '全部' ? '精选景点' : `${selectedProvince} · 必游之地`}
           </h2>
           <span className="text-sm text-slate-500">共 {filteredAttractions.length} 个景点</span>
        </div>

        {filteredAttractions.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredAttractions.map((attraction) => (
              <AttractionCard 
                key={attraction.id} 
                attraction={attraction} 
                onClick={setSelectedAttraction} 
              />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">暂无相关景点信息</p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-12">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-slate-500 mb-2">© 2024 华夏游 China Travel Guide</p>
            <p className="text-slate-400 text-sm">Powered by React & Cloudflare</p>
         </div>
      </footer>

      {/* Modal */}
      <DetailModal 
        attraction={selectedAttraction} 
        onClose={() => setSelectedAttraction(null)} 
      />

      {/* Floating Feedback Widget */}
      <FeedbackWidget />
    </div>
  );
};

export default App;