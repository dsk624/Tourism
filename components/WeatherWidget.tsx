
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserLocation, getWeather, getWeatherIcon, getWeatherDescription } from '../services/weatherService';
import { LocationData, WeatherData } from '../types';
import { MapPin, Calendar, Clock, Droplets, Sunrise, Sunset, Loader2, ChevronUp, ChevronDown } from 'lucide-react';

export const WeatherWidget: React.FC = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="fixed top-20 right-4 md:top-24 z-30 animate__animated animate__fadeInRight animate__fast">
      <motion.div 
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700 rounded-3xl shadow-2xl cursor-pointer overflow-hidden relative ${isExpanded ? 'w-80 p-5' : 'w-auto px-4 py-3 hover:bg-white dark:hover:bg-slate-800'}`}
      >
        
        {/* Compact View */}
        <AnimatePresence mode="popLayout">
        {!isExpanded && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="flex items-center gap-3"
           >
              <div className="text-2xl filter drop-shadow-sm">
                 {weather ? getWeatherIcon(weather.weatherCode, weather.isDay) : <Loader2 className="animate-spin w-5 h-5" />}
              </div>
              <div className="flex flex-col">
                 <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                   {weather ? Math.round(weather.temperature) : '--'}°
                   <span className="text-xs font-medium opacity-60 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                     {weather ? getWeatherDescription(weather.weatherCode) : ''}
                   </span>
                 </div>
                 <div className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5">
                   <MapPin className="w-2.5 h-2.5 flex-shrink-0 text-teal-500" />
                   {location?.city}
                 </div>
              </div>
           </motion.div>
        )}
        </AnimatePresence>

        {/* Expanded View */}
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3">
                <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                  <div className="p-1.5 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">{formatDate(date)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                   <Clock className="w-3 h-3" />
                   {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Main Weather Info */}
              <div className="flex justify-between items-center">
                 <div className="animate__animated animate__fadeInLeft animate__faster">
                   <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                     <MapPin className="w-3 h-3 text-teal-500" />
                     {location?.city} · {location?.province}
                   </div>
                   <div className="flex items-baseline gap-2">
                     <span className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
                       {weather ? Math.round(weather.temperature) : '--'}°
                     </span>
                     <span className="text-lg font-medium text-teal-600 dark:text-teal-400">
                       {weather ? getWeatherDescription(weather.weatherCode) : ''}
                     </span>
                   </div>
                 </div>
                 <div className="text-5xl filter drop-shadow-lg animate__animated animate__rubberBand animate__delay-1s">
                   {weather ? getWeatherIcon(weather.weatherCode, weather.isDay) : <Loader2 className="animate-spin w-8 h-8 text-slate-300" />}
                 </div>
              </div>

              {/* Grid Details */}
              {weather && (
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 animate__animated animate__fadeInUp animate__faster">
                   <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl flex items-center gap-2">
                     <Droplets className="w-4 h-4 text-blue-500" />
                     <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">降水量</span>
                        <span>{weather.precipitation}mm</span>
                     </div>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl flex items-center gap-2">
                     <Sunrise className="w-4 h-4 text-amber-500" />
                     <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">日出</span>
                        <span>{formatTime(weather.sunrise)}</span>
                     </div>
                   </div>
                   <div className="col-span-2 bg-gradient-to-r from-orange-50 to-rose-50 dark:from-slate-800 dark:to-slate-800 p-2.5 rounded-xl flex items-center gap-2">
                     <Sunset className="w-4 h-4 text-rose-500" />
                     <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">日落</span>
                        <span>{formatTime(weather.sunset)}</span>
                     </div>
                   </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Toggle Indicator */}
        <motion.div 
            layout 
            className="absolute bottom-1 left-0 right-0 flex justify-center opacity-30 pointer-events-none"
        >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : null}
        </motion.div>

      </motion.div>
    </div>
  );
};
