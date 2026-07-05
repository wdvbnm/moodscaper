import { WeatherType, ColorPalette } from '../types';

// ===== 莫兰迪配色系统 =====
// 低饱和度、高级灰调、柔和安静
// 设计原则：每种颜色都混入灰度，饱和度控制在 10%-30%

export const WEATHER_PALETTES: Record<WeatherType, ColorPalette> = {
  clear: {
    primary: '#C4A882',      // 暖灰琥珀
    secondary: '#D4C4A8',
    background: '#F5F0E8',   // 暖米色底
    surface: '#FDFAF5',
    text: '#5C4F3C',
    textSecondary: '#9B8C76',
    accent: '#B8956A',       // 淡金褐
    muted: '#ECE3D4',
  },
  'partly-cloudy': {
    primary: '#A3ACB8',      // 灰蓝
    secondary: '#C4CBD4',
    background: '#F2F3F5',
    surface: '#FAFBFB',
    text: '#4A5058',
    textSecondary: '#8B9199',
    accent: '#8996A3',
    muted: '#E4E7EB',
  },
  cloudy: {
    primary: '#AFA59D',      // 灰褐
    secondary: '#C9C1BA',
    background: '#F4F2F0',
    surface: '#FCFBFA',
    text: '#544F4A',
    textSecondary: '#938D86',
    accent: '#9D9389',
    muted: '#E7E3DE',
  },
  overcast: {
    primary: '#A8A3A0',      // 暖石灰
    secondary: '#C4C0BD',
    background: '#F3F2F1',
    surface: '#FBFBFA',
    text: '#535150',
    textSecondary: '#908D8B',
    accent: '#96918D',
    muted: '#E5E3E1',
  },
  rain: {
    primary: '#8C9A8E',      // 灰绿
    secondary: '#ADB9AF',
    background: '#F1F3F1',
    surface: '#F9FAF9',
    text: '#465048',
    textSecondary: '#808B82',
    accent: '#7A8C7C',
    muted: '#E2E7E3',
  },
  drizzle: {
    primary: '#98A39A',      // 淡灰绿
    secondary: '#B6BFB7',
    background: '#F3F5F3',
    surface: '#FAFBFA',
    text: '#4B534C',
    textSecondary: '#838B84',
    accent: '#8A968B',
    muted: '#E5E9E5',
  },
  thunderstorm: {
    primary: '#7A7682',      // 灰紫
    secondary: '#A19DA8',
    background: '#2A272E',   // 暗色底
    surface: '#343139',
    text: '#D5D2DB',
    textSecondary: '#A5A1AE',
    accent: '#8B8596',
    muted: '#3F3B45',
  },
  snow: {
    primary: '#BCC0C4',      // 冰灰
    secondary: '#D3D6D9',
    background: '#F7F8F9',
    surface: '#FDFDFD',
    text: '#5A5D61',
    textSecondary: '#95999D',
    accent: '#A3A8AD',
    muted: '#EBEDEF',
  },
  fog: {
    primary: '#B0A9B2',      // 雾紫灰
    secondary: '#CBC6CC',
    background: '#F5F4F6',
    surface: '#FCFBFC',
    text: '#554E58',
    textSecondary: '#938B97',
    accent: '#A29AA6',
    muted: '#EAE7EC',
  },
  haze: {
    primary: '#B7ADA0',      // 尘灰
    secondary: '#CFC7BC',
    background: '#F6F4F1',
    surface: '#FCFBF9',
    text: '#59534C',
    textSecondary: '#969087',
    accent: '#A89D90',
    muted: '#EBE6DF',
  },
  windy: {
    primary: '#9DABB5',      // 风灰蓝
    secondary: '#BFC9D1',
    background: '#F3F5F7',
    surface: '#FAFCFC',
    text: '#4B555D',
    textSecondary: '#88939C',
    accent: '#8C9BA7',
    muted: '#E3E8EC',
  },
};

// ===== 文艺诗意氛围文案 =====
// 每一句都是一帧画面，不说教，不直白，留有余味

