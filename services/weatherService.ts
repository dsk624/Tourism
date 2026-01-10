
import { LocationData, WeatherData } from '../types';

/**
 * 默认位置：郑州市（华夏文明腹地）
 */
const DEFAULT_LOCATION: LocationData = {
  city: '郑州市',
  province: '河南省',
  latitude: 34.7466,
  longitude: 113.6253
};

/**
 * 获取用户位置（增强型无感模式）
 * 1. 尝试浏览器原生 Geolocation (最精确)
 * 2. 尝试 GeoJS IP 定位 (静默备选)
 * 3. 最终回退到默认郑州位置
 */
export const getUserLocation = async (): Promise<LocationData | null> => {
  // 策略 A: 尝试浏览器原生定位
  const getBrowserGeo = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Not supported');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            city: '您的位置',
            province: '',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        (err) => reject(err),
        { timeout: 5000 }
      );
    });
  };

  try {
    // 优先尝试原生定位
    return await getBrowserGeo();
  } catch (error) {
    console.warn('Browser geolocation failed, trying IP fallback...');
    // 策略 B: 尝试 IP 定位
    return await fetchIPLocation();
  }
};

/**
 * IP 定位实现
 */
const fetchIPLocation = async (): Promise<LocationData | null> => {
  try {
    // 使用公开的 GeoJS API，无需内部转发，避免 404
    const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (!response.ok) throw new Error('IP Location API failed');
    const data = await response.json();
     
    if (!data.latitude || !data.longitude) {
      throw new Error('IP coordinates missing');
    }
    
    return {
      city: data.city || '您的位置',
      province: data.region || '',
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude)
    };
  } catch (error) {
    console.warn('All location methods failed. Using default.');
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
