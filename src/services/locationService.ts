import { Platform } from 'react-native';

export interface LocationResult {
  latitude: number;
  longitude: number;
  city: string;
}

// 高德 Web 服务 Key（去 https://console.amap.com/ 申请，类型选「Web服务」）
const AMAP_KEY = 'acfed61f487eb7d7899d3186913eae58';

// 高德 IP 定位：国内 IP 城市识别精准，1-2 秒出结果
async function getAmapIPLocation(): Promise<LocationResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(
      `https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.status !== '1' || !data.rectangle) return null;

    // rectangle 格式: "114.04,30.35;114.77,30.83"（左下;右上）
    const [sw, ne] = data.rectangle.split(';');
    const [swLng, swLat] = sw.split(',').map(Number);
    const [neLng, neLat] = ne.split(',').map(Number);
    const lat = (swLat + neLat) / 2;
    const lng = (swLng + neLng) / 2;

    // 城市名：省 + 市（如"湖北省武汉市"）
    const province = data.province || '';
    const city = data.city || '';
    const cityName = province && city
      ? (province === city ? city : `${province}${city}`)
      : (city || province || '');

    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng, city: cityName };
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

  // 第 1 层：高德 IP 定位（快，2 秒内，国内城市名精准）
  const amapLoc = await getAmapIPLocation();
  if (amapLoc) return amapLoc;

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

      // 2b. 实时 GPS（10 秒超时）
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

  // 最终兜底：北京
  return { latitude: 39.9042, longitude: 116.4074, city: '' };
}

function getWebLocation(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 39.9042, longitude: 116.4074, city: '北京' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, city: '' }),
      () => resolve({ latitude: 39.9042, longitude: 116.4074, city: '北京' }),
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}
