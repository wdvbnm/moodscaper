import { Platform } from 'react-native';

export interface LocationResult {
  latitude: number;
  longitude: number;
  city: string; // ipapi 返回的城市名，作为天气 API 的备选
}

// IP 定位优先（1-2 秒出结果，无需权限，省级精度够天气用）
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
        city: data.city || '', // ipapi 的城市名
      };
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

  // 第 1 层：IP 定位（快，2 秒内出结果）
  const ipLoc = await getIPLocation();
  if (ipLoc) return ipLoc;

  // 第 2 层：GPS（需要权限，室内可能慢）
  try {
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      // 2a. 上次已知位置（5 秒超时）
      try {
        const lastKnown = await Promise.race([
          Location.getLastKnownPositionAsync(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        if (lastKnown && lastKnown.coords) {
          return {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            city: '',
          };
        }
      } catch { /* 超时或失败 */ }

      // 2b. 实时 GPS（10 秒超时，Balanced 精度室内也可能有结果）
      try {
        const pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
        ]);
        if (pos && pos.coords) {
          return {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            city: '',
          };
        }
      } catch { /* 超时或失败 */ }
    }
  } catch { /* expo-location 不可用 */ }

  // 最终兜底：上海
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
