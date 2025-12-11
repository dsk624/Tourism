import React, { useState, useMemo } from 'react';
import 'animate.css';
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
  // 主题切换状态
  const [theme, setTheme] = useState<'light' | 'dark' | 'teal'>('teal');
  // 页面切换状态
  const [currentPage, setCurrentPage] = useState<'home' | 'profile'>('home');
  // 移动端下拉菜单状态
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // 主题配置
  const themes = {
    light: {
      primary: 'bg-[rgb(13,148,136)]',
      primaryText: 'text-[rgb(13,148,136)]',
      primaryHover: 'hover:bg-[rgb(10,130,120)]',
      secondary: 'bg-slate-50',
      text: 'text-slate-800',
      bg: 'bg-[#f8fafc]',
      cardBg: 'bg-white',
      border: 'border-slate-200'
    },
    dark: {
      primary: 'bg-[rgb(13,148,136)]',
      primaryText: 'text-[rgb(13,148,136)]',
      primaryHover: 'hover:bg-[rgb(10,130,120)]',
      secondary: 'bg-slate-800',
      text: 'text-slate-200',
      bg: 'bg-slate-900',
      cardBg: 'bg-slate-800',
      border: 'border-slate-700'
    },
    teal: {
      primary: 'bg-[rgb(13,148,136)]',
      primaryText: 'text-[rgb(13,148,136)]',
      primaryHover: 'hover:bg-[rgb(10,130,120)]',
      secondary: 'bg-teal-50',
      text: 'text-slate-800',
      bg: 'bg-[#f0fdfa]',
      cardBg: 'bg-white',
      border: 'border-teal-100'
    }
  };
  
  // 当前主题
  const currentTheme = themes[theme];

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
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-40 ${currentTheme.cardBg}/80 backdrop-blur-md border-b ${currentTheme.border}/60`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
               <div className={`${currentTheme.primary} p-2 rounded-lg`}>
                 <Mountain className="text-white w-6 h-6" />
               </div>
               <span className={`text-xl font-bold ${currentTheme.text}`}>
                 华夏游
               </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {/* 页面切换按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage('home')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${currentPage === 'home' ? `${currentTheme.primary} text-white` : `${currentTheme.secondary} ${currentTheme.text}`}`}
                >
                  首页
                </button>
                <button
                  onClick={() => setCurrentPage('profile')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${currentPage === 'profile' ? `${currentTheme.primary} text-white` : `${currentTheme.secondary} ${currentTheme.text}`}`}
                >
                  我的
                </button>
              </div>
              
              <WeatherWidget />
              
              {/* 主题切换器 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${theme === 'light' ? currentTheme.primary + ' text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}
                  aria-label="浅色主题"
                >
                  ☀️
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? currentTheme.primary + ' text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}
                  aria-label="深色主题"
                >
                  🌙
                </button>
                <button
                  onClick={() => setTheme('teal')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${theme === 'teal' ? currentTheme.primary + ' text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}
                  aria-label="青色主题"
                >
                  🏞️
                </button>
              </div>
            </div>
            
            {/* Mobile Navigation */}
            <div className="flex items-center gap-3 md:hidden">
              {/* 页面切换按钮 - 简化版 */}
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage('home')}
                  className={`px-3 py-1.5 rounded-md font-medium text-sm transition-all ${currentPage === 'home' ? `${currentTheme.primary} text-white` : `${currentTheme.secondary} ${currentTheme.text}`}`}
                >
                  首页
                </button>
                <button
                  onClick={() => setCurrentPage('profile')}
                  className={`px-3 py-1.5 rounded-md font-medium text-sm transition-all ${currentPage === 'profile' ? `${currentTheme.primary} text-white` : `${currentTheme.secondary} ${currentTheme.text}`}`}
                >
                  我的
                </button>
              </div>
              
              {/* 主题切换器 - 简化版 */}
              <div className="flex gap-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${theme === 'light' ? currentTheme.primary + ' text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}
                  aria-label="浅色主题"
                >
                  ☀️
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? currentTheme.primary + ' text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}
                  aria-label="深色主题"
                >
                  🌙
                </button>
                <button
                  onClick={() => setTheme('teal')}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${theme === 'teal' ? currentTheme.primary + ' text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}
                  aria-label="青色主题"
                >
                  🏞️
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Weather Widget */}
          <div className="md:hidden px-4 pb-4">
            <WeatherWidget />
          </div>
        </div>
      </nav>

      {currentPage === 'home' ? (
        <>
          {/* Hero Section */}
          <div className="relative h-[400px] md:h-[500px] bg-slate-900 overflow-hidden animate__animated animate__fadeIn">
            <div className="absolute inset-0 bg-gradient-to-r from-[rgb(13,148,136)]/30 via-slate-900/50 to-[rgb(13,148,136)]/30 animate__animated animate__pulse animate__infinite animate__slow" />
            <img 
              src="https://picsum.photos/1920/1080?random=100" 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              alt="Hero"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/90" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="animate__animated animate__fadeInDown"
              >
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-lg animate__animated animate__pulse animate__delay-1s">
                  探索<span className="text-[rgb(13,148,136)]">中华</span>之美
                </h1>
                <p className="text-slate-200 text-lg md:text-xl max-w-2xl mx-auto mb-8 font-light animate__animated animate__fadeIn animate__delay-2s">
                  寻访名山大川，品味千年文化。从河南出发，丈量每一寸锦绣河山。
                </p>
                
                {/* Search Bar */}
                <div className="relative max-w-md mx-auto w-full animate__animated animate__fadeIn animate__delay-3s">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Search className="h-5 w-5 text-[rgb(13,148,136)]" />
                   </div>
                   <input
                     type="text"
                     className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-full leading-5 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:bg-white/20 focus:ring-2 focus:ring-[rgb(13,148,136)] backdrop-blur-sm sm:text-sm transition-all shadow-lg hover:shadow-[rgb(13,148,136)]/20"
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
            <div className={`${currentTheme.cardBg} rounded-2xl shadow-xl p-6 mb-12 ${currentTheme.border} animate__animated animate__fadeInUp animate__delay-1s`}>
              <div className="flex items-center gap-4 mb-4">
                <h3 className={`font-bold text-lg ${currentTheme.text} shrink-0 animate__animated animate__fadeInLeft`}>热门省份</h3>
                <div className={`h-px ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'} w-full animate__animated animate__fadeIn`}></div>
              </div>
              
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {['全部', ...PROVINCES].map((province, index) => (
                  <button
                    key={province}
                    onClick={() => setSelectedProvince(province)}
                    className={`
                      px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap transform hover:rotate-1 hover:scale-105
                      ${selectedProvince === province 
                        ? `${currentTheme.primary} text-white shadow-lg shadow-[rgb(13,148,136)]/30 scale-105 animate__animated animate__pulse` 
                        : `${currentTheme.secondary} ${currentTheme.text} hover:${currentTheme.primary} hover:text-white`}
                    `}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {province}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Grid */}
            <div className="mb-8 flex items-center justify-between animate__animated animate__fadeInDown">
               <h2 className={`text-2xl font-bold ${currentTheme.text} animate__animated animate__fadeInLeft`}>
                 {selectedProvince === '全部' ? '精选景点' : `${selectedProvince} · 必游之地`}
               </h2>
               <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} animate__animated animate__fadeInRight`}>共 {filteredAttractions.length} 个景点</span>
            </div>

            {filteredAttractions.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredAttractions.map((attraction, index) => (
                  <motion.div
                    key={attraction.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="animate__animated animate__fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <AttractionCard 
                      attraction={attraction} 
                      onClick={setSelectedAttraction} 
                      theme={theme}
                      currentTheme={currentTheme}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-20 animate__animated animate__fadeIn">
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-lg`}>暂无相关景点信息</p>
              </div>
            )}
          </main>
        </>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className={`${currentTheme.cardBg} rounded-2xl shadow-xl p-8 ${currentTheme.border} animate__animated animate__fadeIn`}>
            <div className="flex flex-col items-center text-center mb-8 animate__animated animate__fadeInDown">
              <div className={`w-24 h-24 rounded-full ${currentTheme.primary} flex items-center justify-center text-white text-4xl mb-4 animate__animated animate__pulse animate__infinite animate__slow shadow-lg shadow-[rgb(13,148,136)]/30`}>
                👤
              </div>
              <h2 className={`text-2xl font-bold ${currentTheme.text} mb-2 animate__animated animate__fadeInUp`}>我的账户</h2>
              <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} animate__animated animate__fadeInUp animate__delay-1s`}>欢迎使用华夏游</p>
            </div>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${currentTheme.secondary} ${currentTheme.border} animate__animated animate__fadeInLeft animate__delay-1s hover:shadow-lg transition-all duration-300`}>
                <h3 className={`font-medium ${currentTheme.text} mb-2 animate__animated animate__fadeIn`}>个人信息</h3>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {[
                    { label: '姓名', value: '游客' },
                    { label: '邮箱', value: 'guest@example.com' },
                    { label: '注册时间', value: '2024-01-01' },
                    { label: '上次登录', value: '刚刚' }
                  ].map((item, index) => (
                    <div key={index} className={`animate__animated animate__fadeInUp animate__delay-${index * 0.1 + 1.2}s`}>
                      {item.label}：{item.value}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${currentTheme.secondary} ${currentTheme.border} animate__animated animate__fadeInRight animate__delay-1.2s hover:shadow-lg transition-all duration-300`}>
                <h3 className={`font-medium ${currentTheme.text} mb-2 animate__animated animate__fadeIn`}>我的收藏</h3>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-center py-8 animate__animated animate__fadeIn`}>您还没有收藏任何景点</p>
              </div>
              
              <div className={`p-4 rounded-xl ${currentTheme.secondary} ${currentTheme.border} animate__animated animate__fadeInLeft animate__delay-1.4s hover:shadow-lg transition-all duration-300`}>
                <h3 className={`font-medium ${currentTheme.text} mb-2 animate__animated animate__fadeIn`}>浏览历史</h3>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-center py-8 animate__animated animate__fadeIn`}>暂无浏览历史</p>
              </div>
              
              <div className={`p-4 rounded-xl ${currentTheme.secondary} ${currentTheme.border} animate__animated animate__fadeInRight animate__delay-1.6s hover:shadow-lg transition-all duration-300`}>
                <h3 className={`font-medium ${currentTheme.text} mb-2 animate__animated animate__fadeIn`}>设置</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between animate__animated animate__fadeInUp animate__delay-1.7s">
                    <span className={`${currentTheme.text}`}>深色模式</span>
                    <button className={`w-12 h-6 rounded-full ${theme === 'dark' ? currentTheme.primary : 'bg-slate-300'} transition-all duration-300 shadow-md hover:shadow-lg`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${theme === 'dark' ? 'transform translate-x-6' : ''}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between animate__animated animate__fadeInUp animate__delay-1.8s">
                    <span className={`${currentTheme.text}`}>推送通知</span>
                    <button className={`w-12 h-6 rounded-full bg-slate-300 transition-all duration-300 shadow-md hover:shadow-lg`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300`}></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      <footer className={`${currentTheme.cardBg} border-t ${currentTheme.border} py-12`}>
         <div className="max-w-7xl mx-auto px-4 text-center">
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mb-2`}>© 2024 华夏游 China Travel Guide</p>
            <p className={`${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} text-sm`}>Powered by React & Cloudflare</p>
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