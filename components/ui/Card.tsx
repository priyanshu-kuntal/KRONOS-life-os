import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { radii, spacing, shadows } from '../../constants/theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'outlined' | 'glow';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: keyof typeof spacing | number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  onPress,
  padding = 'lg',
}) => {
  const { theme, isDark } = useThemeStore();

  const getCardStyle = (): ViewStyle => {
    const pad = typeof padding === 'number' ? padding : spacing[padding];

    let bg = theme.surface;
    let borderColor = theme.border;
    let elevationShadow = isDark ? shadows.none : shadows.sm;

    switch (variant) {
      case 'elevated':
        bg = theme.surfaceElevated;
        borderColor = theme.border;
        elevationShadow = shadows.sm;
        break;
      case 'subtle':
        bg = theme.surfaceSubtle;
        borderColor = theme.borderSubtle;
        break;
      case 'outlined':
        bg = 'transparent';
        borderColor = theme.border;
        break;
      case 'glow':
        bg = theme.surface;
        borderColor = theme.borderActive;
        elevationShadow = shadows.glow(theme.primary);
        break;
      case 'default':
      default:
        bg = theme.surface;
        borderColor = theme.border;
        break;
    }

    return {
      backgroundColor: bg,
      borderColor,
      borderWidth: 1,
      borderRadius: radii.xl,
      padding: pad,
      ...elevationShadow,
    };
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        style={[getCardStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
};
