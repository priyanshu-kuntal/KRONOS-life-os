import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { radii, typography, spacing } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { theme } = useThemeStore();

  const getContainerStyle = (): ViewStyle => {
    let bg: string = theme.primary;
    let borderColor: string = 'transparent';
    let borderWidth: number = 0;

    switch (variant) {
      case 'primary':
        bg = theme.primary;
        break;
      case 'secondary':
        bg = theme.surfaceElevated;
        borderColor = theme.border;
        borderWidth = 1;
        break;
      case 'outline':
        bg = 'transparent';
        borderColor = theme.borderActive;
        borderWidth = 1;
        break;
      case 'ghost':
        bg = 'transparent';
        break;
      case 'danger':
        bg = theme.danger;
        break;
      case 'success':
        bg = theme.success;
        break;
    }

    const sizePadding: ViewStyle =
      size === 'sm'
        ? { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radii.md }
        : size === 'lg'
        ? { paddingVertical: 16, paddingHorizontal: 24, borderRadius: radii.lg }
        : { paddingVertical: 12, paddingHorizontal: 18, borderRadius: radii.md };

    return {
      backgroundColor: bg,
      borderColor,
      borderWidth,
      opacity: disabled ? 0.45 : 1,
      width: fullWidth ? '100%' : undefined,
      ...sizePadding,
    };
  };

  const getTextStyle = (): TextStyle => {
    let color: string = '#FFFFFF';

    switch (variant) {
      case 'primary':
        color = '#FFFFFF';
        break;
      case 'secondary':
        color = theme.textPrimary;
        break;
      case 'outline':
        color = theme.textPrimary;
        break;
      case 'ghost':
        color = theme.primary;
        break;
      case 'danger':
      case 'success':
        color = '#FFFFFF';
        break;
    }

    const fontSize =
      size === 'sm'
        ? typography.fontSize.sm
        : size === 'lg'
        ? typography.fontSize.lg
        : typography.fontSize.base;

    return {
      color,
      fontSize,
      fontWeight: typography.fontWeight.semibold,
      letterSpacing: typography.letterSpacing.normal,
    };
  };

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'outline' ? theme.textPrimary : '#FFFFFF'}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // WCAG compliant touch target
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
});
