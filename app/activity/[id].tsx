import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Flame,
  Clock,
  TrendingUp,
  Navigation,
  Trash2,
  Calendar,
  Zap,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { useToastStore } from '../../store/useToastStore';
import { activityService } from '../../features/activities/activityService';
import { RouteMap } from '../../components/ui/RouteMap';
import { MetricCard } from '../../components/ui/MetricCard';
import { Badge } from '../../components/ui/Badge';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { AppButton } from '../../components/ui/AppButton';
import { radii, spacing, typography } from '../../constants/theme';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatDisplayDate,
} from '../../lib/formatters';
import { Activity, ActivityPoint } from '../../types/models';

export default function ActivityDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { activities, deleteActivity } = useLifeOsStore();
  const { showToast } = useToastStore();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [gpsPoints, setGpsPoints] = useState<ActivityPoint[]>([]);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);

  // 1. Resolve activity from store or Supabase
  useEffect(() => {
    if (!id) return;
    const found = activities.find((a) => a.id === id);
    if (found) {
      setActivity(found);
    } else {
      activityService.getActivityById(id).then((res) => {
        if (res.data) setActivity(res.data);
      });
    }

    // 2. Fetch recorded GPS points for route replay
    setIsLoadingPoints(true);
    activityService
      .fetchActivityPoints(id)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setGpsPoints(res.data);
        }
      })
      .finally(() => {
        setIsLoadingPoints(false);
      });
  }, [id, activities]);

  const handleDelete = () => {
    const executeDelete = async () => {
      if (!activity) return;
      deleteActivity(activity.id);
      showToast({
        title: 'Activity Deleted',
        message: `Removed ${activity.title}.`,
        type: 'info',
      });
      router.replace('/(tabs)/activity');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this workout session permanently?')) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Delete Activity',
        'Are you sure you want to permanently delete this workout and its GPS telemetry?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: executeDelete },
        ]
      );
    }
  };

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerBox}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading workout telemetry...
          </Text>
        </View>
      </View>
    );
  }

  const sportAccent =
    activity.sportType === 'cycling'
      ? theme.fitnessCycle
      : activity.sportType === 'walking'
      ? theme.fitnessWalk
      : theme.fitnessRun;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer maxWidth={680}>
          {/* 1. TOP HEADER & BACK BUTTON */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle },
              ]}
            >
              <ChevronLeft size={20} color={theme.textPrimary} />
            </TouchableOpacity>

            <View style={styles.titleWrap}>
              <Badge
                label={activity.sportType.toUpperCase()}
                size="sm"
                variant={activity.sportType === 'running' ? 'info' : 'primary'}
              />
              <Text style={[styles.activityTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {activity.title}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDelete}
              style={[
                styles.deleteBtn,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle },
              ]}
            >
              <Trash2 size={18} color={theme.danger} />
            </TouchableOpacity>
          </View>

          {/* 2. DATE & DURATION SUBHEADER */}
          <View style={styles.dateRow}>
            <Calendar size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
            <Text style={[styles.dateText, { color: theme.textMuted }]}>
              {formatDisplayDate(activity.startedAt.split('T')[0])}
            </Text>
          </View>

          {/* 3. ROUTE MAP REPLAY OR FALLBACK */}
          <View style={styles.mapSection}>
            <RouteMap
              points={gpsPoints}
              sportType={activity.sportType}
              height={250}
            />
          </View>

          {/* 4. PRIMARY TELEMETRY GRID */}
          <View style={styles.metricsGrid}>
            <MetricCard
              title="DISTANCE"
              value={formatDistance(activity.distanceMeters).split(' ')[0]}
              unit="km"
              icon={<Navigation size={14} color={sportAccent} />}
              accentColor={sportAccent}
              style={styles.metricCard}
            />
            <MetricCard
              title="DURATION"
              value={formatDuration(activity.durationSeconds)}
              icon={<Clock size={14} color={theme.primary} />}
              subtitle={`Moving: ${formatDuration(activity.movingTimeSeconds || activity.durationSeconds)}`}
              accentColor={theme.primary}
              style={styles.metricCard}
            />
            <MetricCard
              title={activity.sportType === 'cycling' ? 'AVG SPEED' : 'AVG PACE'}
              value={formatPace(activity.avgSpeedMps, activity.sportType).split(' ')[0]}
              unit={activity.sportType === 'cycling' ? 'km/h' : '/km'}
              icon={<Zap size={14} color={theme.secondary} />}
              accentColor={theme.secondary}
              style={styles.metricCard}
            />
            <MetricCard
              title="ELEVATION GAIN"
              value={Math.round(activity.elevationGainMeters)}
              unit="m"
              icon={<TrendingUp size={14} color={theme.success} />}
              accentColor={theme.success}
              style={styles.metricCard}
            />
            <MetricCard
              title="ENERGY BURN"
              value={activity.calories}
              unit="kcal"
              icon={<Flame size={14} color={theme.warning} />}
              accentColor={theme.warning}
              style={styles.metricCard}
            />
            <MetricCard
              title="MAX SPEED"
              value={(activity.maxSpeedMps * 3.6).toFixed(1)}
              unit="km/h"
              icon={<TrendingUp size={14} color={theme.textPrimary} />}
              accentColor={theme.textPrimary}
              style={styles.metricCard}
            />
          </View>

          {/* 5. NOTES SECTION */}
          {activity.notes && (
            <View
              style={[
                styles.notesCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.notesHeader, { color: theme.textMuted }]}>
                SESSION NOTES
              </Text>
              <Text style={[styles.notesBody, { color: theme.textPrimary }]}>
                {activity.notes}
              </Text>
            </View>
          )}

          {/* 6. BOTTOM ACTION */}
          <View style={styles.bottomRow}>
            <AppButton
              title="Return to Activity Log"
              variant="outline"
              onPress={() => router.back()}
              size="md"
            />
          </View>
        </ResponsiveContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.xl,
    paddingBottom: 96,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  activityTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginTop: 4,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  mapSection: {
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    minWidth: '47%',
    flex: 1,
  },
  notesCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  notesHeader: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.widest,
    marginBottom: spacing.xs,
  },
  notesBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
  },
  bottomRow: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
});
