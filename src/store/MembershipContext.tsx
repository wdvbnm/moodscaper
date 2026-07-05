import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===== 会员类型 =====
export type MembershipTier = 'free' | 'pro' | 'lifetime';

export interface MembershipState {
  tier: MembershipTier;
  proExpiry: string | null;   // ISO date，Pro 到期日
  purchasedPacks: string[];    // 已购买的单次主题包 ID
}

const DEFAULT_STATE: MembershipState = {
  tier: 'free',
  proExpiry: null,
  purchasedPacks: [],
};

const STORAGE_KEY = '@moodscaper_membership';

// ===== 定价 =====
export const PRICING = {
  proYearly: { price: 48, label: 'Pro 年订阅', desc: '￥48/年，解锁全部功能' },
  proLifetime: { price: 98, label: 'Pro 永久', desc: '￥98 一次买断，终身使用' },
  packSingle: { price: 3, label: '单次主题包', desc: '￥3-6/个，节日限定/城市系列' },
};

// ===== Pro 专属分类 key =====
export const PRO_ONLY_CATEGORIES = ['portrait', 'cyberpunk', 'fluid'];
// ===== Pro 专属功能 =====
export const PRO_FEATURES = [
  'AI 生成独家壁纸',
  '上传个人照片，融入每日主题',
  '30+ 全部天气氛围主题',
  '人像写真 / 赛博暗色 / 流体渐变',
  '限时限定主题',
  '去广告',
];

interface MembershipContextType {
  membership: MembershipState;
  isPro: boolean;
  upgradeToPro: (type: 'yearly' | 'lifetime') => Promise<void>;
  addTrialDays: (days: number) => Promise<void>;
  purchasePack: (packId: string) => Promise<void>;
  resetToFree: () => Promise<void>;
}

const MembershipContext = createContext<MembershipContextType>({
  membership: DEFAULT_STATE,
  isPro: false,
  upgradeToPro: async () => {},
  addTrialDays: async () => {},
  purchasePack: async () => {},
  resetToFree: async () => {},
});

export function MembershipProvider({ children }: { children: ReactNode }) {
  const [membership, setMembership] = useState<MembershipState>(DEFAULT_STATE);

  // 加载
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          // 检查 Pro 是否过期
          if (parsed.proExpiry && new Date(parsed.proExpiry) < new Date()) {
            parsed.tier = 'free';
            parsed.proExpiry = null;
          }
          setMembership(parsed);
        } catch {}
      }
    });
  }, []);

  const save = async (state: MembershipState) => {
    setMembership(state);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const isPro = membership.tier === 'pro' || membership.tier === 'lifetime';

  const upgradeToPro = useCallback(async (type: 'yearly' | 'lifetime') => {
    const newState: MembershipState = {
      ...membership,
      tier: type === 'lifetime' ? 'lifetime' : 'pro',
      proExpiry: type === 'yearly'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : null,
    };
    await save(newState);
  }, [membership]);

  const purchasePack = useCallback(async (packId: string) => {
    if (!membership.purchasedPacks.includes(packId)) {
      const newState = {
        ...membership,
        purchasedPacks: [...membership.purchasedPacks, packId],
      };
      await save(newState);
    }
  }, [membership]);

  // 添加试用天数
  const addTrialDays = useCallback(async (days: number) => {
    const now = new Date();
    let newExpiry: Date;

    if (membership.tier === 'pro' && membership.proExpiry) {
      // 已有 Pro，在现有到期日上加
      newExpiry = new Date(Math.max(now.getTime(), new Date(membership.proExpiry).getTime()));
    } else {
      // 免费用户或已过期，从现在开始算
      newExpiry = now;
    }
    newExpiry.setDate(newExpiry.getDate() + days);

    const newState: MembershipState = {
      ...membership,
      tier: 'pro',
      proExpiry: newExpiry.toISOString(),
    };
    await save(newState);
  }, [membership]);

  const resetToFree = useCallback(async () => {
    await save(DEFAULT_STATE);
  }, []);

  return (
    <MembershipContext.Provider value={{ membership, isPro, upgradeToPro, addTrialDays, purchasePack, resetToFree }}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  return useContext(MembershipContext);
}
