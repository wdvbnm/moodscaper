import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getCurrentLocation } from './locationService';
import { fetchWeather } from './weatherService';
import { generateDailyTheme } from './atmosphereEngine';
import { getWallpaperDownloadUrl } from './wallpaperGenerator';

const TASK_NAME = 'moodscaper-daily-wallpaper';
const PREFS_KEY = '@moodscaper_preferences';
const LAST_DATE_KEY = '@moodscaper_last_wallpaper_date';
const THEME_KEY = '@moodscaper_today_theme';
const MORNING_START_HOUR = 6;
const MORNING_END_HOUR = 10;
const MINIMUM_INTERVAL_MINUTES = 15;

// ===== 模块级 Task 定义（必须在全局作用域） =====
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    // 0. 早间守门：只在 6:00–10:00 之间执行
    const now = new Date();
    const hour = now.getHours();
    if (hour < MORNING_START_HOUR || hour >= MORNING_END_HOUR) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    // 今天已经执行过？幂等拦截
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);
    if (lastDate === todayKey) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    // 1. 加载用户偏好
    const prefsRaw = await AsyncStorage.getItem(PREFS_KEY);
    const prefs = prefsRaw ? JSON.parse(prefsRaw) : undefined;

    // 2. 流水线：定位 → 天气 → 主题
    const location = await getCurrentLocation();
    const weather = await fetchWeather(location);
    const theme = generateDailyTheme(weather, prefs);

    // 3. 缓存主题（App 下次打开直接显示今日天气）
    await AsyncStorage.setItem(THEME_KEY, JSON.stringify(theme));

    // 4. 获取壁纸下载 URL（Picsum CDN，不会失败）
    const seed = Math.floor(Math.random() * 500);
    const wallpaperUrl = getWallpaperDownloadUrl(weather.weatherType, seed);

    // 5. 设为壁纸（仅 Android）
    if (Platform.OS === 'android') {
      try {
        const { WallpaperSet } = require('react-native-nitro-wallpaper');
        await WallpaperSet.setWallpaper(wallpaperUrl, 'home');
      } catch (wallpaperError) {
        // 设壁纸失败不影响主题缓存，不视为任务失败
        console.warn('[BackgroundTask] setWallpaper failed:', wallpaperError);
      }
    }
    // iOS：主题已缓存，不需要额外操作（iOS 不能自动设壁纸）

    // 6. 记录今天已执行
    await AsyncStorage.setItem(LAST_DATE_KEY, todayKey);

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[BackgroundTask] failed:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// ===== 公开 API =====

export async function registerWallpaperTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (!isRegistered) {
    await BackgroundTask.registerTaskAsync(TASK_NAME, {
      minimumInterval: MINIMUM_INTERVAL_MINUTES,
    });
  }
}

export async function unregisterWallpaperTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (isRegistered) {
    await BackgroundTask.unregisterTaskAsync(TASK_NAME);
  }
}

export async function isWallpaperTaskRegistered(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(TASK_NAME);
}
