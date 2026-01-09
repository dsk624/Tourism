
import { LocationData, WeatherData } from '../types';

/**
 * 默认位置：郑州（华夏文明腹地）
 */
const DEFAULT_LOCATION: LocationData = {
  city: '郑州市',
  province: '河南省',
  latitude: 34.7466,
  longitude: 113.6253
};

/**
 * 获取用户位置（增强型无感模式）
 * 依次尝试 Cloudflare 边缘定位和 GeoJS IP 定位
 * 如果全部失败，回退到默认位置，确保组件始终可见
 */
export const getUserLocation = async (): Promise<LocationData | null> => {
  try {
    // 1. 优先尝试 Cloudflare 边缘节点定位
    const response = await fetch('/api/location');
    if (!response.ok) {
        throw new Error('Edge location unavailable');
    }
    
    const data = await response.json();
    
    // 严格校验坐标
    if (!data.latitude || !data.longitude || isNaN(data.latitude) || isNaN(data.longitude)) {
      throw new Error('Invalid coordinates');
    }
    return data;
  } catch (error) {
    console.warn('Seamless edge location unavailable, trying fallback...');
    return fetchIPLocation();
  }
};

/**
 * IP 定位作为二级备选
 */
const fetchIPLocation = async (): Promise<LocationData | null> => {
  try {
    const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (!response.ok) throw new Error('IP Location API failed');
    const data = await response.json();
    
    // 必须有经纬度才视为成功
    if (!data.latitude || !data.longitude || isNaN(parseFloat(data.latitude))) {
      throw new Error('IP coordinates missing');
    }
    
    return {
      city: data.city || '您的位置',
      province: data.region || '',
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude)
    };
  } catch (error) {
    console.warn('All automatic location methods failed. Using default location (Zhengzhou).');
    // 如果所有自动手段都失败，返回默认值而不是 null，保证天气组件不消失
    return DEFAULT_LOCATION;
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
    console.error('Weather data fetch error:', error);
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
