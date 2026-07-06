import { Platform } from 'react-native';

export interface LocationResult {
  latitude: number;
  longitude: number;
  city: string;  // 已废弃：城市名现在由天气 API 直接返回
}

// IP 定位兜底（GPS 失败时用，不需要任何权限）
async function getIPLocation(): Promise<LocationResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data?.latitude && data?.longitude) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: '',  // 城市名仍由天气 API 返回
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentLocation(): Promise<LocationResult> {
  // Web 端：使用浏览器 Geolocation API
  if (Platform.OS === 'web') {
    return getWebLocation();
  }

  // 原生端：GPS → IP 定位 → 上海兜底
  try {
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      try {
        const location = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('定位超时')), 10000)),
        ]);
        // GPS 成功
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          city: '',
        };
      } catch {
        // GPS 超时或失败 → 尝试 IP 定位
      }
    }

    // IP 定位兜底（不需要权限）
    const ipLocation = await getIPLocation();
    if (ipLocation) {
      return ipLocation;
    }
  } catch {
    // expo-location 加载失败 → 尝试 IP 定位
  }

  // 最终兜底
  return {
    latitude: 31.2304,
    longitude: 121.4737,
    city: '',
  };
}

// Web 端定位（浏览器原生 Geolocation API + fetch 反地理编码）
function getWebLocation(): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // 浏览器不支持定位，返回默认城市
      resolve({
        latitude: 31.2304,
        longitude: 121.4737,
        city: '上海',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // 用 OpenWeatherMap 反地理编码获取城市名
        try {
          const API_KEY = 'c0a5c5ff8f3e93a10455cd7cf2ecf61a';
          const resp = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`
          );
          const data = await resp.json();
          const city = data[0]?.local_names?.zh || data[0]?.name || '你的城市';
          resolve({ latitude, longitude, city });
        } catch {
          resolve({ latitude, longitude, city: '你的城市' });
        }
      },
      () => {
        // 用户拒绝定位，用默认
        resolve({
          latitude: 31.2304,
          longitude: 121.4737,
          city: '上海',
        });
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
  });
}
