import React, { useEffect, useState } from 'react';
import { fetchWeather, getWeatherDescription, getWeatherIcon, getLocationByIP } from '../services/weatherService';
import { WeatherData } from '../types';
import { MapPin, Loader2 } from 'lucide-react';

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateStr, setDateStr] = useState('');
  const [location, setLocation] = useState<string>('');
  const [isDefaultLocation, setIsDefaultLocation] = useState<boolean>(false);

  useEffect(() => {
    // Set Date - Simplified format for smaller display
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      weekday: 'short' 
    };
    setDateStr(now.toLocaleDateString('zh-CN', options));

    // 使用IP定位获取天气，无需用户授权
    const getWeather = async () => {
      try {
        const ipLocation = await getLocationByIP();
        const data = await fetchWeather(ipLocation.latitude, ipLocation.longitude);
        setWeather(data);
        setLocation(ipLocation.city || '当前位置');
        setIsDefaultLocation(false);
      } catch (e) {
        console.error("Error fetching weather:", e);
        // 如果IP定位失败，使用默认位置（郑州）
        const data = await fetchWeather(34.7466, 113.6253);
        setWeather(data);
        setLocation('郑州');
        setIsDefaultLocation(true);
      } finally {
        setLoading(false);
      }
    };

    // 调用获取天气函数
    getWeather();
  }, []);

  return (
    <div className="flex flex-row items-center gap-1.5 text-[rgb(13,148,136)] bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border border-[rgb(13,148,136)]/20 w-fit whitespace-nowrap">
      <div className="text-[10px] font-medium tracking-wide">
        {dateStr}
      </div>
      <div className="h-2 w-px bg-[rgb(13,148,136)]/30"></div>
      <div className="flex items-center gap-1 text-[10px] font-medium">
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin text-[rgb(13,148,136)]" />
        ) : weather ? (
          <>
            <span className="text-sm">{getWeatherIcon(weather.weatherCode)}</span>
            <span>{weather.temperature}°</span>
            <span className="text-[rgb(13,148,136)]/80 font-normal truncate max-w-[35px]">{getWeatherDescription(weather.weatherCode)}</span>
            <div className="flex items-center gap-0.5 text-[rgb(13,148,136)]/70 ml-1 font-normal">
               <MapPin className="w-2 h-2" />
               <span className="text-[9px] truncate max-w-[30px]">{isDefaultLocation ? '郑州' : location}</span>
            </div>
          </>
        ) : (
          <span className="text-gray-400 text-[9px]">天气信息不可用</span>
        )}
      </div>
    </div>
  );
};