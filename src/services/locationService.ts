import { Platform } from 'react-native';

export interface LocationResult {
  latitude: number;
  longitude: number;
  city: string;  // 已废弃：城市名现在由天气 API 直接返回
}

// IP 定位兜底（国内可用，不需要权限）
async function getIPLocation(): Promise<LocationResult | null> {
  const tryService = async (url: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data?.latitude && data?.longitude) return { lat: data.latitude, lon: data.longitude };
      if (data?.lat && data?.lon) return { lat: data.lat, lon: data.lon };
      return null;
    } catch {
      return null;
    }
  };

  // 先试 ipapi.co，失败试 ip-api.com
  const r1 = await tryService('https://ipapi.co/json/');
  if (r1) return { latitude: r1.lat, longitude: r1.lon, city: '' };

  const r2 = await tryService('http://ip-api.com/json/?fields=lat,lon');
  if (r2) return { latitude: r2.lat, longitude: r2.lon, city: '' };

  return null;
}

export async function getCurrentLocation(): Promise<LocationResult> {
  if (Platform.OS === 'web') {
    return getWebLocation();
  }

  // 多层策略：上一个失败自动尝试下一个
  try {
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      // ===== 第 1 层：上次已知位置（毫秒级，不费电） =====
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown?.coords) {
          return {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            city: '',
          };
        }
      } catch {
        // 继续下一层
      }

      // ===== 第 2 层：低精度快速定位（几秒内返回） =====
      try {
        const fastLocation = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
            timeInterval: 1000,      // 接受 1 秒内的缓存
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('快速定位超时')), 8000)),
        ]);
        if (fastLocation?.coords) {
          return {
            latitude: fastLocation.coords.latitude,
            longitude: fastLocation.coords.longitude,
            city: '',
          };
        }
      } catch {
        // 继续下一层
      }

      // ===== 第 3 层：标准精度定位（更慢但更准） =====
      try {
        const location = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GPS 超时')), 15000)),
        ]);
        if (location?.coords) {
          return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            city: '',
          };
        }
      } catch {
        // 继续下一层
      }
    }

    // ===== 第 4 层：IP 网络定位（不需要 GPS 权限） =====
    const ipLocation = await getIPLocation();
    if (ipLocation) {
      return ipLocation;
    }
  } catch {
    // expo-location 模块加载失败
  }

  // ===== 最终兜底 =====
  return {
    latitude: 31.2304,
    longitude: 121.4737,
    city: '',
  };
}

// Web 端定位（浏览器原生 Geolocation API）
function getWebLocation(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 31.2304, longitude: 121.4737, city: '上海' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          city: '',
        });
      },
      () => {
        resolve({ latitude: 31.2304, longitude: 121.4737, city: '上海' });
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}
