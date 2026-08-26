import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { radii } from '../../constants/theme';
import { clamp } from '../../lib/utils';

export interface ProgressBarProps {
  progress: number; // 0 to 1 or 0 to 100
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color,
  backgroundColor,
  style,
}) => {
  const { theme } = useThemeStore();

  // Normalize progress to 0-100%
  const normalizedProgress = progress <= 1 && progress > 0 ? progress * 100 : clamp(progress, 0, 100);
  const activeColor = color || theme.primary;
  const trackColor = backgroundColor || theme.border;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: trackColor,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${normalizedProgress}%`,
            height,
            borderRadius: height / 2,
            backgroundColor: activeColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
