import { DailyTheme, WeatherType } from '../types';
import { Platform } from 'react-native';

const W = 1290;
const H = 2796;
const PREVIEW_W = 360;
const PREVIEW_H = 780;
const UNSPLASH_KEY = 'QPlyeu1KsheWanIvZTkei3-18FyDmkbNdIYiB-GfxWQ';

// ===== Unsplash 搜索词（匹配小红书抖音爆款风格） =====
const SEARCH_MAP: Record<WeatherType, string[]> = {
  clear: ['warm golden sunlight nature landscape', 'morning light mountain aesthetic', 'sunrise field dreamy', 'soft sun flare forest'],
  'partly-cloudy': ['dramatic sky sun rays clouds', 'cloudscape aesthetic dreamy', 'beautiful sky heaven light', 'sun breaking through clouds'],
  cloudy: ['moody cloudy sky aesthetic', 'grey atmosphere dramatic', 'cloud layers dark light', 'storm clouds gathering'],
  overcast: ['overcast moody minimal landscape', 'grey sky vast empty', 'dark clouds dramatic atmosphere', 'brooding sky nature'],
  rain: ['rain on window cozy warm light', 'raindrops on glass bokeh', 'rainy street night reflection', 'wet leaves rain drops macro'],
  drizzle: ['misty gentle rain morning forest', 'light rain foggy mountain', 'dew drops spider web macro', 'soft rain garden green'],
  thunderstorm: ['lightning storm night dramatic', 'dark storm clouds epic sky', 'thunderstorm ocean powerful', 'purple lightning sky'],
  snow: ['snow winter forest magical', 'snowfall peaceful landscape', 'snowy mountain peak sunrise', 'white winter wonderland trees'],
  fog: ['foggy forest morning mystical', 'misty mountain fog layers', 'fog lake dawn peaceful', 'thick fog pine trees atmospheric'],
  haze: ['golden haze valley sunrise', 'misty morning soft warm light', 'hazy sunset layers hills', 'soft morning fog dreamy'],
  windy: ['wind grass field golden light', 'autumn leaves blowing wind', 'dramatic ocean waves storm', 'wind swept landscape motion'],
};

// ===== AI 提示词（备选，慢但独特） =====
const AI_PROMPTS: Record<WeatherType, string> = {
  clear: 'beautiful golden hour landscape, warm sunlight, cinematic atmosphere, photorealistic, 8k, no text no watermark',
  'partly-cloudy': 'dramatic sky sun rays clouds, atmospheric, cinematic 8k, no text no watermark',
  cloudy: 'moody landscape grey clouds, atmospheric dramatic, cinematic, no text no watermark',
  overcast: 'minimal landscape overcast sky, soft grey, peaceful, fine art, no text no watermark',
  rain: 'rain on window warm light inside, cozy bokeh, cinematic mood, 8k, no text no watermark',
  drizzle: 'misty gentle rain forest, soft tones, atmospheric, cinematic, no text no watermark',
  thunderstorm: 'dramatic lightning dark sky, epic atmosphere, cinematic 8k, no text no watermark',
  snow: 'snowy forest winter, soft light, peaceful magic, cinematic 8k, no text no watermark',
  fog: 'foggy forest dawn sun rays mist, ethereal, cinematic 8k, no text no watermark',
  haze: 'golden haze valley sunrise, soft warm, atmospheric, cinematic, no text no watermark',
  windy: 'wind blowing grass field golden light, atmospheric, cinematic 8k, no text no watermark',
};

// ===== 获取 Unsplash 壁纸（快） =====
async function fetchUnsplashUrl(weatherType: WeatherType, seed: number): Promise<string> {
  const queries = SEARCH_MAP[weatherType] || SEARCH_MAP['partly-cloudy'];
  const query = queries[seed % queries.length];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=portrait&count=1&client_id=${UNSPLASH_KEY}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await resp.json();
    const photo = Array.isArray(data) ? data[0] : data;
    if (photo?.urls?.full) return photo.urls.full;
  } catch {}
  return '';
}

// ===== 公开接口 =====

// 壁纸预览 URL：先立即返回 Picsum（稳定、CDN 全球覆盖），后台尝试 Unsplash 替换
// 预览用小尺寸（640x1386），文件小 4-8 倍，秒加载
export async function getWallpaperPreviewUrl(
  weatherType: WeatherType,
  seed: number
): Promise<{ primary: string; enhanced: Promise<string | null>; downloadUrl: string }> {
  // 主 URL：Picsum 小尺寸预览，立即可用
  const primary = `https://picsum.photos/seed/${weatherType}${seed}/${PREVIEW_W}/${PREVIEW_H}`;
  // 下载用大尺寸
  const downloadUrl = `https://picsum.photos/seed/${weatherType}${seed}/${W}/${H}`;

  // 增强 URL：Unsplash 小尺寸，后台异步加载
  const enhanced = fetchUnsplashUrl(weatherType, seed).then((unsplashFull) => {
    if (!unsplashFull) return null;
    // Unsplash 支持 &w= 参数缩放，把大图 URL 改成小尺寸
    return unsplashFull.replace(/&w=\d+/g, '') + `&w=${PREVIEW_W}`;
  });

  return { primary, enhanced, downloadUrl };
}

// 获取下载用大图 URL
export function getWallpaperDownloadUrl(weatherType: WeatherType, seed: number): string {
  return `https://picsum.photos/seed/${weatherType}${seed}/${W}/${H}`;
}

// AI 生成壁纸 URL（慢但独特）
export function getAIWallpaperUrl(weatherType: WeatherType): string {
  const prompt = AI_PROMPTS[weatherType] || AI_PROMPTS['partly-cloudy'];
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${W}&height=${H}&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
}

// 下载壁纸
export async function generateWallpaperImage(theme: DailyTheme): Promise<string> {
  if (Platform.OS !== 'web') return '';
  return '';
}

export function downloadWallpaper(dataUrl: string, filename: string) {
  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }
  // 原生端下载由调用方通过 expo-file-system + expo-media-library 处理
}
