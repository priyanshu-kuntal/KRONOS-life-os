import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, View, Text } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { radii, typography } from '../../constants/theme';

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'filled' | 'ghost' | 'outline' | 'primary';
  size?: number; // width/height
  badgeCount?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'default',
  size = 42,
  badgeCount,
  disabled = false,
  style,
}) => {
  const { theme } = useThemeStore();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: theme.surfaceElevated,
          borderWidth: 1,
          borderColor: theme.border,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.borderActive,
        };
      case 'primary':
        return {
          backgroundColor: theme.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'default':
      default:
        return {
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.borderSubtle,
        };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radii.md,
          opacity: disabled ? 0.4 : 1,
        },
        getVariantStyle(),
        style,
      ]}
    >
      {icon}
      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 40,
    minHeight: 40,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
});