export const WEATHER_MOOD_LABELS: Record<WeatherType, Record<string, string>> = {
  clear: {
    cozy: '阳光被窗帘筛成了细碎的金箔',
    energizing: '天蓝得刚好，风软得恰如其分',
    neutral: '光线从百叶窗的缝隙里漏进来',
  },
  'partly-cloudy': {
    cozy: '云走得慢，像是在等人',
    energizing: '云层后面藏着一整个下午的光',
    neutral: '有几片云飘过去，影子落下来又走开',
  },
  cloudy: {
    cozy: '天色温柔地暗下来，像有人替你盖了层薄毯',
    energizing: '云的缝隙里，光在试探性地探头',
    neutral: '云层铺满了天，像一张未着墨的宣纸',
  },
  overcast: {
    cozy: '天空把自己裹进了一条灰色的羊绒围巾里',
    energizing: '低垂的云正酝酿一场告白',
    neutral: '灰色的天幕下，一切喧嚣都变得很远',
  },
  rain: {
    cozy: '雨滴在玻璃上画下细细的水痕，屋里灯是暖的',
    energizing: '雨水把整座城市洗得很新，像刚拆封',
    neutral: '窗外有雨声，屋里有时光缓慢流淌的声音',
  },
  drizzle: {
    cozy: '细密的雨丝像一层薄纱，罩住了整个世界',
    energizing: '薄雨里空气变得清澈，每一次呼吸都很轻',
    neutral: '毛毛雨落在叶子上，发出沙沙的絮语',
  },
  thunderstorm: {
    cozy: '雷声在远处滚动，被窝是世界上最安全的地方',
    energizing: '闪电劈开夜空的一瞬，世界变得黑白分明',
    neutral: '暴雨将至未至，空气里满是期待的潮湿',
  },
  snow: {
    cozy: '雪落无声，窗内窗外是两个同样温柔的世界',
    energizing: '第一片雪花落在睫毛上，整个冬天就开始了',
    neutral: '万物都在下雪的声音里安静了下来',
  },
  fog: {
    cozy: '浓雾把世界变成了一个柔软的茧',
    energizing: '穿过雾区的路上，一切都变得像电影画面',
    neutral: '远处的楼宇隐没在白色里，像未完成的素描',
  },
  haze: {
    cozy: '朦胧之中，光线变得像旧照片一样温柔',
    energizing: '薄霭之后，太阳正一寸一寸地走近',
    neutral: '天空蒙上了一层淡淡的滤镜',
  },
  windy: {
    cozy: '风在外面敲窗，屋里是另一个季节',
    energizing: '风从很远的地方赶来，带着你不认识的气息',
    neutral: '风吹过树梢，叶子翻出了银色的背面',
  },
};

// ===== 根据色温偏好微调配色（莫兰迪版本） =====
export function adjustPaletteForColorTemp(
  palette: ColorPalette,
  colorTemp: 'warm' | 'neutral' | 'cool'
): ColorPalette {
  if (colorTemp === 'neutral') return palette;

  const factor = colorTemp === 'cool' ? 1 : 0;

  // 莫兰迪风格下的色温偏移 — 要让用户肉眼可见变化
  // warm：往暖褐方向偏，cool：往冷蓝灰方向偏
  const shiftColor = (hex: string, factor: number): string => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    if (factor > 0) {
      // cool：加蓝减红
      r = Math.round(r * 0.90);
      g = Math.round(g * 0.97);
      b = Math.round(Math.min(255, b * 1.08));
    } else {
      // warm：加红减蓝
      r = Math.round(Math.min(255, r * 1.08));
      g = Math.round(g * 0.97);
      b = Math.round(b * 0.90);
    }

    return `#${Math.min(255, r).toString(16).padStart(2, '0')}${Math.min(255, g).toString(16).padStart(2, '0')}${Math.min(255, b).toString(16).padStart(2, '0')}`;
  };

  return {
    ...palette,
    primary: shiftColor(palette.primary, factor),
    secondary: shiftColor(palette.secondary, factor),
    accent: shiftColor(palette.accent, factor),
    background: shiftColor(palette.background, factor),
    muted: shiftColor(palette.muted, factor),
  };
}

// ===== 壁纸渐变配置 =====
export function generateWallpaperConfig(
  weatherType: WeatherType,
  style: string,
  density: string
): {
  gradientColors: string[];
  gradientAngle: number;
  texture: string;
} {
  const palette = WEATHER_PALETTES[weatherType];

  // 莫兰迪风格的渐变：从浅到深，层次丰富但不刺眼
  const baseGradients: Record<WeatherType, string[]> = {
    clear: [palette.background, palette.muted, palette.secondary + '88'],
    'partly-cloudy': [palette.background, palette.muted, palette.secondary + '66'],
    cloudy: [palette.muted, palette.background, palette.secondary + '44'],
    overcast: [palette.muted, palette.background, palette.primary + '33'],
    rain: [palette.muted, palette.background, palette.primary + '44'],
    drizzle: [palette.muted, palette.background, palette.secondary + '55'],
    thunderstorm: [palette.background, palette.muted, palette.primary + '55'],
    snow: [palette.muted, palette.background, palette.secondary + '33'],
    fog: [palette.muted, palette.background, palette.secondary + '44'],
    haze: [palette.muted, palette.background, palette.secondary + '44'],
    windy: [palette.background, palette.muted, palette.secondary + '55'],
  };

  const textures: Record<string, string> = {
    nature: 'grain',
    urban: 'paper',
    abstract: 'watercolor',
    illustration: 'none',
  };

  return {
    gradientColors: baseGradients[weatherType] || baseGradients.clear,
    gradientAngle: weatherType === 'rain' ? 160 : weatherType === 'windy' ? 110 : 195,
    texture: textures[style] || 'watercolor',
  };
}
