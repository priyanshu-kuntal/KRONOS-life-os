import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { ToastContainer } from '../components/ui/Toast';
import { QuickActionSheet } from '../components/ui/QuickActionSheet';
import { radii, typography } from '../constants/theme';

export default function RootLayout() {
  const { theme, isDark } = useThemeStore();
  const { user, isInitialized, isDemoMode, initializeAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Initialize auth listener on app startup
  useEffect(() => {
    initializeAuth();
  }, []);

  // Protected Route Navigation Guard
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isAuthenticated = Boolean(user || isDemoMode);

    if (!isAuthenticated && !inAuthGroup) {
      // Unauthenticated user trying to access main app -> Redirect to Login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated user trying to access auth screens -> Redirect to Dashboard
      router.replace('/(tabs)');
    }
  }, [isInitialized, user, isDemoMode, segments]);

  // Branded Loading Splash while session is restoring
  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={theme.background} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <View
            style={[
              styles.logoBox,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
              },
            ]}
          >
            <Sparkles size={32} color={theme.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
            KRONOS
          </Text>
          <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
            Restoring Life OS Workspace...
          </Text>
          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
      <ToastContainer />
      <QuickActionSheet />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: typography.letterSpacing.wider,
  },
  brandSubtitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: 6,
  },
});
