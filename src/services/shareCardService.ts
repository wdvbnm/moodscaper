import { Platform, Share } from 'react-native';
import { DailyTheme } from '../types';

const CARD_W = 1080;
const CARD_H = 1920;

export async function generateShareCard(
  theme: DailyTheme,
  wallpaperUrl: string
): Promise<string> {
  // 原生端不支持 Canvas，返回空字符串，由调用方用 React Native Share API
  if (Platform.OS !== 'web') {
    return '';
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d')!;

    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
    const weatherIcons: Record<string, string> = {
      clear: '☀️', 'partly-cloudy': '⛅', cloudy: '☁️', overcast: '🌥️',
      rain: '🌧️', drizzle: '🌦️', thunderstorm: '⛈️', snow: '❄️',
      fog: '🌫️', haze: '🌁', windy: '💨',
    };

    const img = document.createElement('img') as HTMLImageElement;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const imgAreaH = CARD_H * 0.62;
        const imgRatio = img.width / img.height;
        const targetRatio = CARD_W / imgAreaH;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (imgRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CARD_W, imgAreaH);

        const imgFade = ctx.createLinearGradient(0, imgAreaH - 120, 0, imgAreaH);
        imgFade.addColorStop(0, 'transparent');
        imgFade.addColorStop(1, '#1A1815');
        ctx.fillStyle = imgFade;
        ctx.fillRect(0, imgAreaH - 120, CARD_W, 120);

        const infoY = imgAreaH;
        const infoH = CARD_H - infoY;
        const bgGrad = ctx.createLinearGradient(0, infoY, 0, CARD_H);
        bgGrad.addColorStop(0, '#1A1815');
        bgGrad.addColorStop(1, '#2A2520');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, infoY, CARD_W, infoH);

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, infoY + 30);
        ctx.lineTo(CARD_W - 60, infoY + 30);
        ctx.stroke();

        const wxIcon = weatherIcons[theme.weatherType] || '🌤️';
        ctx.font = '56px sans-serif';
        ctx.fillText(wxIcon, 60, infoY + 90);
        ctx.fillStyle = '#FFF';
        ctx.font = '200 72px -apple-system, sans-serif';
        ctx.fillText(`${theme.temperature}°`, 140, infoY + 90);
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.font = '400 24px -apple-system, sans-serif';
        ctx.fillText(`${theme.weatherDescription} · ${theme.city}`, 60, infoY + 135);

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '300 32px -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(timeStr, CARD_W - 60, infoY + 65);
        ctx.font = '300 18px -apple-system, sans-serif';
        ctx.fillText(dateStr, CARD_W - 60, infoY + 95);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#FFF';
        ctx.font = '400 36px -apple-system, sans-serif';
        const mood = `「${theme.moodLabel}」`;
        ctx.fillText(mood, 60, infoY + 210);

        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '500 16px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MoodScaper', CARD_W / 2, CARD_H - 65);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '300 13px -apple-system, sans-serif';
        ctx.fillText('每天一张天气氛围壁纸', CARD_W / 2, CARD_H - 38);

        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve('');
      }
    };

    img.onerror = () => resolve('');
    img.src = wallpaperUrl;
  });
}

export function downloadShareCard(dataUrl: string) {
  if (Platform.OS !== 'web') return;
  const link = document.createElement('a');
  link.download = `moodscaper-share-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = dataUrl;
  link.click();
}

// 原生端分享：使用 React Native Share API
export function shareThemeText(theme: DailyTheme): void {
  const message = [
    `🌤️ MoodScaper · 今日氛围`,
    `「${theme.moodLabel}」`,
    `${theme.temperature}°C · ${theme.weatherDescription} · ${theme.city}`,
  ].join('\n');
  Share.share({ message });
}
