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
import { Mail, Lock, Sparkles, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useToastStore } from '../../store/useToastStore';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { AppButton } from '../../components/ui/AppButton';
import { Badge } from '../../components/ui/Badge';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { radii, spacing, typography } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { signInWithEmail, enterDemoMode, isLoading, error, clearError } = useAuthStore();
  const { showToast } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      showToast({
        title: 'Validation Error',
        message: 'Please enter both email and password.',
        type: 'warning',
      });
      return;
    }

    clearError();
    const res = await signInWithEmail(email.trim(), password.trim());
    if (res.success) {
      showToast({
        title: 'Welcome Back',
        message: `Signed in as ${email.trim()}`,
        type: 'success',
      });
      router.replace('/(tabs)');
    } else if (res.error) {
      showToast({
        title: 'Sign In Failed',
        message: res.error,
        type: 'error',
      });
    }
  };

  const handleDemoSignIn = () => {
    enterDemoMode();
    showToast({
      title: 'Demo Sandbox Active',
      message: 'Exploring KRONOS with offline demo data.',
      type: 'info',
    });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ResponsiveContainer maxWidth={460}>
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
              KRONOS
            </Text>
            <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
              Personal Life OS & Intelligent Command Center
            </Text>
          </View>

          {/* Supabase Status Pill */}
          <View style={styles.statusRow}>
            <Badge
              label={isSupabaseConfigured ? 'Supabase Connected' : 'Local Sandbox Mode (No API Keys)'}
              variant={isSupabaseConfigured ? 'primary' : 'neutral'}
              size="sm"
              icon={<ShieldCheck size={11} color={isSupabaseConfigured ? theme.primary : theme.textMuted} />}
            />
          </View>

          {/* Login Form */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Sign In
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
              label="Password"
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

            <View style={styles.forgotPasswordRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            <AppButton
              title="Sign In to Dashboard"
              onPress={handleSignIn}
              loading={isLoading}
              fullWidth
              size="lg"
              rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
              style={styles.signInBtn}
            />

            {/* Quick Demo Sandbox Access */}
            <AppButton
              title="Explore Demo Sandbox"
              onPress={handleDemoSignIn}
              variant="secondary"
              fullWidth
              size="md"
              style={styles.demoBtn}
            />
          </View>

          {/* Footer Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/signup')}>
              <Text style={[styles.signupLink, { color: theme.primary }]}>Sign Up</Text>
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
    justifyContent: 'center',
    padding: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: typography.letterSpacing.wide,
  },
  brandSubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  statusRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  signInBtn: {
    marginBottom: spacing.sm,
  },
  demoBtn: {
    marginTop: spacing.xs,
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
  signupLink: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
