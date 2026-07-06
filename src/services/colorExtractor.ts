import { Platform } from 'react-native';
import { ColorPalette } from '../types';

// ===== 从壁纸图片提取主色调 =====
// 原生端不支持 Canvas API，返回 null 让调用方使用主题自带配色

export async function extractColorsFromImage(imageUrl: string): Promise<ColorPalette | null> {
  if (Platform.OS !== 'web') {
    return null; // 原生端使用主题预置配色
  }

  // Web 端使用 Canvas 提取
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const sampleSize = 50;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext('2d')!;

        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, sampleSize, sampleSize);

        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;

        const colorClusters: { r: number; g: number; b: number; count: number }[] = [];
        const step = 4;

        for (let i = 0; i < pixels.length; i += step * 4) {
          const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
          if (a < 128) continue;
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const existing = colorClusters.find((c) => c.r === qr && c.g === qg && c.b === qb);
          if (existing) existing.count++;
          else colorClusters.push({ r: qr, g: qg, b: qb, count: 1 });
        }

        colorClusters.sort((a, b) => b.count - a.count);
        if (colorClusters.length === 0) { resolve(null); return; }

        const top5 = colorClusters.slice(0, 5).map(
          (c) => `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`
        );

        const avgLuminance = top5.slice(0, 3).map((hex) => {
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          return 0.299 * r + 0.587 * g + 0.114 * b;
        }).reduce((a, b) => a + b, 0) / 3;

        const isDark = avgLuminance < 0.4;
        const dominant = top5[0];
        const palette: ColorPalette = {
          primary: isDark ? lighten(top5[1] || top5[0], 20) : darken(top5[1] || top5[0], 15),
          secondary: isDark ? lighten(top5[2] || top5[0], 30) : darken(top5[2] || top5[0], 20),
          background: isDark ? darken(dominant, 30) : lighten(dominant, 35),
          surface: isDark ? darken(dominant, 20) : lighten(dominant, 45),
          text: isDark ? '#E8E4F0' : darken(dominant, 50),
          textSecondary: isDark ? '#B5ADC4' : darken(dominant, 30),
          accent: isDark ? lighten(top5[3] || top5[0], 25) : darken(top5[3] || top5[0], 10),
          muted: isDark ? darken(dominant, 25) : lighten(dominant, 30),
        };
        resolve(palette);
      } catch { resolve(null); }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

function lighten(hex: string, amount: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, r + amount);
  g = Math.min(255, g + amount);
  b = Math.min(255, b + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function darken(hex: string, amount: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
