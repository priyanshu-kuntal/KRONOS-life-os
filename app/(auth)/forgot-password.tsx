import React, { useState } from 'react';
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
import { Mail, ArrowLeft, ArrowRight, KeyRound } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useToastStore } from '../../store/useToastStore';
import { Input } from '../../components/ui/Input';
import { AppButton } from '../../components/ui/AppButton';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { radii, spacing, typography } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { resetPassword, isLoading } = useAuthStore();
  const { showToast } = useToastStore();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      showToast({
        title: 'Email Required',
        message: 'Please enter your account email address.',
        type: 'warning',
      });
      return;
    }

    const res = await resetPassword(email.trim());
    if (res.success) {
      setSubmitted(true);
      showToast({
        title: 'Recovery Email Sent',
        message: 'Check your inbox for password reset instructions.',
        type: 'success',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ResponsiveContainer maxWidth={460}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
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
              <KeyRound size={24} color={theme.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
              Password Recovery
            </Text>
            <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
              Enter your email to receive recovery instructions.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {submitted ? (
              <View style={styles.submittedBox}>
                <Text style={[styles.submittedTitle, { color: theme.textPrimary }]}>
                  Check Your Inbox
                </Text>
                <Text style={[styles.submittedText, { color: theme.textSecondary }]}>
                  We sent recovery instructions to <Text style={{ color: theme.primary }}>{email}</Text>.
                </Text>
                <AppButton
                  title="Return to Sign In"
                  onPress={() => router.replace('/(auth)/login')}
                  fullWidth
                  style={{ marginTop: spacing.lg }}
                />
              </View>
            ) : (
              <>
                <Input
                  label="Registered Email"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  leftIcon={<Mail size={16} color={theme.textMuted} />}
                />

                <AppButton
                  title="Send Reset Instructions"
                  onPress={handleReset}
                  loading={isLoading}
                  fullWidth
                  size="lg"
                  rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
                  style={styles.submitBtn}
                />
              </>
            )}
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
    width: 48,
    height: 48,
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
  submitBtn: {
    marginTop: spacing.md,
  },
  submittedBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  submittedTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  submittedText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});
