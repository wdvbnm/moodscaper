import { Platform } from 'react-native';

export interface LocationResult {
  latitude: number;
  longitude: number;
  city: string;
}

// OpenWeatherMap 反地理编码（国内可用，不依赖 Google）
async function reverseGeocodeViaOWM(lat: number, lon: number): Promise<string | null> {
  try {
    const API_KEY = 'c0a5c5ff8f3e93a10455cd7cf2ecf61a';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    const data = await resp.json();
    if (data?.[0]) {
      return data[0]?.local_names?.zh || data[0]?.name || null;
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

  // 原生端：使用 expo-location + OWM 反地理编码（兼容国内网络）
  try {
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        latitude: 31.2304,
        longitude: 121.4737,
        city: '上海',
      };
    }

    // 10 秒超时，给 GPS 冷启动留足时间
    const location = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('定位超时')), 10000)),
    ]);

    const { latitude, longitude } = location.coords;

    // 优先用 OpenWeatherMap 反地理编码（国内可用）
    const owmCity = await reverseGeocodeViaOWM(latitude, longitude);
    if (owmCity) {
      return { latitude, longitude, city: owmCity };
    }

    // OWM 失败时回退到 expo-location 的 reverseGeocodeAsync
    try {
      const geocode = await Promise.race([
        Location.reverseGeocodeAsync({ latitude, longitude }),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('地理编码超时')), 5000)),
      ]);
      const city = geocode[0]?.city || geocode[0]?.district || geocode[0]?.subregion || geocode[0]?.region || '未知城市';
      if (city !== '未知城市') {
        return { latitude, longitude, city };
      }
    } catch {
      // 回退也失败，继续到 fallback
    }

    return { latitude, longitude, city: '未知城市' };
  } catch {
    return {
      latitude: 31.2304,
      longitude: 121.4737,
      city: '上海',
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
