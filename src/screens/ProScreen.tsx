import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useMembership, PRICING, PRO_FEATURES } from '../store/MembershipContext';

export default function ProScreen({ onClose }: { onClose?: () => void }) {
  const { membership, isPro, upgradeToPro, resetToFree } = useMembership();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (type: 'yearly' | 'lifetime') => {
    setLoading(type);
    // 模拟支付（真实支付接入后再替换）
    await new Promise((r) => setTimeout(r, 600));
    await upgradeToPro(type);
    Alert.alert('升级成功 🎉', type === 'lifetime'
      ? '已解锁永久 Pro，全部功能畅享！'
      : '已开通 Pro 年订阅，未来一年尽情享受！'
    );
    setLoading(null);
  };

  // 开发调试：重置
  const handleDebugReset = async () => {
    await resetToFree();
    Alert.alert('已重置', '会员状态已回到免费版（仅调试用）');
  };

  if (isPro) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.title}>你已是 Pro 会员</Text>
        <Text style={styles.sub}>
          {membership.tier === 'lifetime' ? '终身买断，永久畅享' : `年订阅有效至 ${membership.proExpiry ? new Date(membership.proExpiry).toLocaleDateString('zh-CN') : '—'}`}
        </Text>

        <View style={styles.featureList}>
          {PRO_FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.check}>✅</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backText}>返回</Text>
          </TouchableOpacity>
        )}

        {/* 调试按钮 */}
        <TouchableOpacity style={styles.debugBtn} onPress={handleDebugReset}>
          <Text style={styles.debugText}>🔧 重置会员（调试）</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.heroEmoji}>🌟</Text>
      <Text style={styles.title}>解锁 MoodScaper Pro</Text>
      <Text style={styles.subtitle}>每天一张 AI 独家壁纸，专属创作，永不撞屏</Text>

      {/* 功能列表 */}
      <View style={styles.featureList}>
        {PRO_FEATURES.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={styles.check}>✨</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* 价格卡片 */}
      <TouchableOpacity
        style={[styles.priceCard, styles.priceCardPrimary]}
        onPress={() => handleUpgrade('yearly')}
        disabled={loading !== null}
      >
        <View style={styles.priceHeader}>
          <Text style={styles.priceLabel}>{PRICING.proYearly.label}</Text>
          <Text style={styles.priceBest}>推荐</Text>
        </View>
        <Text style={styles.priceAmount}>￥{PRICING.proYearly.price}<Text style={styles.priceUnit}>/年</Text></Text>
        <Text style={styles.priceDesc}>每月仅 ￥4，一瓶饮料钱</Text>
        {loading === 'yearly' && <Text style={styles.loadingText}>处理中...</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.priceCard, styles.priceCardSecondary]}
        onPress={() => handleUpgrade('lifetime')}
        disabled={loading !== null}
      >
        <Text style={styles.priceLabel}>{PRICING.proLifetime.label}</Text>
        <Text style={styles.priceAmount}>￥{PRICING.proLifetime.price}<Text style={styles.priceUnit}> 一次买断</Text></Text>
        <Text style={styles.priceDesc}>{PRICING.proLifetime.desc}</Text>
        {loading === 'lifetime' && <Text style={styles.loadingText}>处理中...</Text>}
      </TouchableOpacity>

      {/* 底部说明 */}
      <Text style={styles.footer}>
        订阅将在当期结束前 24 小时自动续费，可随时取消。{'\n'}
        确认购买即代表同意服务条款和隐私政策。
      </Text>

      {onClose && (
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backText}>以后再说</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  heroEmoji: { fontSize: 56, marginBottom: 16 },
  crown: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: '#5C4F3C', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: '#9B8C76', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#9B8C76', textAlign: 'center', marginBottom: 28 },

  featureList: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  check: { fontSize: 16 },
  featureText: { fontSize: 15, color: '#5C4F3C', flex: 1 },

  priceCard: {
    width: '100%',
    borderRadius: 16,
    padding: 22,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  priceCardPrimary: {
    backgroundColor: '#5C4F3C',
    borderColor: '#5C4F3C',
  },
  priceCardSecondary: {
    backgroundColor: '#FFF',
    borderColor: '#E0D8CC',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  priceBest: {
    backgroundColor: '#FF6B35',
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priceAmount: { fontSize: 36, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  priceUnit: { fontSize: 16, fontWeight: '400', opacity: 0.7 },
  priceDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  loadingText: { marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  footer: {
    fontSize: 11,
    color: '#C4B8A8',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
    marginBottom: 20,
  },

  backBtn: { paddingVertical: 10 },
  backText: { fontSize: 15, color: '#9B8C76' },
  debugBtn: { marginTop: 24, paddingVertical: 10 },
  debugText: { fontSize: 12, color: '#CCC' },
});
