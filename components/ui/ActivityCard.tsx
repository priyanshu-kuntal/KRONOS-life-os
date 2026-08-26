import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Flame, Heart, TrendingUp, Navigation } from 'lucide-react-native';
import { Activity } from '../../types/models';
import { useThemeStore } from '../../store/useThemeStore';
import { Card } from './Card';
import { Badge } from './Badge';
import { radii, spacing, typography } from '../../constants/theme';
import { formatDistance, formatDuration, formatPace, formatShortDate } from '../../lib/formatters';

export interface ActivityCardProps {
  activity: Activity;
  onPress?: (activity: Activity) => void;
  style?: StyleProp<ViewStyle>;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onPress,
  style,
}) => {
  const { theme } = useThemeStore();

  const getSportAccent = (): string => {
    switch (activity.sportType) {
      case 'cycling':
        return theme.fitnessCycle; // Blue #4F8CFF
      case 'walking':
        return theme.fitnessWalk; // Emerald #34D399
      case 'running':
      default:
        return theme.fitnessRun; // Cyan #38BDF8
    }
  };

  const sportColor = getSportAccent();

  return (
    <Card
      style={[styles.card, style]}
      padding="lg"
      onPress={onPress ? () => onPress(activity) : undefined}
    >
      {/* Top Bar: Sport Pill + Date */}
      <View style={styles.topRow}>
        <Badge
          label={activity.sportType.toUpperCase()}
          variant={activity.sportType === 'running' ? 'info' : activity.sportType === 'cycling' ? 'primary' : 'success'}
          size="sm"
          icon={<Navigation size={11} color={sportColor} />}
        />
        <Text style={[styles.dateText, { color: theme.textMuted }]}>
          {formatShortDate(activity.startedAt)}
        </Text>
      </View>

      {/* Activity Title */}
      <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
        {activity.title}
      </Text>

      {/* Primary Metrics Grid (Typography-First Strava Clarity) */}
      <View style={styles.metricsGrid}>
        {/* Distance */}
        <View style={styles.metricCol}>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>DISTANCE</Text>
          <View style={styles.metricValRow}>
            <Text style={[styles.primaryMetricVal, { color: theme.textPrimary }]}>
              {formatDistance(activity.distanceMeters).split(' ')[0]}
            </Text>
            <Text style={[styles.primaryMetricUnit, { color: sportColor }]}>
              {' '}km
            </Text>
          </View>
        </View>

        {/* Duration */}
        <View style={styles.metricCol}>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>TIME</Text>
          <Text style={[styles.primaryMetricVal, { color: theme.textPrimary }]}>
            {formatDuration(activity.durationSeconds)}
          </Text>
        </View>

        {/* Avg Pace */}
        <View style={styles.metricCol}>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>AVG PACE</Text>
          <Text style={[styles.primaryMetricVal, { color: theme.textPrimary }]}>
            {formatPace(activity.avgSpeedMps, activity.sportType).split(' ')[0]}
          </Text>
          <Text style={[styles.paceSubUnit, { color: theme.textMuted }]}>
            {activity.sportType === 'cycling' ? 'km/h' : '/km'}
          </Text>
        </View>
      </View>

      {/* Mini Route/Elevation Restrained Graphic */}
      <View style={[styles.sparklineCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle }]}>
        <Svg width="100%" height="40" viewBox="0 0 300 40">
          <Defs>
            <SvgGradient id={`grad-${activity.id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={sportColor} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={sportColor} stopOpacity="0.0" />
            </SvgGradient>
          </Defs>
          <Path
            d="M0,28 Q40,10 80,20 T160,8 T240,24 T300,14 L300,40 L0,40 Z"
            fill={`url(#grad-${activity.id})`}
          />
          <Path
            d="M0,28 Q40,10 80,20 T160,8 T240,24 T300,14"
            fill="none"
            stroke={sportColor}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </Svg>
      </View>

      {/* Secondary Metrics Strip */}
      <View style={styles.secondaryStrip}>
        {activity.avgHeartRate && (
          <View style={styles.secondaryItem}>
            <Heart size={12} color={theme.textMuted} style={styles.secIcon} />
            <Text style={[styles.secText, { color: theme.textSecondary }]}>
              {activity.avgHeartRate} bpm
            </Text>
          </View>
        )}

        <View style={styles.secondaryItem}>
          <Flame size={12} color={theme.textMuted} style={styles.secIcon} />
          <Text style={[styles.secText, { color: theme.textSecondary }]}>
            {activity.calories} kcal
          </Text>
        </View>

        {activity.elevationGainMeters > 0 && (
          <View style={styles.secondaryItem}>
            <TrendingUp size={12} color={theme.textMuted} style={styles.secIcon} />
            <Text style={[styles.secText, { color: theme.textSecondary }]}>
              {Math.round(activity.elevationGainMeters)} m
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: 2,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  primaryMetricVal: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: typography.letterSpacing.tight,
  },
  primaryMetricUnit: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  paceSubUnit: {
    fontSize: typography.fontSize.xs,
  },
  sparklineCard: {
    height: 40,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  secondaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    paddingTop: spacing.xxs,
  },
  secondaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secIcon: {
    marginRight: 4,
  },
  secText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
