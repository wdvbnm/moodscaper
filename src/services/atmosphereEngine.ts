import { WeatherData, UserPreferences, DailyTheme, DEFAULT_PREFERENCES } from '../types';
import {
  WEATHER_PALETTES,
  WEATHER_MOOD_LABELS,
  adjustPaletteForColorTemp,
  generateWallpaperConfig,
} from '../constants/weatherThemes';

// 氛围引擎 —— 整个 App 的心脏
// 输入：天气数据 + 用户偏好
// 输出：今日主题（配色 + 壁纸配置 + 氛围文案 + Widget 样式）

export function generateDailyTheme(
  weather: WeatherData,
  preferences: UserPreferences = DEFAULT_PREFERENCES
): DailyTheme {
  const { weatherType, temperature, description, city } = weather;

  // 1. 获取天气基础配色
  const basePalette = WEATHER_PALETTES[weatherType];

  // 2. 根据用户色温偏好微调配色
  const palette = adjustPaletteForColorTemp(basePalette, preferences.colorTemp);

  // 3. 根据用户的天气-情绪映射，选择氛围文案（Pro 用户可用自定义）
  const customMood = preferences.customMoods?.[weatherType];
  const mood = preferences.weatherMoodMap[weatherType] || 'neutral';
  const moodLabel =
    (customMood && customMood.trim()) ||
    WEATHER_MOOD_LABELS[weatherType]?.[mood] ||
    WEATHER_MOOD_LABELS[weatherType]?.neutral ||
    '今天也是独特的一天';

  // 4. 生成壁纸配置
  const wallpaper = generateWallpaperConfig(
    weatherType,
    preferences.style,
    preferences.visualDensity
  );

  // 5. Widget 样式根据天气类型和视觉密度
  const widgetStyle = {
    cornerRadius: preferences.visualDensity === 'minimal' ? 12 : preferences.visualDensity === 'rich' ? 24 : 18,
    opacity: preferences.visualDensity === 'minimal' ? 0.85 : preferences.visualDensity === 'rich' ? 0.98 : 0.92,
    blur: fogOrRain(weatherType) ? 12 : 0,
    fontSize: preferences.visualDensity === 'rich' ? 'large' as const : 'medium' as const,
  };

  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return {
    id: `${date}-${weatherType}`,
    date,
    weatherType,
    palette,
    widgetStyle,
    wallpaper: {
      gradientColors: wallpaper.gradientColors,
      gradientAngle: wallpaper.gradientAngle,
      overlayElements: [],
      texture: wallpaper.texture as 'none' | 'grain' | 'paper' | 'watercolor',
    },
    moodLabel,
    weatherDescription: description,
    temperature,
    city,
  };
}

function fogOrRain(weatherType: string): boolean {
  return ['rain', 'drizzle', 'fog', 'thunderstorm'].includes(weatherType);
}
