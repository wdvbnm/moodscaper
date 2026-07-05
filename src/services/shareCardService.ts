import { DailyTheme } from '../types';

const CARD_W = 1080;
const CARD_H = 1920;

// ===== 生成分享卡片 =====
export async function generateShareCard(
  theme: DailyTheme,
  wallpaperUrl: string
): Promise<string> {
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

    // 加载壁纸图
    const img = document.createElement('img') as HTMLImageElement;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // === 上半部分：壁纸图片 ===
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

      // 图片底部渐变过渡
      const imgFade = ctx.createLinearGradient(0, imgAreaH - 120, 0, imgAreaH);
      imgFade.addColorStop(0, 'transparent');
      imgFade.addColorStop(1, '#1A1815');
      ctx.fillStyle = imgFade;
      ctx.fillRect(0, imgAreaH - 120, CARD_W, 120);

      // === 下半部分：信息卡片 ===
      const infoY = imgAreaH;
      const infoH = CARD_H - infoY;

      // 背景
      const bgGrad = ctx.createLinearGradient(0, infoY, 0, CARD_H);
      bgGrad.addColorStop(0, '#1A1815');
      bgGrad.addColorStop(1, '#2A2520');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, infoY, CARD_W, infoH);

      // 装饰线
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, infoY + 30);
      ctx.lineTo(CARD_W - 60, infoY + 30);
      ctx.stroke();

      // 天气图标 + 温度
      const wxIcon = weatherIcons[theme.weatherType] || '🌤️';
      ctx.font = '56px sans-serif';
      ctx.fillText(wxIcon, 60, infoY + 90);

      ctx.fillStyle = '#FFF';
      ctx.font = '200 72px -apple-system, sans-serif';
      ctx.fillText(`${theme.temperature}°`, 140, infoY + 90);

      // 天气描述
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '400 24px -apple-system, sans-serif';
      ctx.fillText(`${theme.weatherDescription} · ${theme.city}`, 60, infoY + 135);

      // 时间日期
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '300 32px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(timeStr, CARD_W - 60, infoY + 65);
      ctx.font = '300 18px -apple-system, sans-serif';
      ctx.fillText(dateStr, CARD_W - 60, infoY + 95);
      ctx.textAlign = 'left';

      // 氛围文案
      ctx.fillStyle = '#FFF';
      ctx.font = '400 36px -apple-system, sans-serif';
      const mood = `「${theme.moodLabel}」`;
      // 手动换行
      const maxLineW = CARD_W - 120;
      if (ctx.measureText(mood).width > maxLineW) {
        const mid = Math.floor(mood.length / 2);
        const line1 = mood.slice(0, mid);
        const line2 = mood.slice(mid);
        ctx.fillText(line1, 60, infoY + 210);
        ctx.fillText(line2, 60, infoY + 260);
      } else {
        ctx.fillText(mood, 60, infoY + 210);
      }

      // 底部品牌 + 标语
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '500 16px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MoodScaper', CARD_W / 2, CARD_H - 65);

      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '300 13px -apple-system, sans-serif';
      ctx.fillText('每天一张天气氛围壁纸', CARD_W / 2, CARD_H - 38);

      // 虚线装饰
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CARD_W / 2 - 120, CARD_H - 18);
      ctx.lineTo(CARD_W / 2 + 120, CARD_H - 18);
      ctx.stroke();
      ctx.setLineDash([]);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      // 图片加载失败，用纯色背景
      ctx.fillStyle = '#1A1815';
      ctx.fillRect(0, 0, CARD_W, CARD_H);
      ctx.fillStyle = '#FFF';
      ctx.font = '300 30px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MoodScaper · 今日氛围', CARD_W / 2, CARD_H / 2);
      resolve(canvas.toDataURL('image/png'));
    };

    img.src = wallpaperUrl;
  });
}

// ===== 下载分享卡片 =====
export function downloadShareCard(dataUrl: string) {
  const link = document.createElement('a');
  link.download = `moodscaper-share-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = dataUrl;
  link.click();
}
