import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useAppContext } from '../store/AppContext';
import { useMembership, PRO_FEATURES } from '../store/MembershipContext';
import { ColorTemp, VisualDensity, StylePreference, ThemeMode, WeatherType, WeatherMood, ThemeHistoryEntry } from '../types';
import { getReferralStats, useReferralCode, getReferralShareText, TRIAL_DAYS_INVITER, TRIAL_DAYS_INVITEE } from '../services/referralService';

const COLOR_TEMP_OPTIONS: { value: ColorTemp; label: string }[] = [
  { value: 'warm', label: '暖色调' },
  { value: 'neutral', label: '中性调' },
  { value: 'cool', label: '冷色调' },
];

const DENSITY_OPTIONS: { value: VisualDensity; label: string; desc: string }[] = [
  { value: 'minimal', label: '极简', desc: '少量色彩，清爽干净' },
  { value: 'balanced', label: '适中', desc: '恰到好处的视觉层次' },
  { value: 'rich', label: '丰富', desc: '饱满的配色和细节' },
];

const STYLE_OPTIONS: { value: StylePreference; label: string; emoji: string }[] = [
  { value: 'abstract', label: '抽象渐变', emoji: '🎨' },
  { value: 'nature', label: '自然风景', emoji: '🏔️' },
  { value: 'urban', label: '都市质感', emoji: '🌃' },
  { value: 'illustration', label: '手绘插画', emoji: '✏️' },
];

const WEATHER_TYPES_FOR_MOOD: { type: WeatherType; label: string; emoji: string }[] = [
  { type: 'rain', label: '雨天', emoji: '🌧️' },
  { type: 'snow', label: '雪天', emoji: '❄️' },
  { type: 'cloudy', label: '阴天', emoji: '☁️' },
  { type: 'clear', label: '晴天', emoji: '☀️' },
];

