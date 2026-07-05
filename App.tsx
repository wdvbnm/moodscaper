import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppContext } from './src/store/AppContext';
import { MembershipProvider } from './src/store/MembershipContext';
import OnboardingScreen from './src/screens/OnboardingScreen';
import MainTabs from './src/navigation/MainTabs';

function AppNavigator() {
  const { preferences } = useAppContext();

  if (!preferences.completedOnboarding) {
    return <OnboardingScreen />;
  }

  return <MainTabs />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MembershipProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </AppProvider>
      </MembershipProvider>
    </SafeAreaProvider>
  );
}
