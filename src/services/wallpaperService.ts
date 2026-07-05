import { Alert, Platform } from 'react-native';
import { DailyTheme } from '../types';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export async function saveWallpaperToGallery(theme: DailyTheme): Promise<boolean> {
  // Web 端：直接弹提示
  if (Platform.OS === 'web') {
    Alert.alert(
      '📱 设置壁纸',
      `今日氛围：「${theme.moodLabel}」\n\n在手机上打开 MoodScaper 即可将壁纸保存到相册。\n\n现在可以截屏保存当前页面作为壁纸。`,
      [{ text: '知道了', style: 'default' }]
    );
    return true;
  }

  try {
    // 原生端：请求相册权限
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要相册权限', '请在系统设置中允许 MoodScaper 访问相册。');
      return false;
    }

    Alert.alert(
      '📱 设置壁纸',
      `今日氛围：「${theme.moodLabel}」\n\n将当前页面上的壁纸预览区域截屏，然后在相册中裁剪并设置为壁纸。\n\n（后续版本将支持一键生成壁纸图片）`,
      [{ text: '知道了', style: 'default' }]
    );

    return true;
  } catch (error) {
    console.error('保存壁纸失败:', error);
    Alert.alert('操作失败', '请稍后重试');
    return false;
  }
}

// 分享今日主题卡片
export async function shareThemeCard(theme: DailyTheme): Promise<void> {
  // Web 端：使用浏览器原生分享
  if (Platform.OS === 'web') {
    const shareText = [
      `🌤️ MoodScaper · 今日氛围`,
      `"${theme.moodLabel}"`,
      `${theme.temperature}°C · ${theme.weatherDescription} · ${theme.city}`,
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MoodScaper · 今日氛围',
          text: shareText,
        });
      } catch {}
    } else {
      // 回退：复制到剪贴板
      try {
        await navigator.clipboard.writeText(shareText);
        Alert.alert('已复制', '今日氛围卡片文字已复制到剪贴板');
      } catch {}
    }
    return;
  }

  try {
    if (await Sharing.isAvailableAsync()) {
      const shareText = [
        `🌤️ MoodScaper · 今日氛围`,
        `"${theme.moodLabel}"`,
        ``,
        `${theme.temperature}°C · ${theme.weatherDescription} · ${theme.city}`,
        `主色调：${theme.palette.primary}`,
      ].join('\n');

      await Sharing.shareAsync('', {
        mimeType: 'text/plain',
        dialogTitle: '分享今日氛围',
        UTI: 'public.plain-text',
      });
    }
  } catch (error) {
    console.error('分享失败:', error);
  }
}

export function getThemeAccentColor(theme: DailyTheme): string {
  return theme.palette.accent;
}
