import { Platform } from 'react-native';

export interface LocationResult {
  latitude: number;
  longitude: number;
  city: string;
}

// IP 定位兜底（不需要权限）
async function getIPLocation(): Promise<LocationResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data?.latitude && data?.longitude) {
      return { latitude: data.latitude, longitude: data.longitude, city: '' };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentLocation(): Promise<LocationResult> {
  if (Platform.OS === 'web') {
    return getWebLocation();
  }

  try {
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      // 优先用上次已知位置（毫秒级，Android 几乎总是有）
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown && lastKnown.coords) {
          return {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            city: '',
          };
        }
      } catch {
        // lastKnown 失败，继续尝试实时定位
      }

      // 实时 GPS（15 秒超时）
      try {
        const pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
        ]);
        if (pos && pos.coords) {
          return {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            city: '',
          };
        }
      } catch {
        // GPS 失败，继续下一层
      }
    }

    // IP 定位兜底
    const ipLoc = await getIPLocation();
    if (ipLoc) return ipLoc;
  } catch {
    // 整个 expo-location 不可用
    const ipLoc = await getIPLocation();
    if (ipLoc) return ipLoc;
  }

  // 最终兜底
  return { latitude: 31.2304, longitude: 121.4737, city: '' };
}

function getWebLocation(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 31.2304, longitude: 121.4737, city: '上海' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, city: '' }),
      () => resolve({ latitude: 31.2304, longitude: 121.4737, city: '上海' }),
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}
