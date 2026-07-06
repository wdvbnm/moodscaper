import { Platform } from 'react-native';

export interface LocationResult {
  latitude: number;
  longitude: number;
  city: string;  // 已废弃：城市名现在由天气 API 直接返回
}

export async function getCurrentLocation(): Promise<LocationResult> {
  // Web 端：使用浏览器 Geolocation API
  if (Platform.OS === 'web') {
    return getWebLocation();
  }

  // 原生端：只需 GPS 经纬度，城市名由天气 API 返回
  try {
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        latitude: 31.2304,
        longitude: 121.4737,
        city: '',
      };
    }

    const location = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('定位超时')), 10000)),
    ]);

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      city: '',
    };
  } catch {
    return {
      latitude: 31.2304,
      longitude: 121.4737,
      city: '',
    };
  }
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