export default function SettingsScreen({ onGoPro, onGoPhotos }: { onGoPro?: () => void; onGoPhotos?: () => void }) {
  const { preferences, updatePreferences, refreshTodayTheme, themeHistory, restoreHistoryTheme } = useAppContext();
  const { isPro, membership, addTrialDays } = useMembership();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [inputCode, setInputCode] = useState('');
  // 加载邀请信息
  useEffect(() => {
    getReferralStats().then(({ code, count }) => {
      setReferralCode(code);
      setReferralCount(count);
    });
  }, []);

  const handleColorTempChange = (v: ColorTemp) => {
    updatePreferences({ colorTemp: v });
  };

  const handleDensityChange = (v: VisualDensity) => {
    updatePreferences({ visualDensity: v });
  };

  const handleStyleChange = (v: StylePreference) => {
    updatePreferences({ style: v });
  };

  const handleThemeModeChange = (v: ThemeMode) => {
    updatePreferences({ themeMode: v });
  };

  const handleWeatherMoodChange = (weatherType: WeatherType, mood: WeatherMood) => {
    const newMap = { ...preferences.weatherMoodMap, [weatherType]: mood };
    updatePreferences({ weatherMoodMap: newMap });
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      '重新设置偏好',
      '将回到引导页重新选择，今天的主题也会被更新。确定吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            updatePreferences({ completedOnboarding: false } as any);
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    refreshTodayTheme();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.pageTitle}>设置</Text>

      {/* 会员状态 */}
      <View style={[styles.proCard, isPro && styles.proCardActive]}>
        <View style={styles.proRow}>
          <Text style={styles.proEmoji}>{isPro ? '👑' : '🌟'}</Text>
          <View style={styles.proInfo}>
            <Text style={styles.proTitle}>
              {isPro ? (membership.tier === 'lifetime' ? 'Pro 永久会员' : 'Pro 年订阅') : '免费版'}
            </Text>
            <Text style={styles.proDesc}>
              {isPro
                ? '全部功能已解锁，尽情享受'
                : '解锁 AI 壁纸、全部分类、去广告'}
            </Text>
          </View>
          {!isPro && (
            <TouchableOpacity
              style={styles.proUpgradeBtn}
              onPress={() => onGoPro?.()}
            >
              <Text style={styles.proUpgradeText}>升级</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 每日自动壁纸 */}
      <Section title="每日自动壁纸">
        <View style={styles.autoWallpaperRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.autoWallpaperLabel}>自动设置壁纸</Text>
            <Text style={styles.autoWallpaperDesc}>
              {Platform.OS === 'android'
                ? '每天早上 6-10 点自动更新桌面壁纸'
                : '每天早上自动缓存天气主题，打开 App 即可看到'}
            </Text>
          </View>
          <Switch
            value={preferences.autoWallpaperEnabled ?? false}
            onValueChange={(v) => {
              updatePreferences({ autoWallpaperEnabled: v } as any);
              if (v && Platform.OS === 'android') {
                Alert.alert(
                  '省电提示',
                  '部分手机厂商的省电策略可能会延迟后台更新。\n\n建议：在系统设置中关闭 MoodScaper 的电池优化。',
                  [{ text: '知道了' }]
                );
              }
            }}
            trackColor={{ false: '#DDD', true: '#5C4F3C' }}
            thumbColor={preferences.autoWallpaperEnabled ? '#FFF' : '#F5F0E8'}
          />
        </View>
        {__DEV__ && (
          <TouchableOpacity
            style={styles.devTestBtn}
            onPress={async () => {
              try {
                const BgTask = require('expo-background-task');
                await BgTask.triggerTaskWorkerForTestingAsync();
                Alert.alert('已触发', '后台任务已手动触发，请检查控制台输出。\n\n如壁纸已更换则表示流水线正常。');
              } catch (e: any) {
                Alert.alert('触发失败', e.message);
              }
            }}
          >
            <Text style={styles.devTestBtnText}>[DEV] 手动触发后台任务</Text>
          </TouchableOpacity>
        )}
      </Section>

      {/* 邀请好友 */}
      <Section title="邀请好友">
        <View style={styles.referralBox}>
          <Text style={styles.referralDesc}>
            好友通过你的邀请码下载 App，{'\n'}
            你得 <Text style={{ fontWeight: '700', color: '#5C4F3C' }}>{TRIAL_DAYS_INVITER} 天</Text> Pro，好友得 <Text style={{ fontWeight: '700', color: '#5C4F3C' }}>{TRIAL_DAYS_INVITEE} 天</Text> Pro
          </Text>
          <View style={styles.referralCodeRow}>
            <Text style={styles.referralCodeLabel}>我的邀请码</Text>
            <Text style={styles.referralCodeValue}>{referralCode}</Text>
            <TouchableOpacity
              style={styles.referralShareBtn}
              onPress={() => {
                const text = getReferralShareText(referralCode);
                navigator.clipboard?.writeText(text);
                Alert.alert('已复制', '邀请文案已复制，发给好友吧！');
              }}
            >
              <Text style={styles.referralShareText}>复制邀请</Text>
            </TouchableOpacity>
          </View>
          {referralCount > 0 && (
            <Text style={styles.referralCountText}>🎉 已成功邀请 {referralCount} 人</Text>
          )}
        </View>

        {/* 兑换按钮 */}
        <TouchableOpacity
          style={styles.referralFullBtn}
          onPress={() => {
            if (Platform.OS === 'web') {
              // Web：浏览器原生弹窗
              const code = window.prompt?.('请输入好友的邀请码：');
              if (!code) return;
              const clean = code.trim().toUpperCase().slice(0, 8);
              useReferralCode(clean).then(async (result) => {
                if (result.success) {
                  await addTrialDays(TRIAL_DAYS_INVITEE);
                  alert(`兑换成功！获得 ${TRIAL_DAYS_INVITEE} 天 Pro 试用`);
                } else {
                  alert(result.message);
                }
              });
            } else {
              // 手机：自定义弹窗输入
              setInputCode('');
              setShowReferralInput(true);
            }
          }}
        >
          <Text style={styles.referralFullBtnText}>✏️ 输入好友邀请码兑换试用</Text>
        </TouchableOpacity>

        {/* 邀请码输入弹窗 */}
        {showReferralInput && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>输入邀请码</Text>
              <TextInput
                style={styles.modalInput}
                value={inputCode}
                onChangeText={(t) => setInputCode(t.toUpperCase().slice(0, 8))}
                placeholder="如 MS-XK7B2N"
                placeholderTextColor="#C4B8A8"
                autoFocus
              />
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowReferralInput(false)}
                >
                  <Text style={styles.modalCancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={async () => {
                    setShowReferralInput(false);
                    if (!inputCode) return;
                    const result = await useReferralCode(inputCode.trim());
                    if (result.success) {
                      await addTrialDays(TRIAL_DAYS_INVITEE);
                      Alert.alert('兑换成功 🎉', `获得 ${TRIAL_DAYS_INVITEE} 天 Pro 试用！`);
                    } else {
                      Alert.alert('兑换失败', result.message);
                    }
                    setInputCode('');
                  }}
                >
                  <Text style={styles.modalConfirmText}>确认</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Section>

      {/* 色温偏好 */}
      <Section title="色彩倾向">
        <View style={styles.chipRow}>
          {COLOR_TEMP_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                preferences.colorTemp === opt.value && styles.chipActive,
              ]}
              onPress={() => handleColorTempChange(opt.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  preferences.colorTemp === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* 视觉密度 */}
      <Section title="视觉密度">
        {DENSITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.radioCard,
              preferences.visualDensity === opt.value && styles.radioCardActive,
            ]}
            onPress={() => handleDensityChange(opt.value)}
          >
            <View style={styles.radioRow}>
              <View>
                <Text style={styles.radioLabel}>{opt.label}</Text>
                <Text style={styles.radioDesc}>{opt.desc}</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  preferences.visualDensity === opt.value && styles.radioActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        ))}
      </Section>

      {/* 视觉风格 */}
      <Section title="视觉风格">
        <View style={styles.styleRow}>
          {STYLE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.styleCard,
                preferences.style === opt.value && styles.styleCardActive,
              ]}
              onPress={() => handleStyleChange(opt.value)}
            >
              <Text style={styles.styleEmoji}>{opt.emoji}</Text>
              <Text style={styles.styleLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* 天气-情绪映射 */}
      <Section title="天气心情映射">
        <Text style={styles.sectionHint}>不同天气，你希望主题给你什么感觉？</Text>
        {WEATHER_TYPES_FOR_MOOD.map((w) => {
          const currentMood = preferences.weatherMoodMap[w.type];
          return (
            <View key={w.type} style={styles.moodRow}>
              <Text style={styles.moodWeatherLabel}>
                {w.emoji} {w.label}
              </Text>
              <View style={styles.moodChipRow}>
                {(['cozy', 'neutral', 'energizing'] as WeatherMood[]).map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    style={[
                      styles.moodChip,
                      currentMood === mood && styles.moodChipActive,
                    ]}
                    onPress={() => handleWeatherMoodChange(w.type, mood)}
                  >
                    <Text
                      style={[
                        styles.moodChipText,
                        currentMood === mood && styles.moodChipTextActive,
                      ]}
                    >
                      {mood === 'cozy' ? '治愈' : mood === 'neutral' ? '自然' : '提神'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </Section>

      {/* Pro：自定义氛围文案 */}
      <Section title="自定义文案">
        <Text style={styles.sectionHint}>
          {isPro ? '为每种天气写你的专属文案' : 'Pro 用户可为每种天气自写氛围文案'}
        </Text>
        {(['rain', 'snow', 'clear'] as WeatherType[]).map((wt) => (
          <View key={wt} style={styles.moodRow}>
            <Text style={styles.moodWeatherLabel}>
              {wt === 'rain' ? '🌧️ 雨' : wt === 'snow' ? '❄️ 雪' : '☀️ 晴'}
            </Text>
            {isPro ? (
              <TextInput
                placeholder={preferences.customMoods?.[wt] || '输入你的专属文案...'}
                defaultValue={preferences.customMoods?.[wt] || ''}
                onBlur={(e) => {
                  const val = (e as any).nativeEvent?.text || '';
                  if (val) {
                    updatePreferences({
                      customMoods: { ...preferences.customMoods, [wt]: val },
                    });
                  }
                }}
                style={styles.moodInput}
                placeholderTextColor="#C4B8A8"
              />
            ) : (
              <TouchableOpacity onPress={() => onGoPro?.()}>
                <Text style={{ color: '#D4A84B', fontSize: 12 }}>🔒 Pro</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </Section>

      {/* Pro：历史主题回溯 */}
      <Section title="历史主题">
        <Text style={styles.sectionHint}>
          {isPro ? '过去 7 天的每日主题，点击恢复' : 'Pro 用户可回溯过去 7 天主题'}
        </Text>
        {isPro ? (
          themeHistory.length === 0 ? (
            <Text style={{ color: '#C4B8A8', fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
              暂无历史，明天再来看看
            </Text>
          ) : (
            themeHistory.map((entry) => (
              <TouchableOpacity
                key={entry.date}
                style={styles.historyRow}
                onPress={() => {
                  restoreHistoryTheme(entry);
                  Alert.alert('已恢复', `${entry.date} 的主题已设为今日主题`);
                }}
              >
                <Text style={styles.historyDate}>{entry.date}</Text>
                <Text style={styles.historyMood} numberOfLines={1}>{entry.theme.moodLabel}</Text>
                <Text style={styles.historyWeather}>{entry.theme.temperature}°C {entry.theme.weatherDescription}</Text>
                <Text style={styles.historyArrow}>↺</Text>
              </TouchableOpacity>
            ))
          )
        ) : (
          <TouchableOpacity onPress={() => onGoPro?.()}>
            <Text style={{ color: '#D4A84B', fontSize: 13, textAlign: 'center', paddingVertical: 8 }}>
              🔒 升级 Pro 解锁历史回溯
            </Text>
          </TouchableOpacity>
        )}
      </Section>

      {/* 暗色/亮色模式 */}
      <Section title="明暗模式">
        <View style={styles.chipRow}>
          {([
            { value: 'system' as ThemeMode, label: '跟随系统' },
            { value: 'light' as ThemeMode, label: '始终亮色' },
            { value: 'dark' as ThemeMode, label: '始终暗色' },
          ]).map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                preferences.themeMode === opt.value && styles.chipActive,
              ]}
              onPress={() => handleThemeModeChange(opt.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  preferences.themeMode === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      {/* 我的图库 */}
      <Section title="我的图库">
        <TouchableOpacity
          style={styles.photoEntry}
          onPress={() => onGoPhotos?.()}
        >
          <Text style={styles.photoEntryIcon}>🖼️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoEntryTitle}>管理我的图库</Text>
            <Text style={styles.photoEntryDesc}>上传和管理你的壁纸收藏</Text>
          </View>
          <Text style={styles.photoEntryArrow}>→</Text>
        </TouchableOpacity>
      </Section>

      {/* 隐私政策 */}
      <Section title="法律信息">
        <TouchableOpacity style={styles.legalRow} onPress={() => {
          if (typeof window !== 'undefined') {
            window.open('https://moodscaper.com/privacy.html', '_blank');
          }
        }}>
          <Text style={styles.legalText}>📜 隐私政策</Text>
          <Text style={styles.legalArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.legalRow} onPress={() => {
          if (typeof window !== 'undefined') {
            window.open('https://moodscaper.com/terms.html', '_blank');
          }
        }}>
          <Text style={styles.legalText}>📋 服务条款</Text>
          <Text style={styles.legalArrow}>→</Text>
        </TouchableOpacity>
      </Section>

      {/* 操作按钮 */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Text style={styles.refreshBtnText}>🔄 刷新今日主题</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={handleResetOnboarding}>
          <Text style={styles.resetBtnText}>重新设置偏好</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>MoodScaper v1.0.0</Text>
    </ScrollView>
  );
}

// ===== Section 组件 =====
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  scrollContent: { paddingBottom: 60 },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5C4F3C',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },

  // Pro 状态卡片
  proCard: {
    marginHorizontal: 20,
    backgroundColor: '#F5F0E8',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0D8CC',
  },
  proCardActive: {
    backgroundColor: '#5C4F3C',
    borderColor: '#5C4F3C',
  },
  proRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  proEmoji: { fontSize: 32 },
  proInfo: { flex: 1 },
  proTitle: { fontSize: 16, fontWeight: '600', color: '#5C4F3C', marginBottom: 2 },
  proDesc: { fontSize: 13, color: '#9B8C76' },
  proUpgradeBtn: {
    backgroundColor: '#5C4F3C',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16,
  },
  proUpgradeText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  section: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4F3C',
    marginBottom: 14,
  },
  sectionHint: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 16,
  },

  // Chips
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  chipActive: { backgroundColor: '#5C4F3C' },
  chipText: { fontSize: 14, color: '#666' },
  chipTextActive: { color: '#FFF' },

  // Radio
  radioCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  radioCardActive: { borderColor: '#5C4F3C' },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioLabel: { fontSize: 16, fontWeight: '500', color: '#5C4F3C', marginBottom: 2 },
  radioDesc: { fontSize: 13, color: '#9B8C76' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#DDD',
  },
  radioActive: {
    borderColor: '#5C4F3C',
    backgroundColor: '#5C4F3C',
  },

  // Style
  styleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  styleCard: {
    width: '47%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  styleCardActive: { borderColor: '#5C4F3C' },
  styleEmoji: { fontSize: 32, marginBottom: 6 },
  styleLabel: { fontSize: 14, fontWeight: '500', color: '#5C4F3C' },

  // Mood
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  moodWeatherLabel: { fontSize: 15, fontWeight: '500', color: '#5C4F3C' },
  moodChipRow: { flexDirection: 'row', gap: 6 },
  moodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
  },
  moodChipActive: { backgroundColor: '#5C4F3C' },
  moodChipText: { fontSize: 12, color: '#9B8C76' },
  moodChipTextActive: { color: '#FFF' },

  // 我的照片入口
  photoEntry: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', padding: 14, borderRadius: 12,
    gap: 12,
  },
  photoEntryIcon: { fontSize: 28 },
  photoEntryTitle: { fontSize: 15, fontWeight: '500', color: '#5C4F3C', marginBottom: 2 },
  photoEntryDesc: { fontSize: 12, color: '#9B8C76' },
  photoEntryArrow: { fontSize: 18, color: '#C4B8A8' },

  // 历史主题行
  historyRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0ECE7',
  },
  historyDate: { fontSize: 13, color: '#5C4F3C', fontWeight: '500', width: 80 },
  historyMood: { fontSize: 13, color: '#5C4F3C', flex: 1 },
  historyWeather: { fontSize: 11, color: '#9B8C76' },
  historyArrow: { fontSize: 18, color: '#C4B8A8' },

  // 邀请好友
  referralBox: {
    backgroundColor: '#FDFAF5', padding: 16, borderRadius: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#E0D8CC',
  },
  referralDesc: { fontSize: 14, color: '#5C4F3C', textAlign: 'center', lineHeight: 22, marginBottom: 14 },
  referralCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  referralCodeLabel: { fontSize: 13, color: '#9B8C76' },
  referralCodeValue: {
    fontSize: 20, fontWeight: '700', color: '#5C4F3C',
    letterSpacing: 2, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#E0D8CC',
  },
  referralShareBtn: {
    backgroundColor: '#5C4F3C', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
  },
  referralShareText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  referralCountText: { fontSize: 13, color: '#5C4F3C', textAlign: 'center', marginTop: 10 },
  referralInputRow: { flexDirection: 'row', gap: 8 },
  referralFullBtn: {
    backgroundColor: '#FFF', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#E0D8CC',
  },
  referralFullBtnText: { fontSize: 15, color: '#5C4F3C', fontWeight: '500' },
  referralInput: {
    flex: 1, borderWidth: 1, borderColor: '#E0D8CC', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12, fontSize: 14, color: '#5C4F3C',
    backgroundColor: '#FFF',
  },
  moodInput: {
    flex: 1, borderWidth: 1, borderColor: '#E0D8CC', borderRadius: 8,
    paddingVertical: 4, paddingHorizontal: 8, fontSize: 13, color: '#5C4F3C',
    backgroundColor: '#FFF',
  },
  referralUseBtn: {
    backgroundColor: '#5C4F3C', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 10, justifyContent: 'center',
  },
  referralUseText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  // 法律信息
  legalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10,
  },
  legalText: { fontSize: 14, color: '#5C4F3C' },
  legalArrow: { fontSize: 14, color: '#C4B8A8' },

  // Actions
  actionSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  refreshBtn: {
    backgroundColor: '#5C4F3C',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  refreshBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  resetBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetBtnText: { color: '#9B8C76', fontSize: 15 },

  // 邀请码弹窗
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center',
    alignItems: 'center', zIndex: 999,
  },
  modalCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 28,
    width: '85%', alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#5C4F3C', marginBottom: 16 },
  modalInput: {
    width: '100%', borderWidth: 1, borderColor: '#E0D8CC', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14, fontSize: 16, color: '#5C4F3C',
    backgroundColor: '#FDFAF5', textAlign: 'center', letterSpacing: 2,
  },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  modalCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#E0D8CC', alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, color: '#9B8C76' },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#5C4F3C', alignItems: 'center',
  },
  modalConfirmText: { fontSize: 15, color: '#FFF', fontWeight: '600' },

  version: {
    textAlign: 'center',
    color: '#CCC',
    fontSize: 12,
    marginTop: 20,
  },

  // 每日自动壁纸
  autoWallpaperRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', padding: 16, borderRadius: 12,
  },
  autoWallpaperLabel: { fontSize: 15, fontWeight: '500', color: '#5C4F3C', marginBottom: 4 },
  autoWallpaperDesc: { fontSize: 12, color: '#9B8C76', lineHeight: 18 },
  devTestBtn: {
    padding: 12, marginTop: 8, backgroundColor: '#F0E8D8',
    borderRadius: 8, alignItems: 'center' as const,
  },
  devTestBtnText: { color: '#5C4F3C', fontSize: 13 },
});
