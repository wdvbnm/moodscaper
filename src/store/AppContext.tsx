import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences, DailyTheme, WeatherMood, ThemeHistoryEntry, DEFAULT_PREFERENCES } from '../types';
import { getCurrentLocation } from '../services/locationService';
import { fetchWeather } from '../services/weatherService';
import { generateDailyTheme } from '../services/atmosphereEngine';

const PREFS_KEY = '@moodscaper_preferences';
const THEME_KEY = '@moodscaper_today_theme';

interface AppContextType {
  preferences: UserPreferences;
  todayTheme: DailyTheme | null;
  wallpaperSeed: number;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (partial: Partial<UserPreferences>) => Promise<void>;
  refreshTodayTheme: () => Promise<void>;
  shuffleTodayTheme: () => Promise<void>;
  setTodayTheme: (theme: DailyTheme) => void;
  themeHistory: ThemeHistoryEntry[];
  restoreHistoryTheme: (entry: ThemeHistoryEntry) => void;
  currentWallpaperUrl: string;
  setCurrentWallpaperUrl: (url: string) => void;
}

const AppContext = createContext<AppContextType>({
  preferences: DEFAULT_PREFERENCES,
  todayTheme: null,
  wallpaperSeed: 0,
  isLoading: true,
  error: null,
  updatePreferences: async () => {},
  refreshTodayTheme: async () => {},
  shuffleTodayTheme: async () => {},
  setTodayTheme: () => {},
  themeHistory: [],
  restoreHistoryTheme: () => {},
  currentWallpaperUrl: '',
  setCurrentWallpaperUrl: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [todayTheme, setTodayTheme] = useState<DailyTheme | null>(null);
  const [wallpaperSeed, setWallpaperSeed] = useState(Math.floor(Math.random() * 500));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeHistory, setThemeHistory] = useState<ThemeHistoryEntry[]>([]);
  const [currentWallpaperUrl, setCurrentWallpaperUrl] = useState('');

  // 加载历史
  useEffect(() => {
    AsyncStorage.getItem('@moodscaper_theme_history').then((raw) => {
      if (raw) {
        try {
          const arr = JSON.parse(raw);
          setThemeHistory(Array.isArray(arr) ? arr.slice(0, 7) : []);
        } catch {}
      }
    });
  }, []);

  // 保存主题到历史
  const saveToHistory = async (theme: DailyTheme, wallpaperUrl: string) => {
    const entry: ThemeHistoryEntry = { date: theme.date, theme, wallpaperUrl };
    setThemeHistory((prev) => {
      const filtered = prev.filter((e) => e.date !== entry.date);
      const updated = [entry, ...filtered].slice(0, 7);
      AsyncStorage.setItem('@moodscaper_theme_history', JSON.stringify(updated));
      return updated;
    });
  };

  // 恢复历史主题
  const restoreHistoryTheme = (entry: ThemeHistoryEntry) => {
    setTodayTheme(entry.theme);
    setCurrentWallpaperUrl(entry.wallpaperUrl);
    AsyncStorage.setItem(THEME_KEY, JSON.stringify(entry.theme));
  };

  // 启动时加载偏好和今日主题
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 加载用户偏好
      const storedPrefs = await AsyncStorage.getItem(PREFS_KEY);
      let userPrefs: UserPreferences;
      if (storedPrefs) {
        userPrefs = { ...DEFAULT_PREFERENCES, ...JSON.parse(storedPrefs) };
      } else {
        userPrefs = DEFAULT_PREFERENCES;
      }
      setPreferences(userPrefs);

      // 检查今日是否已有主题
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const storedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (storedTheme) {
        const theme: DailyTheme = JSON.parse(storedTheme);
        if (theme.date === dateKey) {
          // 今天的主题已生成过，直接用
          setTodayTheme(theme);
          setIsLoading(false);
          return;
        }
      }

      // 生成新主题
      await refreshTodayThemeInternal(userPrefs);
    } catch (e: any) {
      setError(e.message || '加载失败');
      setIsLoading(false);
    }
  };

  const refreshTodayThemeInternal = async (userPrefs?: UserPreferences) => {
    try {
      const prefs = userPrefs || preferences;

      // 获取定位
      const location = await getCurrentLocation();

      // 获取天气
      const weather = await fetchWeather(location);

      // 生成主题
      const theme = generateDailyTheme(weather, prefs);

      // 保存
      await AsyncStorage.setItem(THEME_KEY, JSON.stringify(theme));
      setTodayTheme(theme);
      setError(null);
    } catch (e: any) {
      setError(e.message || '刷新失败');
      // 尝试用默认天气数据生成兜底主题
      try {
        const fallbackWeather = {
          weatherType: 'partly-cloudy' as const,
          temperature: 22,
          humidity: 55,
          description: '多云',
          city: '你的城市',
          season: 'spring' as const,
          sunrise: 0,
          sunset: 0,
        };
        const prefs = userPrefs || preferences;
        const theme = generateDailyTheme(fallbackWeather, prefs);
        setTodayTheme(theme);
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTodayTheme = useCallback(async () => {
    setIsLoading(true);
    await refreshTodayThemeInternal();
  }, [preferences]);

  // 换一换：循环切换色温+心情+壁纸图片
  const shuffleTodayTheme = useCallback(async () => {
    if (!todayTheme) return;

    const moodCycle: WeatherMood[] = ['cozy', 'neutral', 'energizing'];
    const tempCycle = ['warm', 'neutral', 'cool'] as const;

    const currentMood = preferences.weatherMoodMap[todayTheme.weatherType] || 'neutral';
    const moodIndex = moodCycle.indexOf(currentMood);
    const nextMood = moodCycle[(moodIndex + 1) % moodCycle.length];

    const tempIndex = tempCycle.indexOf(preferences.colorTemp);
    const nextTemp = tempCycle[(tempIndex + 1) % tempCycle.length];

    const newMap = { ...preferences.weatherMoodMap, [todayTheme.weatherType]: nextMood };
    const updated = { ...preferences, weatherMoodMap: newMap, colorTemp: nextTemp };
    setPreferences(updated);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));

    const weather = {
      weatherType: todayTheme.weatherType,
      temperature: todayTheme.temperature,
      humidity: 55,
      description: todayTheme.weatherDescription,
      city: todayTheme.city,
      season: 'summer' as const,
      sunrise: 0,
      sunset: 0,
    };
    const theme = generateDailyTheme(weather, updated);
    setTodayTheme(theme);
    await AsyncStorage.setItem(THEME_KEY, JSON.stringify(theme));

    // 换一张新壁纸图片
    setWallpaperSeed((s) => (s + 1) % 500);
  }, [todayTheme, preferences]);

  const updatePreferences = useCallback(async (partial: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...partial };
    setPreferences(updated);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    // 偏好更新后立即重新生成今日主题
    await refreshTodayThemeInternal(updated);
  }, [preferences]);

  return (
    <AppContext.Provider
      value={{
        preferences,
        todayTheme,
        wallpaperSeed,
        isLoading,
        error,
        updatePreferences,
        refreshTodayTheme,
        shuffleTodayTheme,
        setTodayTheme,
        themeHistory,
        restoreHistoryTheme,
        currentWallpaperUrl,
        setCurrentWallpaperUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
