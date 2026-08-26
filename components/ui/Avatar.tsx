import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { radii, typography } from '../../constants/theme';

export interface AvatarProps {
  url?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  online?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  url,
  name = 'User',
  size = 'md',
  online,
  onPress,
  style,
}) => {
  const { theme } = useThemeStore();
  const [imageError, setImageError] = useState(false);

  const getDimension = (): number => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm':
        return 32;
      case 'lg':
        return 56;
      case 'xl':
        return 72;
      case 'md':
      default:
        return 44;
    }
  };

  const dim = getDimension();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const content = (
    <View
      style={[
        styles.container,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {url && !imageError ? (
        <Image
          source={{ uri: url }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
          onError={() => setImageError(true)}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              color: theme.primary,
              fontSize: dim * 0.4,
            },
          ]}
        >
          {initials}
        </Text>
      )}

      {online !== undefined && (
        <View
          style={[
            styles.onlineBadge,
            {
              backgroundColor: online ? theme.success : theme.textMuted,
              borderColor: theme.surface,
              width: Math.max(10, dim * 0.25),
              height: Math.max(10, dim * 0.25),
              borderRadius: Math.max(5, dim * 0.125),
            },
          ]}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  initials: {
    fontWeight: typography.fontWeight.bold,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
});
