import { LocationData, WeatherData } from '../types';

// 开封坐标
const DEFAULT_KAIFENG = {
    city: '开封',
    province: '河南',
    latitude: 34.7973,
    longitude: 114.3076
};

export const getUserLocation = async (): Promise<LocationData> => {
  try {
    // 使用 get.geojs.io，它更稳定且不易触发 429 限制
    const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (!response.ok) throw new Error('Location API failed');
    
    const data = await response.json();
    
    // 数据校验
    if (!data.latitude || !data.longitude) {
        throw new Error('Invalid location data');
    }

    return {
      city: data.city || DEFAULT_KAIFENG.city,
      province: data.region || DEFAULT_KAIFENG.province,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude)
    };
  } catch (error) {
    console.warn('Location detection failed, defaulting to Kaifeng:', error);
    // Fallback to Kaifeng
    return DEFAULT_KAIFENG;
  }
};

export const getWeather = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation&daily=sunrise,sunset&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch weather');
    const data = await response.json();

    return {
      temperature: data.current_weather.temperature,
      weatherCode: data.current_weather.weathercode,
      isDay: data.current_weather.is_day === 1,
      precipitation: data.hourly?.precipitation?.[0] || 0,
      sunrise: data.daily?.sunrise?.[0],
      sunset: data.daily?.sunset?.[0]
    };
  } catch (error) {
    console.error('Weather error:', error);
    return null;
  }
};

export const getWeatherIcon = (code: number, isDay: boolean) => {
  // WMO Weather interpretation codes (WW)
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code === 1 || code === 2 || code === 3) return isDay ? '⛅' : '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95 && code <= 99) return '⛈️';
  return '🌡️';
};

export const getWeatherDescription = (code: number) => {
  if (code === 0) return '晴朗';
  if (code <= 3) return '多云';
  if (code <= 48) return '雾';
  if (code <= 67) return '雨';
  if (code <= 77) return '雪';
  if (code <= 99) return '雷暴';
  return '未知';
};