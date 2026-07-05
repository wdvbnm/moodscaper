import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image as RNImage,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../store/AppContext';
import { useMembership } from '../store/MembershipContext';
import { getWallpaperPreviewUrl, getAIWallpaperUrl, downloadWallpaper } from '../services/wallpaperGenerator';
import { extractColorsFromImage } from '../services/colorExtractor';
import type { ColorPalette } from '../types';

const WEATHER_ICONS: Record<string, string> = {
  clear: '☀️', 'partly-cloudy': '⛅', cloudy: '☁️', overcast: '🌥️',
  rain: '🌧️', drizzle: '🌦️', thunderstorm: '⛈️', snow: '❄️',
  fog: '🌫️', haze: '🌁', windy: '💨',
};

export default function HomeScreen() {
  const { todayTheme, wallpaperSeed, isLoading, shuffleTodayTheme } = useAppContext();
  const { isPro } = useMembership();
  const [uiPalette, setUiPalette] = useState<ColorPalette | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imgError, setImgError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // 异步获取壁纸预览 URL（优先使用图库壁纸）
  useEffect(() => {
    if (!todayTheme) return;
    let cancelled = false;
    setImgError(false);

    // 先检查是否有用户设置的图库壁纸
    import('../services/photoStorage').then(({ getCurrentPhoto }) => {
      getCurrentPhoto().then((customUrl) => {
        if (!cancelled && customUrl) {
          setPreviewUrl(customUrl);
          extractColorsFromImage(customUrl).then((colors) => {
            if (!cancelled && colors) setUiPalette(colors);
          }).catch(() => {});
          return;
        }
        // 没有自定义壁纸，用天气壁纸
        getWallpaperPreviewUrl(todayTheme.weatherType, wallpaperSeed)
          .then((url) => {
            if (cancelled || !url) { setImgError(true); return; }
            setPreviewUrl(url);
            extractColorsFromImage(url).then((colors) => {
              if (!cancelled && colors) setUiPalette(colors);
            }).catch(() => {});
          })
          .catch(() => { if (!cancelled) setImgError(true); });
      });
    });

    return () => { cancelled = true; };
  }, [todayTheme?.weatherType, wallpaperSeed]);

  const palette = uiPalette || todayTheme?.palette;

  if (isLoading && !todayTheme) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>正在获取今天的氛围...</Text>
      </View>
    );
  }

  if (!todayTheme || !palette) return null;

  const weatherIcon = WEATHER_ICONS[todayTheme.weatherType] || '🌤️';
  const now = new Date();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const handleDownload = async () => {
    if (!previewUrl) return;
    setDownloading(true);
    try {
      // 把当前显示的壁纸照片加载到 Canvas，叠加时间和文案，导出下载
      const img = document.createElement('img') as HTMLImageElement;
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = previewUrl;
      });

      const canvas = document.createElement('canvas');
      const W = 1290, H = 2796;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // 居中裁剪，适配手机壁纸比例
      const imgRatio = img.width / img.height;
      const targetRatio = W / H;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

      // 暗角
      const v = ctx.createRadialGradient(W/2, H/2, H*0.35, W/2, H/2, H*0.8);
      v.addColorStop(0, 'transparent');
      v.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);

      // 底部渐变
      const b = ctx.createLinearGradient(0, H*0.68, 0, H);
      b.addColorStop(0, 'transparent');
      b.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = b;
      ctx.fillRect(0, H*0.68, W, H*0.32);

      // 时间
      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '200 140px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(timeStr, W - 80, H * 0.83);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '300 36px -apple-system, sans-serif';
      ctx.fillText(`${now.getMonth()+1}月${now.getDate()}日`, W - 80, H*0.83+54);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '300 26px -apple-system, sans-serif';
      ctx.fillText(`${todayTheme.city} · ${todayTheme.temperature}°C`, W - 80, H*0.83+102);

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '300 30px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`「${todayTheme.moodLabel}」`, 80, H * 0.83);

      const dataUrl = canvas.toDataURL('image/png');
      downloadWallpaper(dataUrl, `moodscaper-${todayTheme.date}-${todayTheme.weatherType}.png`);
    } catch {} finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ===== 全屏壁纸背景 ===== */}
      {previewUrl && !imgError ? (
        <RNImage
          source={{ uri: previewUrl }}
          onError={() => setImgError(true)}
          style={styles.bgImage}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[palette.primary, palette.secondary, palette.background]}
          start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={styles.bgPlaceholder}
        />
      )}

      {/* 从上到下的渐变遮罩，让文字可读 */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={styles.topGradient}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={styles.bottomGradient}
      />

      {/* ===== 内容层 ===== */}
      <View style={styles.contentLayer}>

        {/* 顶部：日期 + 星期 */}
        <View style={styles.topBar}>
          <Text style={styles.dateText}>
            {now.getMonth() + 1}月{now.getDate()}日 星期{weekDays[now.getDay()]}
          </Text>
        </View>

        {/* 中部：天气图标 + 温度 + 天气描述 */}
        <View style={styles.heroSection}>
          <Text style={styles.weatherIcon}>{weatherIcon}</Text>
          <Text style={styles.temperature}>{todayTheme.temperature}°</Text>
          <Text style={styles.weatherDesc}>
            {todayTheme.weatherDescription} 体感 {todayTheme.temperature + 1}°
          </Text>
          <Text style={styles.location}>{todayTheme.city}</Text>
        </View>

        {/* 时间 */}
        <View style={styles.timeSection}>
          <Text style={styles.timeText}>
            {now.getHours()}:{String(now.getMinutes()).padStart(2, '0')}
          </Text>
        </View>

        {/* 底部文案 */}
        <View style={styles.quoteSection}>
          <Text style={styles.quoteText}>「{todayTheme.moodLabel}」</Text>
        </View>

        {/* 底部按钮区 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.shuffleBtn} onPress={() => shuffleTodayTheme()}>
            <Text style={styles.shuffleIcon}>🎲</Text>
            <Text style={styles.shuffleLabel}>换一换</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomAction}
            onPress={async () => {
              const { pickImage, addPhoto, setCurrentPhoto } = await import('../services/photoStorage');
              const file = await pickImage();
              if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                  if (e.target?.result) {
                    const dataUrl = e.target.result as string;
                    setPreviewUrl(dataUrl);
                    // 存入图库 + 设为当前壁纸
                    await setCurrentPhoto(dataUrl);
                    try { await addPhoto(file); } catch {}
                  }
                };
                reader.readAsDataURL(file);
              }
            }}
          >
            <Text style={styles.bottomActionIcon}>📤</Text>
            <Text style={styles.bottomActionLabel}>上传</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[ styles.aiBtn, !isPro && styles.aiBtnLocked ]}
            onPress={async () => {
              if (!isPro) return;
              if (!todayTheme) return;
              const url = getAIWallpaperUrl(todayTheme.weatherType);
              setPreviewUrl(url);
            }}
          >
            <Text style={styles.aiIcon}>{isPro ? '🤖' : '🔒'}</Text>
            <Text style={styles.aiLabel}>{isPro ? 'AI 生成' : 'Pro'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={async () => {
              if (!todayTheme || !previewUrl) return;
              const { generateShareCard, downloadShareCard } = await import('../services/shareCardService');
              const cardUrl = await generateShareCard(todayTheme, previewUrl);
              downloadShareCard(cardUrl);
            }}
          >
            <Text style={styles.downloadIcon}>📤</Text>
            <Text style={styles.downloadLabel}>分享</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} disabled={downloading}>
            <Text style={styles.downloadIcon}>⬇️</Text>
            <Text style={styles.downloadLabel}>{downloading ? '...' : '保存'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // 全屏壁纸
  bgImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
  },
  bgPlaceholder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },

  // 渐变遮罩
  topGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '25%',
  },
  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
  },

  // 内容层
  contentLayer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },

  // 顶部日期
  topBar: {
    alignItems: 'center',
    paddingTop: 8,
  },
  dateText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },

  // 中部天气英雄区
  heroSection: {
    alignItems: 'center',
    marginTop: -20,
  },
  weatherIcon: {
    fontSize: 72,
    marginBottom: 8,
  },
  temperature: {
    color: '#FFF',
    fontSize: 88,
    fontWeight: '200',
    letterSpacing: -4,
  },
  weatherDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    marginTop: 4,
  },
  location: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 6,
  },

  // 时间
  timeSection: {
    alignItems: 'center',
    marginTop: -10,
  },
  timeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 96,
    fontWeight: '100',
    letterSpacing: 2,
  },

  // 底部文案
  quoteSection: {
    alignItems: 'center',
    marginTop: -10,
    paddingHorizontal: 20,
  },
  quoteText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
  },

  // 底部按钮栏
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: 4,
  },
  shuffleBtn: {
    alignItems: 'center',
    gap: 4,
  },
  shuffleIcon: { fontSize: 22 },
  shuffleLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  bottomAction: {
    alignItems: 'center',
    gap: 4,
  },
  bottomActionIcon: { fontSize: 22 },
  bottomActionLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  aiBtn: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  aiBtnLocked: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(212,168,75,0.5)',
    borderWidth: 1,
  },
  aiIcon: { fontSize: 20 },
  aiLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
  },
  downloadBtn: {
    alignItems: 'center',
    gap: 4,
  },
  downloadIcon: { fontSize: 22 },
  downloadLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },

  // 加载状态
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: 'rgba(255,255,255,0.6)' },
});
