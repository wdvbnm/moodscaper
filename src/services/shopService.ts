const UNSPLASH_KEY = 'QPlyeu1KsheWanIvZTkei3-18FyDmkbNdIYiB-GfxWQ';
const API_BASE = 'https://api.unsplash.com';

export interface ShopWallpaper {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  author: string;
  authorUrl: string;
}

export interface ShopCategory {
  key: string;
  label: string;
  emoji: string;
  query: string;
}

export const CATEGORIES: ShopCategory[] = [
  // 小红书抖音爆款风格 → Unsplash 搜索词
  { key: 'moody',      label: '氛围感', emoji: '🌫️', query: 'misty foggy atmospheric landscape dreamy soft light' },
  { key: 'nature',     label: '自然宇宙', emoji: '🌌', query: 'starry night aurora milky way mountain lake aurora borealis' },
  { key: 'minimal',    label: '极简高级', emoji: '🤍', query: 'minimalist clean white space elegant simple zen' },
  { key: 'healing',    label: '温柔治愈', emoji: '🕯️', query: 'warm sunlight cozy soft tones peaceful calm healing' },
  { key: 'fluid',      label: '流体渐变', emoji: '🎨', query: 'abstract fluid gradient soft colors smooth silk texture' },
  { key: 'retro',      label: '复古胶片', emoji: '📷', query: 'vintage film grain nostalgic warm analog photography' },
  { key: 'cyberpunk',  label: '赛博暗色', emoji: '🌑', query: 'cyberpunk neon dark night city futuristic aesthetic' },
  { key: 'ocean',      label: '海街日记', emoji: '🌊', query: 'ocean waves beach sunset coastline peaceful sea' },
  { key: 'portrait',   label: '人像写真', emoji: '🧍', query: 'portrait photography aesthetic beautiful face fashion' },
  { key: 'pet',        label: '治愈萌宠', emoji: '🐱', query: 'cute cat dog pet animal adorable fluffy kitten puppy' },
];

export async function fetchShopWallpapers(
  category: ShopCategory,
  page: number = 1
): Promise<ShopWallpaper[]> {
  const perPage = 20;

  try {
    const params = new URLSearchParams({
      query: category.query,
      orientation: 'portrait',
      per_page: String(perPage),
      page: String(page),
      client_id: UNSPLASH_KEY,
    });
    const resp = await fetch(`${API_BASE}/search/photos?${params}`);
    const data = await resp.json();
    const photos = data.results || [];

    return photos.map((p: any) => ({
      id: p.id,
      thumbUrl: `${p.urls.raw}&w=400&h=600&fit=crop&auto=format`,
      fullUrl: `${p.urls.raw}&w=1290&h=2796&fit=crop&crop=entropy&auto=format`,
      author: p.user?.name || 'Unsplash',
      authorUrl: p.user?.links?.html || 'https://unsplash.com',
    }));
  } catch {
    return [];
  }
}

export async function fetchWallpaperDetail(photoId: string): Promise<ShopWallpaper | null> {
  try {
    const resp = await fetch(`${API_BASE}/photos/${photoId}?client_id=${UNSPLASH_KEY}`);
    const p = await resp.json();
    if (!p?.urls) return null;
    return {
      id: p.id,
      thumbUrl: `${p.urls.raw}&w=400&h=600&fit=crop&auto=format`,
      fullUrl: `${p.urls.raw}&w=1290&h=2796&fit=crop&crop=entropy&auto=format`,
      author: p.user?.name || 'Unsplash',
      authorUrl: p.user?.links?.html || 'https://unsplash.com',
    };
  } catch {
    return null;
  }
}
