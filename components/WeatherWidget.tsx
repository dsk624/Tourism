
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserLocation, getWeather, getWeatherIcon, getWeatherDescription } from '../services/weatherService';
import { LocationData, WeatherData } from '../types';
import { 
  MapPin, Calendar, Clock, Droplets, Sunrise, Sunset, Loader2, 
  ChevronUp, Wind, ThermometerSun, Gauge, Sun
} from 'lucide-react';

export const WeatherWidget: React.FC = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000);
    
    const initData = async () => {
      try {
        const loc = await getUserLocation();
        setLocation(loc);
        const w = await getWeather(loc.latitude, loc.longitude);
        setWeather(w);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    initData();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return null;

  return (
    <div className={`fixed z-40 transition-all duration-500 ${isExpanded ? 'inset-0 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm md:inset-auto md:top-28 md:right-8 md:bg-transparent md:backdrop-blur-none' : 'top-20 right-4 md:top-24 md:right-8'}`}>
      <motion.div 
        ref={widgetRef}
        layout
        onClick={() => !isExpanded && setIsExpanded(true)}
        whileHover={!isExpanded ? { scale: 1.05, y: -2 } : {}}
        className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] cursor-pointer overflow-hidden relative flex flex-col ${isExpanded ? 'w-full max-w-sm sm:max-w-md' : 'w-auto'}`}
      >
        <motion.div 
          layout
          className={`transition-all duration-300 ${isExpanded ? 'p-6 sm:p-8' : 'px-5 py-3.5'}`}
        >
          {/* Compact View */}
          {!isExpanded && (
             <motion.div 
               layoutId="compact-view"
               className="flex items-center gap-4 whitespace-nowrap"
             >
                <div className="text-3xl filter drop-shadow-md">
                   {weather ? getWeatherIcon(weather.weatherCode, weather.isDay) : <Loader2 className="animate-spin w-5 h-5" />}
                </div>
                <div className="flex flex-col">
                   <div className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                     {weather ? Math.round(weather.temperature) : '--'}°
                     <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-full">
                       {weather ? getWeatherDescription(weather.weatherCode) : ''}
                     </span>
                   </div>
                   <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                     <MapPin className="w-2.5 h-2.5 text-teal-500" />
                     {location?.city}
                   </div>
                </div>
             </motion.div>
          )}

          {/* Expanded View */}
          <AnimatePresence mode="popLayout">
            {isExpanded && (
              <motion.div
                key="expanded-content"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 w-full"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-teal-500/10 rounded-2xl">
                      <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <span className="block text-sm font-black text-slate-800 dark:text-white leading-tight">{formatDate(date)}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Today's Forecast</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                     <Clock className="w-3.5 h-3.5" />
                     {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Main Weather Info */}
                <div className="flex justify-between items-center px-2">
                   <div className="space-y-1">
                     <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                       <MapPin className="w-3 h-3 text-teal-500" />
                       {location?.city} · {location?.province}
                     </div>
                     <div className="flex items-baseline gap-3">
                       <span className="text-6xl font-black text-slate-800 dark:text-white tracking-tighter">
                         {weather ? Math.round(weather.temperature) : '--'}°
                       </span>
                       <span className="text-xl font-bold text-teal-500">
                         {weather ? getWeatherDescription(weather.weatherCode) : ''}
                       </span>
                     </div>
                     <div className="text-xs font-medium text-slate-400">
                        Feels like {weather ? Math.round(weather.apparentTemperature) : '--'}°
                     </div>
                   </div>
                   <div className="text-7xl filter drop-shadow-2xl">
                     {weather ? getWeatherIcon(weather.weatherCode, weather.isDay) : <Loader2 className="animate-spin w-8 h-8 text-slate-300" />}
                   </div>
                </div>

                {/* Details Grid */}
                {weather && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/30 flex flex-col gap-1 group">
                       <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider">
                          <Droplets className="w-4 h-4 text-blue-500" /> 湿度
                       </div>
                       <span className="text-lg font-black text-slate-800 dark:text-slate-200">{weather.humidity}%</span>
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/30 flex flex-col gap-1">
                       <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider">
                          <Wind className="w-4 h-4 text-teal-500" /> 风速
                       </div>
                       <span className="text-lg font-black text-slate-800 dark:text-slate-200">{weather.windSpeed} <span className="text-[10px] opacity-50">km/h</span></span>
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/30 flex flex-col gap-1">
                       <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider">
                          <Sun className="w-4 h-4 text-amber-500" /> 紫外线
                       </div>
                       <span className="text-lg font-black text-slate-800 dark:text-slate-200">{weather.uvIndex.toFixed(1)}</span>
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/30 flex flex-col gap-1">
                       <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider">
                          <Gauge className="w-4 h-4 text-indigo-500" /> 气压
                       </div>
                       <span className="text-lg font-black text-slate-800 dark:text-slate-200">{Math.round(weather.pressure)} <span className="text-[10px] opacity-50">hPa</span></span>
                     </div>

                     <div className="col-span-2 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 dark:from-teal-900/20 dark:to-emerald-900/20 p-4 rounded-2xl border border-teal-500/20 flex items-center justify-between px-6">
                       <div className="flex items-center gap-3">
                         <Sunrise className="w-5 h-5 text-amber-500" />
                         <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sunrise</span>
                            <span className="font-black text-slate-700 dark:text-slate-200">{formatTime(weather.sunrise)}</span>
                         </div>
                       </div>
                       <div className="w-px h-8 bg-teal-500/20"></div>
                       <div className="flex items-center gap-3">
                         <div className="flex flex-col text-right">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sunset</span>
                            <span className="font-black text-slate-700 dark:text-slate-200">{formatTime(weather.sunset)}</span>
                         </div>
                         <Sunset className="w-5 h-5 text-rose-500" />
                       </div>
                     </div>
                  </div>
                )}

                {/* Close Button */}
                <button 
                   onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(false);
                   }}
                   className="w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                   <ChevronUp className="w-4 h-4" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Collapse</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};
