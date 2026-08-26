import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { radii, spacing, typography } from '../../constants/theme';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'habit'
  | 'ai'
  | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
  style,
  textStyle,
}) => {
  const { theme } = useThemeStore();

  const getVariantStyles = (): { bg: string; text: string; border: string } => {
    switch (variant) {
      case 'primary':
        return { bg: theme.primaryAlpha, text: theme.primary, border: `${theme.primary}33` };
      case 'secondary':
        return { bg: theme.secondaryAlpha, text: theme.secondary, border: `${theme.secondary}33` };
      case 'success':
        return { bg: theme.successAlpha, text: theme.success, border: `${theme.success}33` };
      case 'warning':
        return { bg: theme.warningAlpha, text: theme.warning, border: `${theme.warning}33` };
      case 'danger':
        return { bg: theme.dangerAlpha, text: theme.danger, border: `${theme.danger}33` };
      case 'info':
        return { bg: theme.infoAlpha, text: theme.info, border: `${theme.info}33` };
      case 'habit':
        return { bg: theme.habitStreakAlpha, text: theme.habitStreak, border: `${theme.habitStreak}33` };
      case 'ai':
        return { bg: theme.aiIntelligenceAlpha, text: theme.aiIntelligence, border: `${theme.aiIntelligence}33` };
      case 'neutral':
      default:
        return { bg: theme.surfaceElevated, text: theme.textSecondary, border: theme.border };
    }
  };

  const { bg, text, border } = getVariantStyles();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderColor: border,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? 6 : 10,
          borderRadius: radii.full,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text
        style={[
          styles.text,
          {
            color: text,
            fontSize: isSm ? typography.fontSize.xs : typography.fontSize.sm,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  iconWrapper: {
    marginRight: spacing.xs,
  },
  text: {
    fontWeight: typography.fontWeight.semibold,
  },
});
