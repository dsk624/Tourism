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

// 使用浏览器地理定位获取位置（更精确）
export const getLocationByBrowser = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`浏览器定位失败: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 300000 // 5分钟缓存
      }
    );
  });
};

// 获取城市名称
export const getCityByCoordinates = async (lat: number, lon: number): Promise<string> => {
  try {
    // 使用OpenStreetMap Nominatim反向地理编码服务
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh-CN`
    );
    const data = await response.json();
    if (data.address) {
      return data.address.city || data.address.town || data.address.village || '当前位置';
    }
    return '当前位置';
  } catch (error) {
    console.error("Error getting city by coordinates:", error);
    return '当前位置';
  }
};

// 主定位函数：优先使用浏览器定位，失败则使用IP定位
export const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number; city: string }> => {
  try {
    // 优先使用浏览器地理定位（更精确）
    const browserLocation = await getLocationByBrowser();
    const city = await getCityByCoordinates(browserLocation.latitude, browserLocation.longitude);
    return {
      ...browserLocation,
      city
    };
  } catch (browserError) {
    console.log("Browser geolocation failed, falling back to IP geolocation:", browserError.message);
    
    // 如果浏览器定位失败，使用IP定位
    const ipLocation = await getLocationByIP();
    if (ipLocation.city) {
      return {
        ...ipLocation,
        city: ipLocation.city
      };
    }
    
    // 如果IP定位没有返回城市，使用坐标获取城市名称
    const city = await getCityByCoordinates(ipLocation.latitude, ipLocation.longitude);
    return {
      ...ipLocation,
      city
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
