// ===== 天气相关 =====
export type WeatherType =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'overcast'
  | 'rain'
  | 'drizzle'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'haze'
  | 'windy';

export interface WeatherData {
  weatherType: WeatherType;
  temperature: number;       // 摄氏度
  humidity: number;          // 0-100
  description: string;       // 天气描述，如"小雨转阴"
  city: string;
  season: Season;
  sunrise: number;           // Unix timestamp
  sunset: number;            // Unix timestamp
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// ===== 用户偏好 =====
export type ColorTemp = 'warm' | 'neutral' | 'cool';
export type VisualDensity = 'minimal' | 'balanced' | 'rich';
export type WeatherMood = 'cozy' | 'energizing' | 'neutral';
export type StylePreference = 'nature' | 'urban' | 'abstract' | 'illustration';
export type ThemeMode = 'system' | 'dark' | 'light';

export interface UserPreferences {
  colorTemp: ColorTemp;
  visualDensity: VisualDensity;
  weatherMoodMap: Record<WeatherType, WeatherMood>;
  style: StylePreference;
  themeMode: ThemeMode;
  completedOnboarding: boolean;
  customMoods: Record<WeatherType, string>;  // Pro 用户自写文案
  autoWallpaperEnabled: boolean;
}

export interface ThemeHistoryEntry {
  date: string;
  theme: DailyTheme;
  wallpaperUrl: string;  // 当时的壁纸 URL
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  colorTemp: 'neutral',
  visualDensity: 'balanced',
  weatherMoodMap: {
    clear: 'energizing',
    'partly-cloudy': 'neutral',
    cloudy: 'cozy',
    overcast: 'cozy',
    rain: 'cozy',
    drizzle: 'cozy',
    thunderstorm: 'cozy',
    snow: 'cozy',
    fog: 'neutral',
    haze: 'neutral',
    windy: 'energizing',
  },
  style: 'abstract',
  themeMode: 'system',
  customMoods: {
    clear: '',
    'partly-cloudy': '',
    cloudy: '',
    overcast: '',
    rain: '',
    drizzle: '',
    thunderstorm: '',
    snow: '',
    fog: '',
    haze: '',
    windy: '',
  },
  completedOnboarding: false,
  autoWallpaperEnabled: false,
};

// ===== 主题 =====
export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  muted: string;
}

export interface WidgetStyle {
  cornerRadius: number;
  opacity: number;
  blur: number;
  fontSize: 'small' | 'medium' | 'large';
}

export interface WallpaperConfig {
  gradientColors: string[];
  gradientAngle: number;
  overlayElements: OverlayElement[];
  texture: 'none' | 'grain' | 'paper' | 'watercolor';
}

export interface OverlayElement {
  type: 'circle' | 'line' | 'dot-grid' | 'wave';
  color: string;
  opacity: number;
  size: number;
  position: { x: number; y: number };
}

export interface DailyTheme {
  id: string;
  date: string;            // YYYY-MM-DD
  weatherType: WeatherType;
  palette: ColorPalette;
  widgetStyle: WidgetStyle;
  wallpaper: WallpaperConfig;
  moodLabel: string;       // 一句话氛围描述，如"雨后森林的湿润空气"
  weatherDescription: string;
  temperature: number;
  city: string;
}

// ===== 引导页 =====
export type OnboardingStep = 'welcome' | 'color-temp' | 'weather-mood' | 'style' | 'done';
