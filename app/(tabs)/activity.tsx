import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  Navigation,
  Flame,
  Clock,
  Trophy,
  Plus,
  TrendingUp,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { ActivityCard } from '../../components/ui/ActivityCard';
import { MetricCard } from '../../components/ui/MetricCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { radii, spacing, typography } from '../../constants/theme';
import { SportType } from '../../types/models';
import { formatDurationHuman } from '../../lib/formatters';

type SportFilter = 'all' | 'running' | 'cycling' | 'walking';

export default function ActivityScreen() {
  const { theme } = useThemeStore();
  const { activities, getWeeklyFitnessStats, setQuickActionOpen } = useLifeOsStore();
  const { width } = useWindowDimensions();

  const [activeFilter, setActiveFilter] = useState<SportFilter>('all');

  const stats = getWeeklyFitnessStats();
  const isWide = width >= 768;

  const filteredActivities = activities.filter((act) => {
    if (activeFilter === 'all') return true;
    return act.sportType === activeFilter;
  });

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
                Athletic metrics & activity log
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setQuickActionOpen(true)}
              style={[
                styles.recordBtn,
                { backgroundColor: theme.primary },
              ]}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.recordBtnText}>Log</Text>
            </TouchableOpacity>
          </View>

          {/* 2. WEEKLY SUMMARY STATS GRID */}
          <View style={isWide ? styles.statsRowWide : styles.statsGridMobile}>
            <MetricCard
              title="WEEKLY DISTANCE"
              value={stats.totalDistanceKm}
              unit="km"
              icon={<Navigation size={14} color={theme.secondary} />}
              trend={{ value: '+18%', isPositive: true }}
              accentColor={theme.secondary}
              style={styles.metricItem}
            />
            <MetricCard
              title="ACTIVE TIME"
              value={formatDurationHuman(stats.totalDurationSeconds)}
              icon={<Clock size={14} color={theme.primary} />}
              subtitle="4 sessions"
              accentColor={theme.primary}
              style={styles.metricItem}
            />
            <MetricCard
              title="ENERGY BURN"
              value={stats.totalCalories.toLocaleString()}
              unit="kcal"
              icon={<Flame size={14} color={theme.textSecondary} />}
              subtitle="Metabolic total"
              accentColor={theme.textPrimary}
              style={styles.metricItem}
            />
            <MetricCard
              title="TARGET PACE"
              value="5:42"
              unit="/km"
              icon={<TrendingUp size={14} color={theme.success} />}
              subtitle="Zone 2 baseline"
              accentColor={theme.success}
              style={styles.metricItem}
            />
          </View>

          {/* 3. SPORT FILTER PILLS */}
          <SectionHeader
            title="Activity Feed"
            badgeCount={`${filteredActivities.length} total`}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {(['all', 'running', 'cycling', 'walking'] as SportFilter[]).map((f) => (
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

          {/* 4. ACTIVITY FEED CARDS */}
          {filteredActivities.length > 0 ? (
            filteredActivities.map((act) => (
              <ActivityCard key={act.id} activity={act} />
            ))
          ) : (
            <EmptyState
              icon={<Trophy size={26} color={theme.primary} />}
              title="No Activities Found"
              description="Log your workout to start tracking athletic telemetry."
              actionText="Log Activity"
              onActionPress={() => setQuickActionOpen(true)}
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
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginLeft: 4,
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
  },
  filterScroll: {
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingVertical: spacing.xxs,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11,
  },
});
