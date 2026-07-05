import AsyncStorage from '@react-native-async-storage/async-storage';

const REFERRAL_CODE_KEY = '@moodscaper_referral_code';
const REFERRAL_USED_KEY = '@moodscaper_referral_used';   // 自己是否已用过别人的码
const REFERRAL_COUNT_KEY = '@moodscaper_referral_count';  // 成功邀请人数
const REFERRED_BY_KEY = '@moodscaper_referred_by';         // 是被谁邀请的

// Pro 试用天数配置
export const TRIAL_DAYS_INVITER = 3;   // 邀请人得 3 天
export const TRIAL_DAYS_INVITEE = 7;   // 被邀请人得 7 天

// ===== 生成或获取邀请码 =====
export async function getMyReferralCode(): Promise<string> {
  let code = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
  if (!code) {
    // 生成 8 位随机码
    code = 'MS' + Math.random().toString(36).slice(2, 8).toUpperCase();
    await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
  }
  return code;
}

// ===== 获取邀请统计 =====
export async function getReferralStats(): Promise<{ code: string; count: number; used: boolean }> {
  const code = await getMyReferralCode();
  const count = parseInt(await AsyncStorage.getItem(REFERRAL_COUNT_KEY) || '0', 10);
  const used = !!(await AsyncStorage.getItem(REFERRAL_USED_KEY));
  return { code, count, used };
}

// ===== 使用邀请码（新用户填码） =====
export async function useReferralCode(code: string): Promise<{ success: boolean; message: string }> {
  if (!code || !code.startsWith('MS') || code.length !== 8) {
    return { success: false, message: '邀请码格式不正确' };
  }

  // 检查是否已用过
  const alreadyUsed = await AsyncStorage.getItem(REFERRAL_USED_KEY);
  if (alreadyUsed) {
    return { success: false, message: '你已经使用过邀请码了' };
  }

  // 不能用自己的码
  const myCode = await getMyReferralCode();
  if (code === myCode) {
    return { success: false, message: '不能使用自己的邀请码' };
  }

  // 标记自己已使用
  await AsyncStorage.setItem(REFERRAL_USED_KEY, 'true');
  await AsyncStorage.setItem(REFERRED_BY_KEY, code);

  // 记录邀请人的邀请次数（存储中模拟，实际需服务端）
  // 这里用 AsyncStorage 模拟 —— 真实场景需要后端防作弊
  const inviterCount = parseInt(
    await AsyncStorage.getItem(`${REFERRAL_COUNT_KEY}_${code}`) || '0',
    10
  );
  await AsyncStorage.setItem(`${REFERRAL_COUNT_KEY}_${code}`, String(inviterCount + 1));

  return {
    success: true,
    message: `邀请码有效！你获得 ${TRIAL_DAYS_INVITEE} 天 Pro 试用`,
  };
}

// ===== 计算应得的试用天数 =====
export async function getTrialDays(): Promise<number> {
  let days = 0;

  // 被邀请奖励
  const referred = await AsyncStorage.getItem(REFERRED_BY_KEY);
  if (referred) days += TRIAL_DAYS_INVITEE;

  // 邀请别人奖励（自己的码被用过几次）
  const myCode = await getMyReferralCode();
  const count = parseInt(
    await AsyncStorage.getItem(`${REFERRAL_COUNT_KEY}_${myCode}`) || '0',
    10
  );
  days += count * TRIAL_DAYS_INVITER;

  return days;
}

// ===== 分享邀请文案 =====
export function getReferralShareText(code: string): string {
  return [
    `🌤️ 送你 ${TRIAL_DAYS_INVITEE} 天 MoodScaper Pro 会员`,
    `下载后填邀请码：${code}`,
    `每天一张天气氛围壁纸，手机屏幕从此不一样`,
  ].join('\n');
}
