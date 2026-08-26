import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { AppButton } from './AppButton';
import { radii, spacing, typography } from '../../constants/theme';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onActionPress,
  style,
}) => {
  const { theme } = useThemeStore();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surfaceSubtle,
          borderColor: theme.borderSubtle,
        },
        style,
      ]}
    >
      {icon && (
        <View style={[styles.iconWrapper, { backgroundColor: theme.surfaceElevated }]}>
          {icon}
        </View>
      )}

      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {description}
      </Text>

      {actionText && onActionPress && (
        <AppButton
          title={actionText}
          onPress={onActionPress}
          variant="secondary"
          size="sm"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    borderRadius: radii.xl,
    borderWidth: 1,
    marginVertical: spacing.md,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    maxWidth: 280,
  },
  button: {
    marginTop: spacing.lg,
  },
});
