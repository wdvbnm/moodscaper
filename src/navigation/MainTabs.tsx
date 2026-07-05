import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProScreen from '../screens/ProScreen';
import MyPhotosScreen from '../screens/MyPhotosScreen';
import { useAppContext } from '../store/AppContext';

type Tab = 'home' | 'shop' | 'settings';
type Overlay = 'none' | 'pro' | 'myphotos';

export default function MainTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [overlay, setOverlay] = useState<Overlay>('none');
  const insets = useSafeAreaInsets();
  const { todayTheme, refreshTodayTheme } = useAppContext();

  const tabBarBg = todayTheme?.palette?.surface || '#FDFAF5';
  const activeColor = todayTheme?.palette?.accent || '#5C4F3C';

  // 全屏覆盖页面
  if (overlay === 'pro') {
    return (
      <View style={styles.container}>
        <ProScreen onClose={() => setOverlay('none')} />
      </View>
    );
  }
  if (overlay === 'myphotos') {
    return (
      <View style={styles.container}>
        <MyPhotosScreen onClose={() => setOverlay('none')} />
      </View>
    );
  }

  const handleTabPress = (tab: Tab) => {
    if (tab === activeTab && tab === 'home') {
      refreshTodayTheme();
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {activeTab === 'home' ? <HomeScreen />
          : activeTab === 'shop' ? <ShopScreen />
          : <SettingsScreen onGoPro={() => setOverlay('pro')} onGoPhotos={() => setOverlay('myphotos')} />}
      </View>

      <View style={[styles.tabBar, { backgroundColor: tabBarBg, paddingBottom: insets.bottom || 12 }]}>
        <TabButton label="今日" icon="🌤️" isActive={activeTab === 'home'} activeColor={activeColor} onPress={() => handleTabPress('home')} />
        <TabButton label="发现" icon="🧭" isActive={activeTab === 'shop'} activeColor={activeColor} onPress={() => handleTabPress('shop')} />
        <TabButton label="设置" icon="⚙️" isActive={activeTab === 'settings'} activeColor={activeColor} onPress={() => handleTabPress('settings')} />
      </View>
    </View>
  );
}

function TabButton({ label, icon, isActive, activeColor, onPress }: {
  label: string; icon: string; isActive: boolean; activeColor: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tabBtn} onPress={onPress}>
      <Text style={[styles.tabIcon, isActive && { opacity: 1 }]}>{icon}</Text>
      <Text style={[styles.tabLabel, isActive && { color: activeColor, fontWeight: '600' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0D8CC',
  },
  tabBtn: { flex: 1, alignItems: 'center', gap: 4 },
  tabIcon: { fontSize: 22, opacity: 0.5 },
  tabLabel: { fontSize: 12, color: '#9B8C76' },
});
