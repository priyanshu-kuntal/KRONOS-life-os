import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react-native';
import { useToastStore, ToastMessage } from '../../store/useToastStore';
import { useThemeStore } from '../../store/useThemeStore';
import { radii, spacing, typography, shadows } from '../../constants/theme';

export const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToastStore();
  const { theme } = useThemeStore();

  if (toasts.length === 0) return null;

  const renderIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} color={theme.success} />;
      case 'warning':
        return <AlertCircle size={20} color={theme.warning} />;
      case 'danger':
        return <XCircle size={20} color={theme.danger} />;
      case 'info':
      default:
        return <Info size={20} color={theme.info} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <View
            key={toast.id}
            style={[
              styles.toast,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.borderActive,
              },
            ]}
          >
            <View style={styles.iconContainer}>{renderIcon(toast.type)}</View>

            <View style={styles.textContainer}>
              {toast.title && (
                <Text style={[styles.title, { color: theme.textPrimary }]}>
                  {toast.title}
                </Text>
              )}
              <Text style={[styles.message, { color: theme.textSecondary }]}>
                {toast.message}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => hideToast(toast.id)}
              style={styles.closeBtn}
            >
              <X size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.lg,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  message: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  closeBtn: {
    padding: spacing.xxs,
    marginLeft: spacing.xs,
  },
});
