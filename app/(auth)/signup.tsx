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
import { Mail, Lock, User, Sparkles, ArrowRight, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useToastStore } from '../../store/useToastStore';
import { Input } from '../../components/ui/Input';
import { AppButton } from '../../components/ui/AppButton';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { radii, spacing, typography } from '../../constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { signUpWithEmail, isLoading, error, clearError } = useAuthStore();
  const { showToast } = useToastStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      showToast({
        title: 'Name Required',
        message: 'Please enter your full name.',
        type: 'warning',
      });
      return;
    }

    if (!email.trim() || !isValidEmail(email.trim())) {
      showToast({
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
        type: 'warning',
      });
      return;
    }

    if (password.length < 6) {
      showToast({
        title: 'Weak Password',
        message: 'Password must be at least 6 characters.',
        type: 'warning',
      });
      return;
    }

    if (password !== confirmPassword) {
      showToast({
        title: 'Passwords Mismatch',
        message: 'Password and confirm password do not match.',
        type: 'warning',
      });
      return;
    }

    clearError();
    const res = await signUpWithEmail(email.trim(), password, fullName.trim());
    if (res.success) {
      if (res.needsVerification) {
        showToast({
          title: 'Verification Link Sent',
          message: 'Please check your email inbox to verify your account.',
          type: 'info',
        });
        router.replace('/(auth)/verify-email');
      } else {
        showToast({
          title: 'Welcome to KRONOS',
          message: `Account created for ${fullName.trim()}`,
          type: 'success',
        });
        router.replace('/(tabs)');
      }
    } else if (res.error) {
      showToast({
        title: 'Sign Up Failed',
        message: res.error,
        type: 'error',
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
          {/* Back navigation */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
          >
            <ArrowLeft size={18} color={theme.textPrimary} />
          </TouchableOpacity>

          {/* Brand Header */}
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
              <Sparkles size={24} color={theme.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
              Join KRONOS
            </Text>
            <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
              Master your schedule, habits, and fitness in one unified system.
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Create Account
            </Text>

            {error && (
              <View style={[styles.errorBanner, { backgroundColor: `${theme.danger}18`, borderColor: `${theme.danger}40` }]}>
                <AlertCircle size={14} color={theme.danger} style={{ marginRight: 6 }} />
                <Text style={[styles.errorBannerText, { color: theme.danger }]}>
                  {error}
                </Text>
              </View>
            )}

            <Input
              label="Full Name"
              placeholder="e.g. Alex Rivera"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (error) clearError();
              }}
              leftIcon={<User size={16} color={theme.textMuted} />}
            />

            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) clearError();
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={16} color={theme.textMuted} />}
            />

            <Input
              label="Password (min 6 characters)"
              placeholder="••••••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) clearError();
              }}
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={16} color={theme.textMuted} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showPassword ? (
                    <EyeOff size={16} color={theme.textMuted} />
                  ) : (
                    <Eye size={16} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              }
            />

            <Input
              label="Confirm Password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (error) clearError();
              }}
              secureTextEntry={!showConfirmPassword}
              leftIcon={<Lock size={16} color={theme.textMuted} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showConfirmPassword ? (
                    <EyeOff size={16} color={theme.textMuted} />
                  ) : (
                    <Eye size={16} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              }
            />

            <AppButton
              title="Create Life OS Account"
              onPress={handleSignUp}
              loading={isLoading}
              fullWidth
              size="lg"
              rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
              style={styles.submitBtn}
            />
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.loginLink, { color: theme.primary }]}>Sign In</Text>
            </TouchableOpacity>
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
  cardTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
  },
  loginLink: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
