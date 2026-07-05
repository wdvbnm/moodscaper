import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useAppContext } from '../store/AppContext';
import {
  ColorTemp,
  VisualDensity,
  WeatherMood,
  StylePreference,
  ThemeMode,
  WeatherType,
} from '../types';

const { width, height } = Dimensions.get('window');

type Step = 'welcome' | 'colorTemp' | 'weatherMood' | 'style' | 'done';

const STEPS: Step[] = ['welcome', 'colorTemp', 'weatherMood', 'style', 'done'];

export default function OnboardingScreen() {
  const { updatePreferences } = useAppContext();
  const [stepIndex, setStepIndex] = useState(0);
  const [colorTemp, setColorTemp] = useState<ColorTemp>('neutral');
  const [weatherMood, setWeatherMood] = useState<WeatherMood>('neutral');
  const [style, setStyle] = useState<StylePreference>('abstract');

  const currentStep = STEPS[stepIndex];

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const finishOnboarding = async () => {
    // 为所有天气类型设置相同的 mood 偏好
    const weatherMoodMap: Record<WeatherType, WeatherMood> = {
      clear: weatherMood === 'cozy' ? 'energizing' : weatherMood,
      'partly-cloudy': weatherMood,
      cloudy: weatherMood === 'energizing' ? 'neutral' : weatherMood,
      overcast: weatherMood,
      rain: weatherMood,
      drizzle: weatherMood,
      thunderstorm: weatherMood === 'energizing' ? 'cozy' : weatherMood,
      snow: weatherMood,
      fog: weatherMood,
      haze: weatherMood,
      windy: weatherMood === 'cozy' ? 'energizing' : weatherMood,
    };

    await updatePreferences({
      colorTemp,
      weatherMoodMap,
      style,
      visualDensity: 'balanced' as VisualDensity,
      themeMode: 'system' as ThemeMode,
      completedOnboarding: true,
    });
  };

  // 进度条
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <View style={styles.container}>
      {/* 进度条 */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* 步骤指示器 */}
      <View style={styles.stepIndicator}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === stepIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      {/* 内容区域 */}
      <View style={styles.content}>
        {currentStep === 'welcome' && (
          <WelcomeStep onNext={goNext} />
        )}

        {currentStep === 'colorTemp' && (
          <ColorTempStep
            selected={colorTemp}
            onSelect={(v) => {
              setColorTemp(v);
              setTimeout(goNext, 400);
            }}
          />
        )}

        {currentStep === 'weatherMood' && (
          <WeatherMoodStep
            selected={weatherMood}
            onSelect={(v) => {
              setWeatherMood(v);
              setTimeout(goNext, 400);
            }}
          />
        )}

        {currentStep === 'style' && (
          <StyleStep
            selected={style}
            onSelect={(v) => {
              setStyle(v);
              setTimeout(goNext, 400);
            }}
          />
        )}

        {currentStep === 'done' && (
          <DoneStep onFinish={finishOnboarding} />
        )}
      </View>

      {/* 底部按钮 */}
      {currentStep !== 'done' && (
        <View style={styles.bottom}>
          {stepIndex > 0 ? (
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Text style={styles.backText}>上一步</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <View style={styles.pageIndicator}>
            <Text style={styles.pageText}>
              {stepIndex + 1} / {STEPS.length}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ===== Step 1: 欢迎 =====
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.emoji}>🌤️</Text>
      <Text style={styles.title}>让手机感受{'\n'}今天的气息</Text>
      <Text style={styles.subtitle}>
        根据你所在城市的天气，每天为你生成独一无二的手机主题。
        先来花 30 秒告诉我们你的偏好吧。
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>开始</Text>
      </TouchableOpacity>
    </View>
  );
}

// ===== Step 2: 色温偏好 =====
function ColorTempStep({
  selected,
  onSelect,
}: {
  selected: ColorTemp;
  onSelect: (v: ColorTemp) => void;
}) {
  const options: { value: ColorTemp; label: string; desc: string; preview: string }[] = [
    { value: 'warm', label: '暖色调', desc: '偏向橙红、金黄', preview: '🔥' },
    { value: 'neutral', label: '中性调', desc: '保持自然的色彩', preview: '🌿' },
    { value: 'cool', label: '冷色调', desc: '偏向蓝紫、清冷', preview: '❄️' },
  ];

  return (
    <View style={styles.stepContent}>
      <Text style={styles.question}>你更喜欢哪种{'\n'}色彩感觉？</Text>
      <View style={styles.optionsGrid}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionCard,
              selected === opt.value && styles.optionCardSelected,
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={styles.optionEmoji}>{opt.preview}</Text>
            <Text style={styles.optionLabel}>{opt.label}</Text>
            <Text style={styles.optionDesc}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ===== Step 3: 天气情绪映射 =====
function WeatherMoodStep({
  selected,
  onSelect,
}: {
  selected: WeatherMood;
  onSelect: (v: WeatherMood) => void;
}) {
  const options: { value: WeatherMood; label: string; desc: string }[] = [
    { value: 'cozy', label: '舒服治愈', desc: '下雨天就该窝着看剧' },
    { value: 'energizing', label: '提神活力', desc: '天气影响不了我的状态' },
    { value: 'neutral', label: '顺其自然', desc: '什么样的天气都好' },
  ];

  return (
    <View style={styles.stepContent}>
      <Text style={styles.question}>下雨天，你通常{'\n'}是什么心情？</Text>
      <Text style={styles.hint}>这会影响雨天主题是偏暖治愈还是偏明亮提神</Text>
      <View style={styles.verticalOptions}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.verticalCard,
              selected === opt.value && styles.verticalCardSelected,
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={styles.verticalLabel}>{opt.label}</Text>
            <Text style={styles.verticalDesc}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ===== Step 4: 风格偏好 =====
const STYLE_OPTIONS: { value: StylePreference; label: string; emoji: string }[] = [
  { value: 'nature', label: '自然风景', emoji: '🏔️' },
  { value: 'urban', label: '都市质感', emoji: '🌃' },
  { value: 'abstract', label: '抽象渐变', emoji: '🎨' },
  { value: 'illustration', label: '手绘插画', emoji: '✏️' },
];

function StyleStep({
  selected,
  onSelect,
}: {
  selected: StylePreference;
  onSelect: (v: StylePreference) => void;
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.question}>你偏好哪种{'\n'}视觉风格？</Text>
      <View style={styles.styleGrid}>
        {STYLE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.styleCard,
              selected === opt.value && styles.styleCardSelected,
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={styles.styleEmoji}>{opt.emoji}</Text>
            <Text style={styles.styleLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ===== Step 5: 完成 =====
function DoneStep({ onFinish }: { onFinish: () => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.emoji}>✨</Text>
      <Text style={styles.title}>一切就绪！</Text>
      <Text style={styles.subtitle}>
        现在我们会根据你所在城市的天气{'\n'}
        每天为你生成独一无二的手机主题
      </Text>
      <TouchableOpacity style={styles.finishBtn} onPress={onFinish}>
        <Text style={styles.finishBtnText}>看看今天的主题</Text>
      </TouchableOpacity>
    </View>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: { backgroundColor: '#333' },
  dotInactive: { backgroundColor: '#E0D8CC' },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  stepContent: {
    alignItems: 'center',
  },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#5C4F3C',
    marginBottom: 12,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#9B8C76',
    lineHeight: 24,
    marginBottom: 32,
  },
  question: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#5C4F3C',
    marginBottom: 8,
    lineHeight: 36,
  },
  hint: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: '#5C4F3C',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
  },
  primaryBtnText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
  optionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#5C4F3C',
  },
  optionEmoji: { fontSize: 36, marginBottom: 8 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: '#5C4F3C', marginBottom: 4 },
  optionDesc: { fontSize: 12, color: '#999', textAlign: 'center' },
  verticalOptions: {
    width: '100%',
    gap: 12,
  },
  verticalCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  verticalCardSelected: { borderColor: '#5C4F3C' },
  verticalLabel: { fontSize: 18, fontWeight: '600', color: '#5C4F3C', marginBottom: 4 },
  verticalDesc: { fontSize: 14, color: '#999' },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  styleCard: {
    width: (width - 80) / 2,
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleCardSelected: { borderColor: '#5C4F3C' },
  styleEmoji: { fontSize: 40, marginBottom: 8 },
  styleLabel: { fontSize: 15, fontWeight: '600', color: '#5C4F3C' },
  finishBtn: {
    backgroundColor: '#5C4F3C',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    marginTop: 16,
  },
  finishBtnText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 40,
  },
  backBtn: { flex: 1 },
  backText: { fontSize: 16, color: '#9B8C76' },
  pageIndicator: { flex: 1, alignItems: 'flex-end' },
  pageText: { fontSize: 14, color: '#D4C4A8' },
});
