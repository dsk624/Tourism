
import { LocationData, WeatherData } from '../types';

// 默认兜底：开封
const DEFAULT_KAIFENG: LocationData = {
    city: '开封',
    province: '河南',
    latitude: 34.7973,
    longitude: 114.3076
};

/**
 * 获取用户高精度位置
 */
export const getUserLocation = async (): Promise<LocationData> => {
  return new Promise((resolve) => {
    // 1. 尝试使用浏览器原生 Geolocation (最高精度)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // 通过坐标反查城市 (使用 Open-Meteo 的 geocoding 接口或简单 IP 接口补充城市名)
            const cityRes = await fetch(`https://get.geojs.io/v1/ip/geo.json`);
            const cityData = await cityRes.json();
            
            resolve({
              city: cityData.city || '当前位置',
              province: cityData.region || '',
              latitude,
              longitude
            });
          } catch (e) {
            resolve(fetchIPLocation());
          }
        },
        () => resolve(fetchIPLocation()), // 权限拒绝或超时，回退到 IP 定位
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      resolve(fetchIPLocation());
    }
  });
};

/**
 * IP 定位作为备选
 */
const fetchIPLocation = async (): Promise<LocationData> => {
  try {
    const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (!response.ok) throw new Error('Location API failed');
    const data = await response.json();
    
    return {
      city: data.city || DEFAULT_KAIFENG.city,
      province: data.region || DEFAULT_KAIFENG.province,
      latitude: parseFloat(data.latitude) || DEFAULT_KAIFENG.latitude,
      longitude: parseFloat(data.longitude) || DEFAULT_KAIFENG.longitude
    };
  } catch (error) {
    return DEFAULT_KAIFENG;
  }
};

export const getWeather = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,pressure_msl',
      daily: 'sunrise,sunset,uv_index_max',
      timezone: 'auto'
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch weather');
    const data = await response.json();

    const current = data.current;
    const daily = data.daily;

    return {
      temperature: current.temperature_2m,
      weatherCode: current.weather_code,
      isDay: current.is_day === 1,
      precipitation: current.precipitation,
      sunrise: daily.sunrise?.[0],
      sunset: daily.sunset?.[0],
      apparentTemperature: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      uvIndex: daily.uv_index_max?.[0] ?? 0,
      pressure: current.pressure_msl
    };
  } catch (error) {
    console.error('Weather error:', error);
    return null;
  }
};

export const getWeatherIcon = (code: number, isDay: boolean) => {
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
