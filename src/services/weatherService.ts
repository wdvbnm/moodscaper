import { WeatherData, WeatherType, Season } from '../types';
import { LocationResult } from './locationService';

// OpenWeatherMap 免费 API（你需要注册获取 key: https://openweathermap.org/api）
const API_KEY = 'c0a5c5ff8f3e93a10455cd7cf2ecf61a';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

function getSeason(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// OpenWeatherMap 天气代码映射
function mapWeatherCode(code: number): WeatherType {
  // code 范围: https://openweathermap.org/weather-conditions
  if (code >= 200 && code < 300) return 'thunderstorm';
  if (code >= 300 && code < 400) return 'drizzle';
  if (code >= 500 && code < 505) return 'rain';
  if (code === 511) return 'snow';
  if (code >= 520 && code < 600) return 'rain';
  if (code >= 600 && code < 700) return 'snow';
  if (code === 701 || code === 741) return 'fog';
  if (code === 721) return 'haze';
  if (code === 731 || code === 751 || code === 761) return 'windy';
  if (code === 781) return 'thunderstorm'; // 龙卷风算雷暴
  if (code === 800) return 'clear';
  if (code === 801) return 'partly-cloudy';
  if (code === 802) return 'partly-cloudy';
  if (code === 803) return 'cloudy';
  if (code === 804) return 'overcast';
  return 'partly-cloudy';
}

export async function fetchWeather(location: LocationResult): Promise<WeatherData> {
  const { latitude, longitude } = location;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=zh_cn`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`天气API请求失败: ${response.status}`);
    }

    const data = await response.json();

    const weatherType = mapWeatherCode(data.weather[0].id);
    const now = new Date();
    const season = getSeason(now.getMonth() + 1);
    // 城市名直接用天气 API 返回的 name（国内可用，无需单独反地理编码）
    const city = data.name || '未知城市';

    return {
      weatherType,
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      city,
      season,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
    };
  } catch (error) {
    console.warn('天气API请求失败，使用默认数据:', error);
    const now = new Date();
    return {
      weatherType: 'partly-cloudy',
      temperature: 22,
      humidity: 55,
      description: '多云',
      city: '未知城市',
      season: getSeason(now.getMonth() + 1),
      sunrise: 0,
      sunset: 0,
    };
  }
}
