import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Navigation,
  Flame,
  TrendingUp,
  Activity as ActivityIcon,
  Radio,
  Zap,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useWorkoutStore, GpsSignalStatus } from '../../store/useWorkoutStore';
import { radii, spacing, typography } from '../../constants/theme';
import { formatDuration } from '../../lib/formatters';

export const WorkoutHUD: React.FC = () => {
  const { theme } = useThemeStore();
  const {
    elapsedSeconds,
    distanceMeters,
    currentPaceDisplay,
    avgPaceDisplay,
    elevationGainMeters,
    calories,
    sportType,
    gpsStatus,
    status,
  } = useWorkoutStore();

  const distanceKm = (distanceMeters / 1000).toFixed(2);

  const getGpsBadgeConfig = (signal: GpsSignalStatus) => {
    switch (signal) {
      case 'connected':
        return { label: 'GPS LOCK', color: theme.success, icon: Radio };
      case 'simulated':
        return { label: 'DEMO GPS', color: theme.secondary, icon: Zap };
      case 'searching':
        return { label: 'SEARCHING...', color: theme.warning, icon: Radio };
      case 'paused':
        return { label: 'PAUSED', color: theme.textMuted, icon: Radio };
      case 'weak':
        return { label: 'WEAK GPS', color: theme.warning, icon: Radio };
      case 'error':
      default:
        return { label: 'NO GPS', color: theme.danger, icon: Radio };
    }
  };

  const gpsBadge = getGpsBadgeConfig(gpsStatus);
  const GpsIcon = gpsBadge.icon;

  return (
    <View style={[styles.hudContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* 1. TOP SIGNAL STATUS STRIP */}
      <View style={styles.topBar}>
        <View style={[styles.sportPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle }]}>
          <ActivityIcon size={12} color={theme.primary} style={{ marginRight: 5 }} />
          <Text style={[styles.sportText, { color: theme.textPrimary }]}>
            {sportType.toUpperCase()}
          </Text>
        </View>

        <View style={[styles.gpsBadge, { borderColor: gpsBadge.color + '40', backgroundColor: gpsBadge.color + '15' }]}>
          <GpsIcon size={11} color={gpsBadge.color} style={{ marginRight: 4 }} />
          <Text style={[styles.gpsBadgeText, { color: gpsBadge.color }]}>
            {gpsBadge.label}
          </Text>
        </View>
      </View>

      {/* 2. PRIMARY TIMER (MASSIVE HERO NUMERALS) */}
      <View style={styles.timerSection}>
        <Text style={[styles.timerLabel, { color: theme.textMuted }]}>ACTIVE DURATION</Text>
        <Text
          style={[
            styles.timerValue,
            { color: status === 'paused' ? theme.warning : theme.textPrimary },
          ]}
        >
          {formatDuration(elapsedSeconds)}
        </Text>
      </View>

      {/* 3. PRIMARY DISTANCE HERO */}
      <View style={styles.distanceSection}>
        <Text style={[styles.distanceLabel, { color: theme.textMuted }]}>TOTAL DISTANCE</Text>
        <View style={styles.distanceRow}>
          <Text style={[styles.distanceValue, { color: theme.textPrimary }]}>
            {distanceKm}
          </Text>
          <Text style={[styles.distanceUnit, { color: theme.secondary }]}> KM</Text>
        </View>
      </View>

      {/* 4. SECONDARY METRICS ROW (PACE, ELEVATION, CALORIES) */}
      <View style={styles.metricsGrid}>
        {/* Current Pace */}
        <View style={[styles.metricTile, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle }]}>
          <Text style={[styles.metricTileLabel, { color: theme.textMuted }]}>
            {sportType === 'cycling' ? 'SPEED' : 'PACE'}
          </Text>
          <Text style={[styles.metricTileValue, { color: theme.textPrimary }]}>
            {currentPaceDisplay}
          </Text>
          <Text style={[styles.metricTileSub, { color: theme.textSecondary }]}>
            {sportType === 'cycling' ? 'km/h' : '/km'}
          </Text>
        </View>

        {/* Average Pace */}
        <View style={[styles.metricTile, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle }]}>
          <Text style={[styles.metricTileLabel, { color: theme.textMuted }]}>AVG PACE</Text>
          <Text style={[styles.metricTileValue, { color: theme.textPrimary }]}>
            {avgPaceDisplay}
          </Text>
          <Text style={[styles.metricTileSub, { color: theme.textSecondary }]}>/km</Text>
        </View>

        {/* Elevation Gain */}
        <View style={[styles.metricTile, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle }]}>
          <View style={styles.iconRow}>
            <TrendingUp size={11} color={theme.textMuted} style={{ marginRight: 3 }} />
            <Text style={[styles.metricTileLabel, { color: theme.textMuted }]}>ELEV</Text>
          </View>
          <Text style={[styles.metricTileValue, { color: theme.textPrimary }]}>
            {elevationGainMeters}
          </Text>
          <Text style={[styles.metricTileSub, { color: theme.textSecondary }]}>meters</Text>
        </View>

        {/* Calories */}
        <View style={[styles.metricTile, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle }]}>
          <View style={styles.iconRow}>
            <Flame size={11} color={theme.textMuted} style={{ marginRight: 3 }} />
            <Text style={[styles.metricTileLabel, { color: theme.textMuted }]}>BURN</Text>
          </View>
          <Text style={[styles.metricTileValue, { color: theme.textPrimary }]}>
            {calories}
          </Text>
          <Text style={[styles.metricTileSub, { color: theme.textSecondary }]}>kcal</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hudContainer: {
    borderRadius: radii['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
    marginVertical: spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  sportText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  gpsBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timerLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: 2,
  },
  timerValue: {
    fontSize: 52,
    fontWeight: typography.fontWeight.heavy,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  distanceSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  distanceLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  distanceValue: {
    fontSize: 40,
    fontWeight: typography.fontWeight.heavy,
    fontVariant: ['tabular-nums'],
  },
  distanceUnit: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  metricTile: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricTileLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: 2,
  },
  metricTileValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.heavy,
    fontVariant: ['tabular-nums'],
  },
  metricTileSub: {
    fontSize: 9,
    fontWeight: typography.fontWeight.medium,
    marginTop: 1,
  },
});
