import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useThemeStore } from '../../store/useThemeStore';
import { typography } from '../../constants/theme';
import { clamp } from '../../lib/utils';

export interface CircularProgressProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showText?: boolean;
  centerText?: string;
  centerSubtext?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 10,
  color,
  trackColor,
  showText = true,
  centerText,
  centerSubtext,
  children,
  style,
}) => {
  const { theme } = useThemeStore();

  const activeColor = color || theme.primary;
  const activeTrackColor = trackColor || theme.border;

  const normalizedProgress = clamp(progress, 0, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Track Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={activeTrackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>

      <View style={styles.centerContainer}>
        {children ? (
          children
        ) : showText ? (
          <>
            <Text style={[styles.percentageText, { color: theme.textPrimary }]}>
              {centerText || `${Math.round(normalizedProgress)}%`}
            </Text>
            {centerSubtext && (
              <Text style={[styles.subtext, { color: theme.textMuted }]}>
                {centerSubtext}
              </Text>
            )}
          </>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: typography.letterSpacing.tight,
  },
  subtext: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
});
