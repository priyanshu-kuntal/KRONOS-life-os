import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Navigation,
  Flame,
  Clock,
  Trophy,
  Plus,
  TrendingUp,
  Play,
  Zap,
  Radio,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { ActivityCard } from '../../components/ui/ActivityCard';
import { MetricCard } from '../../components/ui/MetricCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { radii, spacing, typography } from '../../constants/theme';
import { SportType, Activity } from '../../types/models';
import { formatDurationHuman } from '../../lib/formatters';

type SportFilter = 'all' | 'running' | 'cycling' | 'walking' | 'hiking';

export default function ActivityScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user, isDemoMode } = useAuthStore();
  const {
    activities,
    getWeeklyFitnessStats,
    setQuickActionOpen,
    fetchData,
  } = useLifeOsStore();
  const { width } = useWindowDimensions();

  const [activeFilter, setActiveFilter] = useState<SportFilter>('all');

  const userId = user?.id;

  useEffect(() => {
    fetchData(userId, isDemoMode);
  }, [userId, isDemoMode]);

  const stats = getWeeklyFitnessStats();
  const isWide = width >= 768;

  const filteredActivities = activities.filter((act) => {
    if (activeFilter === 'all') return true;
    return act.sportType === activeFilter;
  });

  const weeklyGoalKm = user?.weeklyDistanceGoalKm || 25.0;
  const goalProgressPct = Math.min(100, Math.round((stats.totalDistanceKm / weeklyGoalKm) * 100));

  const handleStartWorkout = () => {
    router.push('/workout/active' as any);
  };

  const handleSelectActivity = (activity: Activity) => {
    router.push(`/activity/${activity.id}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer maxWidth={1040}>
          {/* 1. TOP HEADER */}
          <View style={styles.topHeader}>
            <View>
              <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
                Fitness Telemetry
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
                Athletic metrics & GPS activity log
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setQuickActionOpen(true)}
              style={[
                styles.recordBtn,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle },
              ]}
            >
              <Plus size={15} color={theme.textPrimary} />
              <Text style={[styles.recordBtnText, { color: theme.textPrimary }]}>Quick Log</Text>
            </TouchableOpacity>
          </View>

          {/* 2. HERO "START WORKOUT" PRIMARY CTA BANNER */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleStartWorkout}
            style={[
              styles.heroBanner,
              {
                backgroundColor: theme.surface,
                borderColor: theme.primary,
              },
            ]}
          >
            <View style={styles.heroLeft}>
              <View style={[styles.pulseBadge, { backgroundColor: theme.primary + '25' }]}>
                <Radio size={12} color={theme.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.pulseText, { color: theme.primary }]}>
                  GPS ENGINE READY
                </Text>
              </View>

              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                Record Outdoor Session
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                High-frequency GPS breadcrumbs, pace analytics, and route maps.
              </Text>
            </View>

            <View style={[styles.startPill, { backgroundColor: theme.primary }]}>
              <Play size={18} color="#FFFFFF" style={{ marginLeft: 3 }} />
              <Text style={styles.startPillText}>START</Text>
            </View>
          </TouchableOpacity>

          {/* 3. WEEKLY SUMMARY STATS GRID */}
          <View style={isWide ? styles.statsRowWide : styles.statsGridMobile}>
            <MetricCard
              title="WEEKLY DISTANCE"
              value={stats.totalDistanceKm}
              unit="km"
              icon={<Navigation size={14} color={theme.secondary} />}
              subtitle={`${goalProgressPct}% of ${weeklyGoalKm}km goal`}
              accentColor={theme.secondary}
              style={styles.metricItem}
            />
            <MetricCard
              title="ACTIVE TIME"
              value={formatDurationHuman(stats.totalDurationSeconds)}
              icon={<Clock size={14} color={theme.primary} />}
              subtitle={`${stats.activitiesCount} sessions`}
              accentColor={theme.primary}
              style={styles.metricItem}
            />
            <MetricCard
              title="ENERGY BURN"
              value={stats.totalCalories.toLocaleString()}
              unit="kcal"
              icon={<Flame size={14} color={theme.warning} />}
              subtitle="Metabolic total"
              accentColor={theme.warning}
              style={styles.metricItem}
            />
            <MetricCard
              title="TARGET PACE"
              value="5:30"
              unit="/km"
              icon={<TrendingUp size={14} color={theme.success} />}
              subtitle="Zone 2 baseline"
              accentColor={theme.success}
              style={styles.metricItem}
            />
          </View>

          {/* 4. SPORT FILTER PILLS */}
          <SectionHeader
            title="Activity Feed"
            badgeCount={`${filteredActivities.length} recorded`}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {(['all', 'running', 'cycling', 'walking', 'hiking'] as SportFilter[]).map((f) => (
              <TouchableOpacity
                key={f}
                activeOpacity={0.75}
                onPress={() => setActiveFilter(f)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: activeFilter === f ? theme.primary : theme.surfaceElevated,
                    borderColor: activeFilter === f ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: activeFilter === f ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: activeFilter === f ? typography.fontWeight.bold : typography.fontWeight.medium,
                    },
                  ]}
                >
                  {f.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 5. ACTIVITY FEED CARDS */}
          {filteredActivities.length > 0 ? (
            filteredActivities.map((act) => (
              <ActivityCard
                key={act.id}
                activity={act}
                onPress={handleSelectActivity}
              />
            ))
          ) : (
            <EmptyState
              icon={<Trophy size={28} color={theme.primary} />}
              title="No Activities Recorded"
              description="Start a live GPS session or log your workout to track telemetry."
              actionText="Start GPS Workout"
              onActionPress={handleStartWorkout}
            />
          )}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pageTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.heavy,
  },
  pageSubtitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  recordBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginLeft: 4,
  },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radii['2xl'],
    borderWidth: 1.5,
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: '#4F8CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  heroLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  pulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginBottom: 6,
  },
  pulseText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: typography.letterSpacing.wider,
  },
  heroTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.heavy,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  startPill: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  startPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statsRowWide: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statsGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricItem: {
    minWidth: '47%',
    flex: 1,
  },
  filterScroll: {
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingVertical: spacing.xxs,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11,
  },
});
