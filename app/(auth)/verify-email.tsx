import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MailCheck, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { AppButton } from '../../components/ui/AppButton';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { radii, spacing, typography } from '../../constants/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ResponsiveContainer maxWidth={460}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace('/(auth)/login')}
            style={[styles.backBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
          >
            <ArrowLeft size={18} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.brandHeader}>
            <View
              style={[
                styles.logoIcon,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                },
              ]}
            >
              <MailCheck size={28} color={theme.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
              Verify Your Email
            </Text>
            <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
              We sent a verification link to{' '}
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>
                {user?.email || 'your email'}
              </Text>
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Please click the link in your email to activate your account and access all features.
            </Text>

            <AppButton
              title="I've Verified My Email"
              onPress={() => router.replace('/(tabs)')}
              fullWidth
              size="lg"
              style={styles.submitBtn}
            />

            <AppButton
              title="Return to Sign In"
              onPress={() => router.replace('/(auth)/login')}
              variant="ghost"
              fullWidth
              size="md"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 50 : spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brandTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.heavy,
  },
  brandSubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  card: {
    borderRadius: radii['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: spacing.xl,
  },
});
