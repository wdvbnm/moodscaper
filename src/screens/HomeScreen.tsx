import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image as RNImage, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../store/AppContext';
import { useMembership } from '../store/MembershipContext';
import { getWallpaperPreviewUrl, getAIWallpaperUrl } from '../services/wallpaperGenerator';
import { extractColorsFromImage } from '../services/colorExtractor';
import { getCurrentPhoto, setCurrentPhoto, pickImage, addPhoto } from '../services/photoStorage';
import { shareThemeText } from '../services/shareCardService';
import { WallpaperSet } from 'react-native-nitro-wallpaper';
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
  const [downloadUrl, setDownloadUrl] = useState('');
  const [imgError, setImgError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!todayTheme) return;
    let cancelled = false;
    setImgError(false);

    getCurrentPhoto().then((customUrl) => {
      if (cancelled) return;
      if (customUrl) {
        setPreviewUrl(customUrl);
        extractColorsFromImage(customUrl).then((colors) => {
          if (!cancelled && colors) setUiPalette(colors);
        }).catch(() => {});
        return;
      }
      getWallpaperPreviewUrl(todayTheme.weatherType, wallpaperSeed)
        .then(({ primary, enhanced, downloadUrl: dlUrl }) => {
          if (cancelled) return;
          // 立即显示 Picsum 小尺寸壁纸
          setPreviewUrl(primary);
          setDownloadUrl(dlUrl);
          extractColorsFromImage(primary).then((colors) => {
            if (!cancelled && colors) setUiPalette(colors);
          }).catch(() => {});
          // 后台尝试 Unsplash 替换
          enhanced.then((unsplashUrl) => {
            if (!cancelled && unsplashUrl) {
              setPreviewUrl(unsplashUrl);
            }
          });
        })
        .catch(() => { if (!cancelled) setImgError(true); });
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
    // 保存用大图，预览用小图
    const saveUrl = downloadUrl || previewUrl;
    if (!saveUrl) return;
    setDownloading(true);
    try {
      if (Platform.OS === 'web') {
        // Web 端：Canvas 绘制壁纸图片并下载
        const img = document.createElement('img') as HTMLImageElement;
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = saveUrl;
        });

        const canvas = document.createElement('canvas');
        const W = 1290, H = 2796;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d')!;

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

        const v = ctx.createRadialGradient(W/2, H/2, H*0.35, W/2, H/2, H*0.8);
        v.addColorStop(0, 'transparent');
        v.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, W, H);

        const b = ctx.createLinearGradient(0, H*0.68, 0, H);
        b.addColorStop(0, 'transparent');
        b.addColorStop(1, 'rgba(0,0,0,0.3)');
        ctx.fillStyle = b;
        ctx.fillRect(0, H*0.68, W, H*0.32);

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
        const link = document.createElement('a');
        link.download = `moodscaper-${todayTheme.date}-${todayTheme.weatherType}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        // 原生端：用 FileSystem 下载并保存到相册
        const FileSystem = require('expo-file-system');
        const MediaLibrary = require('expo-media-library');
        const Sharing = require('expo-sharing');

        const filename = `moodscaper-${todayTheme.date}-${todayTheme.weatherType}.jpg`;
        const fileUri = FileSystem.cacheDirectory + filename;
        const { uri } = await FileSystem.downloadAsync(saveUrl, fileUri);

        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('已保存', '壁纸已保存到相册');
        } else if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('提示', '请在设置中允许相册权限');
        }
      }
    } catch (e: any) {
      Alert.alert('下载失败', e.message || '请稍后重试');
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async () => {
    const file = await pickImage();
    if (file && Platform.OS === 'web') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const dataUrl = e.target.result as string;
          setPreviewUrl(dataUrl);
          await setCurrentPhoto(dataUrl);
          try { await addPhoto(file); } catch {}
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShare = async () => {
    if (!todayTheme) return;
    if (Platform.OS === 'web') {
      try {
        const { generateShareCard, downloadShareCard } = await import('../services/shareCardService');
        const cardUrl = await generateShareCard(todayTheme, previewUrl);
        if (cardUrl) downloadShareCard(cardUrl);
      } catch {}
    } else {
      shareThemeText(todayTheme);
    }
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.contentLayer}>
        <View style={styles.topBar}>
          <Text style={styles.dateText}>
            {now.getMonth() + 1}月{now.getDate()}日 星期{weekDays[now.getDay()]}
          </Text>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.weatherIcon}>{weatherIcon}</Text>
          <Text style={styles.temperature}>{todayTheme.temperature}°</Text>
          <Text style={styles.weatherDesc}>
            {todayTheme.weatherDescription} 体感 {todayTheme.temperature + 1}°
          </Text>
          <Text style={styles.location}>{todayTheme.city}</Text>
        </View>

        <View style={styles.timeSection}>
          <Text style={styles.timeText}>
            {now.getHours()}:{String(now.getMinutes()).padStart(2, '0')}
          </Text>
        </View>

        <View style={styles.quoteSection}>
          <Text style={styles.quoteText}>「{todayTheme.moodLabel}」</Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.shuffleBtn} onPress={() => shuffleTodayTheme()}>
            <Text style={styles.shuffleIcon}>🎲</Text>
            <Text style={styles.shuffleLabel}>换一换</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomAction} onPress={handleUpload}>
            <Text style={styles.bottomActionIcon}>📤</Text>
            <Text style={styles.bottomActionLabel}>上传</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.aiBtn, !isPro && styles.aiBtnLocked]}
            onPress={() => {
              if (!isPro || !todayTheme) return;
              const url = getAIWallpaperUrl(todayTheme.weatherType);
              setPreviewUrl(url);
            }}
          >
            <Text style={styles.aiIcon}>{isPro ? '🤖' : '🔒'}</Text>
            <Text style={styles.aiLabel}>{isPro ? 'AI 生成' : 'Pro'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.downloadBtn} onPress={handleShare}>
            <Text style={styles.downloadIcon}>📤</Text>
            <Text style={styles.downloadLabel}>分享</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} disabled={downloading}>
            <Text style={styles.downloadIcon}>⬇️</Text>
            <Text style={styles.downloadLabel}>{downloading ? '...' : '保存'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.wallpaperBtn}
            onPress={async () => {
              const saveUrl = downloadUrl || previewUrl;
              if (!saveUrl) return;
              setDownloading(true);
              try {
                if (Platform.OS === 'android') {
                  // Android：直接用原生 API 全自动设置壁纸
                  await WallpaperSet.setWallpaper(saveUrl, 'home');
                  Alert.alert('已设置', '桌面壁纸已更新');
                } else {
                  // iOS：保存到相册 + 引导
                  const FileSystem = require('expo-file-system');
                  const MediaLibrary = require('expo-media-library');
                  const filename = 'moodscaper_wallpaper.jpg';
                  const fileUri = FileSystem.cacheDirectory + filename;
                  const { uri } = await FileSystem.downloadAsync(saveUrl, fileUri);
                  const { status } = await MediaLibrary.requestPermissionsAsync();
                  if (status === 'granted') {
                    await MediaLibrary.saveToLibraryAsync(uri);
                    Alert.alert(
                      '已保存到相册',
                      '壁纸已存入相册。\n\n设为桌面壁纸：\n打开「设置」→「壁纸」→ 从相册选择这张图。',
                      [{ text: '知道了' }]
                    );
                  } else {
                    Alert.alert('需要相册权限', '请在系统设置中允许 MoodScaper 访问相册。');
                  }
                }
              } catch (e: any) {
                Alert.alert('失败', e.message || '请稍后重试');
              } finally {
                setDownloading(false);
              }
            }}
          >
            <Text style={styles.wallpaperIcon}>🖼️</Text>
            <Text style={styles.wallpaperLabel}>设壁纸</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bgImage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },
  bgPlaceholder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  topGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '25%',
  },
  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
  },
  contentLayer: {
    flex: 1, justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24,
  },
  topBar: { alignItems: 'center', paddingTop: 8 },
  dateText: {
    color: 'rgba(255,255,255,0.85)', fontSize: 14,
    fontWeight: '500', letterSpacing: 1,
  },
  heroSection: { alignItems: 'center', marginTop: -20 },
  weatherIcon: { fontSize: 72, marginBottom: 8 },
  temperature: {
    color: '#FFF', fontSize: 88, fontWeight: '200', letterSpacing: -4,
  },
  weatherDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 4 },
  location: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 6 },
  timeSection: { alignItems: 'center', marginTop: -10 },
  timeText: {
    color: 'rgba(255,255,255,0.9)', fontSize: 96,
    fontWeight: '100', letterSpacing: 2,
  },
  quoteSection: { alignItems: 'center', marginTop: -10, paddingHorizontal: 20 },
  quoteText: {
    color: 'rgba(255,255,255,0.8)', fontSize: 16,
    fontWeight: '400', textAlign: 'center', lineHeight: 24,
  },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-evenly',
    alignItems: 'center', paddingBottom: 4,
  },
  shuffleBtn: { alignItems: 'center', gap: 4 },
  shuffleIcon: { fontSize: 22 },
  shuffleLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },
  bottomAction: { alignItems: 'center', gap: 4 },
  bottomActionIcon: { fontSize: 22 },
  bottomActionLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },
  aiBtn: {
    alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
  },
  aiBtnLocked: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(212,168,75,0.5)', borderWidth: 1,
  },
  aiIcon: { fontSize: 20 },
  aiLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600' },
  downloadBtn: { alignItems: 'center', gap: 4 },
  downloadIcon: { fontSize: 22 },
  downloadLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },
  wallpaperBtn: { alignItems: 'center', gap: 4 },
  wallpaperIcon: { fontSize: 22 },
  wallpaperLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: 'rgba(255,255,255,0.6)' },
});
