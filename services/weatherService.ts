import { WeatherData } from '../types';

// 获取IP位置信息
export const getLocationByIP = async (): Promise<{ latitude: number; longitude: number; city?: string }> => {
  try {
    // 使用免费的IP定位服务
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.latitude && data.longitude) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city
      };
    }
    
    // 如果IP定位失败，使用默认位置（郑州）
    return {
      latitude: 34.7466,
      longitude: 113.6253,
      city: '郑州'
    };
  } catch (error) {
    console.error("Error getting location by IP:", error);
    // 如果IP定位失败，使用默认位置（郑州）
    return {
      latitude: 34.7466,
      longitude: 113.6253,
      city: '郑州'
    };
  }
};

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );
    const data = await response.json();
    
    if (!data.current_weather) {
      throw new Error("Weather data unavailable");
    }

    return {
      temperature: data.current_weather.temperature,
      weatherCode: data.current_weather.weathercode,
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    throw error;
  }
};

export const getWeatherDescription = (code: number): string => {
  // Simplified WMO Weather interpretation codes (WW)
  if (code === 0) return "晴朗";
  if (code >= 1 && code <= 3) return "多云";
  if (code >= 45 && code <= 48) return "雾";
  if (code >= 51 && code <= 55) return "毛毛雨";
  if (code >= 61 && code <= 65) return "雨";
  if (code >= 71 && code <= 77) return "雪";
  if (code >= 95) return "雷雨";
  return "多变";
};

export const getWeatherIcon = (code: number): string => {
   if (code === 0) return "☀️";
   if (code >= 1 && code <= 3) return "⛅";
   if (code >= 45 && code <= 48) return "🌫️";
   if (code >= 51 && code <= 65) return "🌧️";
   if (code >= 71 && code <= 77) return "❄️";
   if (code >= 95) return "⛈️";
   return "🌡️";
}
