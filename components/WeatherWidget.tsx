import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserLocation, getWeather, getWeatherIcon, getWeatherDescription } from '../services/weatherService';
import { LocationData, WeatherData } from '../types';
import { MapPin, Calendar, Clock, Droplets, Sunrise, Sunset, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-24 right-4 z-30 hidden lg:block"
    >
      <motion.div 
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-700 rounded-2xl shadow-xl cursor-pointer overflow-hidden transition-all duration-300 ${isExpanded ? 'w-72 p-4' : 'w-auto px-4 py-2 hover:bg-white/90 dark:hover:bg-slate-800/90'}`}
      >
        
        {/* Compact View (Default) */}
        {!isExpanded && (
           <div className="flex items-center gap-3">
              <div className="text-2xl">
                 {weather ? getWeatherIcon(weather.weatherCode, weather.isDay) : <Loader2 className="animate-spin w-5 h-5" />}
              </div>
              <div className="flex flex-col">
                 <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1">
                   {weather ? Math.round(weather.temperature) : '--'}°
                   <span className="text-xs font-normal opacity-70">
                     {weather ? getWeatherDescription(weather.weatherCode) : ''}
                   </span>
                 </div>
                 <div className="text-[10px] text-slate-500 flex items-center gap-0.5">
                   <MapPin className="w-2.5 h-2.5" />
                   {location?.city}
                 </div>
              </div>
           </div>
        )}

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Date Header */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-bold">{formatDate(date)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                   <Clock className="w-3 h-3" />
                   {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Location & Main Weather */}
              <div className="flex justify-between items-start mb-4">
                 <div>
                   <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">
                     <MapPin className="w-3 h-3 text-teal-500" />
                     {location?.city || location?.province}
                   </div>
                   <div className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     {weather ? Math.round(weather.temperature) : '--'}°
                     <span className="text-base font-normal text-slate-500 dark:text-slate-400">
                       {weather ? getWeatherDescription(weather.weatherCode) : ''}
                     </span>
                   </div>
                 </div>
                 <div className="text-4xl filter drop-shadow-md">
                   {weather ? getWeatherIcon(weather.weatherCode, weather.isDay) : <Loader2 className="animate-spin w-8 h-8 text-slate-300" />}
                 </div>
              </div>

              {/* Details Grid */}
              {weather && (
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                   <div className="flex items-center gap-1.5">
                     <Droplets className="w-3 h-3 text-blue-400" />
                     <span>降水: {weather.precipitation}mm</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <Sunrise className="w-3 h-3 text-amber-400" />
                     <span>日出: {formatTime(weather.sunrise)}</span>
                   </div>
                   <div className="col-span-2 flex items-center gap-1.5 mt-1 border-t border-slate-200 dark:border-slate-700 pt-2">
                     <Sunset className="w-3 h-3 text-orange-400" />
                     <span>日落: {formatTime(weather.sunset)}</span>
                   </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Toggle Indicator */}
        <div className="flex justify-center mt-1 opacity-20">
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : null}
        </div>

      </motion.div>
    </motion.div>
  );
};