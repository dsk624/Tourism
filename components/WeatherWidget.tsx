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
    // Set Date
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
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
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-teal-900 bg-white/70 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-teal-100">
      <div className="text-sm font-medium tracking-wide">
        {dateStr}
      </div>
      <div className="h-4 w-px bg-teal-200 hidden md:block"></div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
        ) : weather ? (
          <>
            <span className="text-lg">{getWeatherIcon(weather.weatherCode)}</span>
            <span>{weather.temperature}°C</span>
            <span className="text-teal-600 font-normal">{getWeatherDescription(weather.weatherCode)}</span>
            <div className="flex items-center gap-1 text-xs text-teal-500 ml-2 font-normal">
               <MapPin className="w-3 h-3" />
               <span>{isDefaultLocation ? '郑州' : '当前位置'}</span>
            </div>
          </>
        ) : (
          <span className="text-gray-400 text-xs">天气信息不可用</span>
        )}
      </div>
    </div>
  );
};