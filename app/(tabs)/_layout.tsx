import React from 'react';
import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../components/navigation/CustomTabBar';
import { useThemeStore } from '../../store/useThemeStore';

export default function TabsLayout() {
  const { theme } = useThemeStore();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Plan' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
