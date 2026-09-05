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
  Sparkles,
  Zap,
  Navigation,
  ArrowRight,
  Flame,
  Clock,
  CheckCircle2,
  Bell,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { useToastStore } from '../../store/useToastStore';
import { useAiStore } from '../../store/useAiStore';
import { Card } from '../../components/ui/Card';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { TaskCard } from '../../components/ui/TaskCard';
import { HabitCard } from '../../components/ui/HabitCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { EmptyState } from '../../components/ui/EmptyState';
import { TaskEditModal } from '../../components/ui/TaskEditModal';
import { EventEditModal } from '../../components/ui/EventEditModal';
import { HabitDetailModal } from '../../components/ui/HabitDetailModal';
import { ReminderEditModal } from '../../components/ui/ReminderEditModal';
import { MissionControlBriefingCard } from '../../components/ui/MissionControlBriefingCard';
import { radii, spacing, typography } from '../../constants/theme';
import { formatDisplayDate, getGreeting } from '../../lib/formatters';
import { Task, Habit, EventItem, Reminder } from '../../types/models';
import { getLocalDateString, sortTasks } from '../../features/tasks/taskUtils';
import { formatReminderDisplay, sortRemindersByTime } from '../../features/reminders/reminderUtils';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user, isDemoMode } = useAuthStore();
  const { width } = useWindowDimensions();
  const {
    tasks,
    habits,
    events,
    reminders,
    activities,
    aiInsights,
    fetchData,
    toggleTask,
    toggleHabit,
    getDailyTaskStats,
    getDailyHabitStats,
    dismissInsight,
    setQuickActionOpen,
  } = useLifeOsStore();
  const { showToast } = useToastStore();
  const { openChat, generateBriefing } = useAiStore();

  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);
  const [selectedEventToEdit, setSelectedEventToEdit] = useState<EventItem | null>(null);
  const [selectedHabitDetail, setSelectedHabitDetail] = useState<Habit | null>(null);
  const [selectedReminderToEdit, setSelectedReminderToEdit] = useState<Reminder | null>(null);

  const userId = user?.id;

  // Load user data on startup
  useEffect(() => {
    fetchData(userId, isDemoMode).then(() => {
      generateBriefing();
    });
  }, [userId, isDemoMode]);

  const greeting = getGreeting();
  const todayStr = getLocalDateString();
  const taskStats = getDailyTaskStats(todayStr);
  const habitStats = getDailyHabitStats();

  // Filter and sort today's tasks
  const todayTasks = sortTasks(
    tasks.filter((t) => !t.dueDate || t.dueDate === todayStr),
    todayStr
  );
  const previewTasks = todayTasks.slice(0, 3);
  const activeHabits = habits.filter((h) => !h.isArchived).slice(0, 3);
  const todayEvents = events.filter((e) => e.startTime.startsWith(todayStr) || e.isAllDay);
  const latestActivity = activities[0];
  const primaryInsight = aiInsights[0];

  // Resolve upcoming reminder
  const activeReminders = sortRemindersByTime(reminders.filter((r) => r.enabled && !r.isCompleted));
  const nextReminder = activeReminders[0];
  const reminderDisplay = nextReminder ? formatReminderDisplay(nextReminder.remindAt) : null;

  // Dynamic Today's Focus Resolution:
  // 1. High priority/urgent pending task
  // 2. Next upcoming event today
  // 3. Regular pending task
  // 4. Pending habit
  const urgentTask = todayTasks.find((t) => t.status !== 'completed' && (t.priority === 'urgent' || t.priority === 'high'));
  const nextEvent = todayEvents[0];
  const pendingTask = todayTasks.find((t) => t.status !== 'completed');
  const pendingHabit = activeHabits.find((h) => !h.completedToday);

  const focusItem = urgentTask
    ? { type: 'task' as const, data: urgentTask, title: urgentTask.title, desc: urgentTask.description, time: urgentTask.dueTime || 'High Priority', category: urgentTask.category, color: theme.danger }
    : nextEvent
    ? { type: 'event' as const, data: nextEvent, title: nextEvent.title, desc: nextEvent.description, time: new Date(nextEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), category: nextEvent.category, color: theme.primary }
    : pendingTask
    ? { type: 'task' as const, data: pendingTask, title: pendingTask.title, desc: pendingTask.description, time: pendingTask.dueTime || 'Today', category: pendingTask.category, color: theme.primary }
    : pendingHabit
    ? { type: 'habit' as const, data: pendingHabit, title: pendingHabit.title, desc: pendingHabit.description, time: 'Daily Habit', category: pendingHabit.category, color: theme.secondary }
    : null;

  const isWide = width >= 768;

  const handleInsightAction = () => {
    showToast({
      title: 'Schedule Adjusted',
      message: 'Evening run optimized for 6:30 PM.',
      type: 'success',
    });
    if (primaryInsight) {
      dismissInsight(primaryInsight.id);
    }
  };

  const handleToggleHabit = (habitId: string) => {
    if (userId) {
      toggleHabit(userId, habitId);
    }
  };

  const handleFocusItemPress = () => {
    if (!focusItem) return;
    if (focusItem.type === 'task') {
      setSelectedTaskToEdit(focusItem.data as Task);
    } else if (focusItem.type === 'event') {
      setSelectedEventToEdit(focusItem.data as EventItem);
    } else if (focusItem.type === 'habit') {
      setSelectedHabitDetail(focusItem.data as Habit);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer maxWidth={1040}>
          {/* 1. GREETING & AVATAR HEADER */}
          <View style={styles.greetingHeader}>
            <View style={styles.greetingTextCol}>
              <View style={styles.greetingRow}>
                <Text style={[styles.greetingSub, { color: theme.textSecondary }]}>
                  {greeting.greeting} {greeting.icon}
                </Text>
              </View>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>
                {user?.fullName || (isDemoMode ? 'Demo Explorer' : 'Life OS Member')}
              </Text>
              <Text style={[styles.dateLabel, { color: theme.textMuted }]}>
                {formatDisplayDate(new Date())}
              </Text>
            </View>

            <Avatar
              url={user?.avatarUrl}
              name={user?.fullName || 'User'}
              size={isWide ? 'xl' : 'lg'}
              online={!isDemoMode}
              onPress={() => router.push('/(tabs)/profile')}
            />
          </View>

          {/* Grid Layout for Tablet/Desktop, Stack for Mobile */}
          <View style={isWide ? styles.topGrid : undefined}>
            {/* 2. TODAY'S PROGRESS OVERVIEW */}
            <Card style={[styles.heroProgressCard, isWide && styles.gridCard]} padding="lg">
              <View style={styles.heroContentRow}>
                <CircularProgress
                  progress={taskStats.percentage}
                  size={isWide ? 116 : 100}
                  strokeWidth={9}
                  color={theme.primary}
                  trackColor={theme.surfaceHigherElevated}
                  centerText={`${taskStats.percentage}%`}
                  centerSubtext="DONE"
                />

                <View style={styles.heroMetricsCol}>
                  <View style={styles.heroMetricItem}>
                    <View style={styles.metricTitleRow}>
                      <CheckCircle2 size={14} color={theme.primary} style={styles.miniIcon} />
                      <Text style={[styles.heroMetricLabel, { color: theme.textMuted }]}>
                        TODAY'S TASKS
                      </Text>
                    </View>
                    <Text style={[styles.heroMetricValue, { color: theme.textPrimary }]}>
                      {taskStats.completed}/{taskStats.total}{' '}
                      <Text style={[styles.heroMetricSub, { color: theme.textSecondary }]}>
                        completed
                      </Text>
                    </Text>
                  </View>

                  <View style={[styles.heroDivider, { backgroundColor: theme.borderSubtle }]} />

                  <View style={styles.heroMetricItem}>
                    <View style={styles.metricTitleRow}>
                      <Flame size={14} color={theme.secondary} style={styles.miniIcon} />
                      <Text style={[styles.heroMetricLabel, { color: theme.textMuted }]}>
                        HABIT STREAK
                      </Text>
                    </View>
                    <Text style={[styles.heroMetricValue, { color: theme.textPrimary }]}>
                      {habitStats.completed}/{habitStats.total}{' '}
                      <Text style={[styles.heroMetricSub, { color: theme.textSecondary }]}>
                        active today
                      </Text>
                    </Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* 3. AI MISSION CONTROL BRIEFING */}
            <MissionControlBriefingCard
              style={isWide ? styles.gridCard : undefined}
              onOpenChat={openChat}
              onOptimizeSchedule={() => router.push('/(tabs)/schedule')}
            />
          </View>

          {/* 4. UPCOMING REMINDER NOTIFICATION STRIP (If active reminder exists) */}
          {nextReminder && reminderDisplay && (
            <Card
              style={styles.reminderCard}
              padding="sm"
              onPress={() => setSelectedReminderToEdit(nextReminder)}
            >
              <View style={styles.reminderRow}>
                <View style={[styles.reminderIconCircle, { backgroundColor: `${theme.warning}16` }]}>
                  <Bell size={13} color={theme.warning} />
                </View>
                <View style={styles.reminderInfo}>
                  <Text style={[styles.reminderLabel, { color: theme.warning }]}>
                    NEXT REMINDER • {reminderDisplay.timeStr} ({reminderDisplay.relativeLabel})
                  </Text>
                  <Text style={[styles.reminderTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {nextReminder.title}
                  </Text>
                </View>
                <Text style={[styles.reminderActionText, { color: theme.textMuted }]}>
                  Edit →
                </Text>
              </View>
            </Card>
          )}

          {/* 5. TODAY'S FOCUS HIGHLIGHT */}
          <SectionHeader
            title="Today's Focus"
            badgeCount={focusItem ? focusItem.category.toUpperCase() : 'CLEAR'}
          />
          {focusItem ? (
            <Card
              style={[
                styles.focusCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderLeftWidth: 3.5,
                  borderLeftColor: focusItem.color,
                },
              ]}
              padding="lg"
              onPress={handleFocusItemPress}
            >
              <View style={styles.focusHeader}>
                <View style={styles.focusTimeBadge}>
                  <Clock size={12} color={theme.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.focusTimeText, { color: theme.textSecondary }]}>
                    {focusItem.time}
                  </Text>
                </View>
                <Badge label={focusItem.category.toUpperCase()} variant="primary" size="sm" />
              </View>

              <Text style={[styles.focusTitle, { color: theme.textPrimary }]}>
                {focusItem.title}
              </Text>
              {focusItem.desc && (
                <Text style={[styles.focusDesc, { color: theme.textSecondary }]}>
                  {focusItem.desc}
                </Text>
              )}

              <View style={styles.focusFooter}>
                <View style={styles.focusEnergy}>
                  <Zap size={13} color={theme.primary} />
                  <Text style={[styles.focusEnergyText, { color: theme.textSecondary }]}>
                    Priority Focus Item
                  </Text>
                </View>
                <Text style={[styles.viewPlanText, { color: theme.textMuted }]}>
                  Details →
                </Text>
              </View>
            </Card>
          ) : (
            <Card style={styles.focusCard} padding="md">
              <Text style={[styles.focusTitle, { color: theme.textPrimary, fontSize: typography.fontSize.base }]}>
                All Key Objectives Clear
              </Text>
              <Text style={[styles.focusDesc, { color: theme.textSecondary }]}>
                You have no pending urgent items or scheduled conflicts today.
              </Text>
            </Card>
          )}

          {/* 6. FITNESS & ACTIVITY SNIPPET */}
          {latestActivity && (
            <>
              <SectionHeader
                title="Recent Activity"
                actionText="All"
                onActionPress={() => router.push('/(tabs)/activity')}
              />
              <Card style={styles.activitySnippetCard} padding="md" onPress={() => router.push('/(tabs)/activity')}>
                <View style={styles.actSnippetRow}>
                  <View style={[styles.actIconBox, { backgroundColor: `${theme.secondary}14` }]}>
                    <Navigation size={18} color={theme.secondary} />
                  </View>

                  <View style={styles.actSnippetDetails}>
                    <Text style={[styles.actSnippetTitle, { color: theme.textPrimary }]}>
                      {latestActivity.title}
                    </Text>
                    <Text style={[styles.actSnippetSub, { color: theme.textMuted }]}>
                      {(latestActivity.distanceMeters / 1000).toFixed(2)} km Running • 31m 42s
                    </Text>
                  </View>

                  <View style={styles.actBadgeCol}>
                    <Text style={[styles.actStatBig, { color: theme.textPrimary }]}>
                      5:50
                    </Text>
                    <Text style={[styles.actStatSub, { color: theme.textMuted }]}>
                      /km pace
                    </Text>
                  </View>
                </View>
              </Card>
            </>
          )}

          {/* 7. HABITS STRIP */}
          <SectionHeader
            title="Daily Habits"
            badgeCount={`${habitStats.completed}/${habitStats.total}`}
            actionText="+ New"
            onActionPress={() => setQuickActionOpen(true)}
          />
          {activeHabits.length > 0 ? (
            activeHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={handleToggleHabit}
                onPress={(h) => setSelectedHabitDetail(h)}
              />
            ))
          ) : (
            <EmptyState
              icon={<Flame size={24} color={theme.secondary} />}
              title="No Habits Yet"
              description="Build streaks and automate your daily routines."
              actionText="Add Habit"
              onActionPress={() => setQuickActionOpen(true)}
            />
          )}

          {/* 8. UPCOMING TASKS */}
          <SectionHeader
            title="Today's Tasks"
            badgeCount={taskStats.total}
            actionText="View Schedule"
            onActionPress={() => router.push('/(tabs)/schedule')}
          />
          {previewTasks.length > 0 ? (
            previewTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onPress={(t) => setSelectedTaskToEdit(t)}
              />
            ))
          ) : (
            <EmptyState
              icon={<CheckCircle2 size={24} color={theme.primary} />}
              title="No Tasks for Today"
              description="Plan your day and capture your next action item."
              actionText="Add Task"
              onActionPress={() => setQuickActionOpen(true)}
            />
          )}
        </ResponsiveContainer>
      </ScrollView>

      {/* Task Edit Modal */}
      <TaskEditModal
        task={selectedTaskToEdit}
        visible={Boolean(selectedTaskToEdit)}
        onClose={() => setSelectedTaskToEdit(null)}
      />

      {/* Event Edit Modal */}
      <EventEditModal
        event={selectedEventToEdit}
        visible={Boolean(selectedEventToEdit)}
        onClose={() => setSelectedEventToEdit(null)}
      />

      {/* Habit Details & History Modal */}
      <HabitDetailModal
        habit={selectedHabitDetail}
        visible={Boolean(selectedHabitDetail)}
        onClose={() => setSelectedHabitDetail(null)}
      />

      {/* Reminder Edit Modal */}
      <ReminderEditModal
        reminder={selectedReminderToEdit}
        visible={Boolean(selectedReminderToEdit)}
        onClose={() => setSelectedReminderToEdit(null)}
      />
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
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  greetingTextCol: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingSub: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  userName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.heavy,
    marginTop: 2,
  },
  dateLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: 2,
  },
  topGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  gridCard: {
    flex: 1,
    marginBottom: spacing.md,
  },
  heroProgressCard: {
    marginBottom: spacing.md,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetricsCol: {
    flex: 1,
    paddingLeft: spacing.lg,
  },
  heroMetricItem: {
    marginVertical: spacing.xxs,
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniIcon: {
    marginRight: 4,
  },
  heroMetricLabel: {
    fontSize: 10.5,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
  },
  heroMetricValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
    marginTop: 2,
  },
  heroMetricSub: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
  },
  heroDivider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  aiCard: {
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  aiBadgeLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.8,
  },
  aiConfidence: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  aiTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 3,
  },
  aiMessage: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  aiActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  aiActionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  reminderCard: {
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  reminderTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 1,
  },
  reminderActionText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },
  focusCard: {
    marginBottom: spacing.md,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  focusTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusTimeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  focusTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginTop: 4,
    marginBottom: 4,
  },
  focusDesc: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
  focusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  focusEnergy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  focusEnergyText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  viewPlanText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  activitySnippetCard: {
    marginBottom: spacing.md,
  },
  actSnippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actIconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actSnippetDetails: {
    flex: 1,
  },
  actSnippetTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  actSnippetSub: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  actBadgeCol: {
    alignItems: 'flex-end',
  },
  actStatBig: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.heavy,
  },
  actStatSub: {
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
  },
});
