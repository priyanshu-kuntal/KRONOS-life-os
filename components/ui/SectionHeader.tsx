import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { spacing, typography } from '../../constants/theme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badgeCount?: number | string;
  actionText?: string;
  onActionPress?: () => void;
  actionIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badgeCount,
  actionText,
  onActionPress,
  actionIcon,
  style,
}) => {
  const { theme } = useThemeStore();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleWrapper}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {title}
          </Text>
          {badgeCount !== undefined && (
            <View style={[styles.badge, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>
                {badgeCount}
              </Text>
            </View>
          )}
        </View>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {(actionText || actionIcon) && onActionPress && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onActionPress}
          style={styles.actionButton}
        >
          {actionText && (
            <Text style={[styles.actionText, { color: theme.primary }]}>
              {actionText}
            </Text>
          )}
          {actionIcon && <View style={styles.actionIcon}>{actionIcon}</View>}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  titleWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.normal,
  },
  badge: {
    marginLeft: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  actionIcon: {
    marginLeft: 4,
  },
});
