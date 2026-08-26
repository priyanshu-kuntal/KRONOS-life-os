import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Clock,
  MapPin,
  Plus,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sparkles,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { DateSelector } from '../../components/ui/DateSelector';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { TaskEditModal } from '../../components/ui/TaskEditModal';
import { EventEditModal } from '../../components/ui/EventEditModal';
import { HabitDetailModal } from '../../components/ui/HabitDetailModal';
import { ResponsiveContainer } from '../../components/ui/ResponsiveContainer';
import { radii, spacing, typography } from '../../constants/theme';
import { formatDisplayDate } from '../../lib/formatters';
import { Task, Habit, EventItem } from '../../types/models';
import { CalendarViewMode, CalendarItem } from '../../features/calendar/calendarTypes';
import { buildDayCalendarItems } from '../../features/calendar/calendarBuilder';
import { getLocalDateString } from '../../features/tasks/taskUtils';

const TIMELINE_HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ScheduleScreen() {
  const { theme } = useThemeStore();
  const { user, isDemoMode } = useAuthStore();
  const {
    events,
    tasks,
    habits,
    selectedDate,
    setSelectedDate,
    setQuickActionOpen,
    toggleTask,
    toggleHabit,
    fetchData,
  } = useLifeOsStore();

  const [viewMode, setViewMode] = useState<CalendarViewMode>('day');
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);
  const [selectedEventToEdit, setSelectedEventToEdit] = useState<EventItem | null>(null);
  const [selectedHabitDetail, setSelectedHabitDetail] = useState<Habit | null>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  const userId = user?.id;
  const todayStr = getLocalDateString();
  const isSelectedDateToday = selectedDate === todayStr;

  useEffect(() => {
    fetchData(userId, isDemoMode);
  }, [userId, isDemoMode]);

  // Current time clock updater (every 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Build unified and overlap-resolved calendar items
  const calendarItems = useMemo(() => {
    return buildDayCalendarItems(selectedDate, events, tasks, habits);
  }, [selectedDate, events, tasks, habits]);

  const conflictsCount = calendarItems.filter((i) => i.hasConflict && i.type === 'event').length;

  const handleItemPress = (item: CalendarItem) => {
    if (item.type === 'event') {
      setSelectedEventToEdit(item.sourceData as EventItem);
    } else if (item.type === 'task') {
      setSelectedTaskToEdit(item.sourceData as Task);
    } else if (item.type === 'habit') {
      setSelectedHabitDetail(item.sourceData as Habit);
    }
  };

  const handleToggleItem = (item: CalendarItem) => {
    if (item.type === 'task') {
      toggleTask(item.sourceId);
    } else if (item.type === 'habit' && userId) {
      toggleHabit(userId, item.sourceId);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer maxWidth={1040}>
          {/* 1. TOP HEADER & VIEW MODE TOGGLE */}
          <View style={styles.topHeader}>
            <View>
              <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
                Scheduler
              </Text>
              <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
                {formatDisplayDate(new Date(selectedDate))}
              </Text>
            </View>

            <View style={styles.headerActions}>
              {/* Day / Week View Mode Pills */}
              <View
                style={[
                  styles.viewToggleGroup,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setViewMode('day')}
                  style={[
                    styles.viewToggleBtn,
                    viewMode === 'day' && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.viewToggleText,
                      { color: viewMode === 'day' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    Day
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setViewMode('week')}
                  style={[
                    styles.viewToggleBtn,
                    viewMode === 'week' && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.viewToggleText,
                      { color: viewMode === 'week' ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    Week
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setQuickActionOpen(true)}
                style={[
                  styles.addEventBtn,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                ]}
              >
                <Plus size={15} color={theme.primary} />
                <Text style={[styles.addEventText, { color: theme.primary }]}>Plan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. HORIZONTAL 7-DAY WEEK SELECTOR */}
          <DateSelector
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* Conflict Notification Banner if any */}
          {conflictsCount > 0 && (
            <View
              style={[
                styles.conflictBanner,
                { backgroundColor: `${theme.warning}14`, borderColor: `${theme.warning}40` },
              ]}
            >
              <AlertTriangle size={15} color={theme.warning} style={{ marginRight: 6 }} />
              <Text style={[styles.conflictBannerText, { color: theme.warning }]}>
                {conflictsCount} overlapping schedule blocks detected.
              </Text>
            </View>
          )}

          {/* 3. CALENDAR TIMELINE VIEW */}
          {calendarItems.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon size={24} color={theme.primary} />}
              title="No Plans for this Day"
              description="Keep your day structured by scheduling focus blocks, events, and tasks."
              actionText="+ Schedule Event"
              onActionPress={() => setQuickActionOpen(true)}
            />
          ) : (
            <View style={styles.timelineWrapper}>
              {/* CURRENT TIME INDICATOR (Visible when today is selected) */}
              {isSelectedDateToday && (
                <View
                  style={[
                    styles.currentTimeIndicator,
                    {
                      top: Math.round((currentTimeMinutes / 60) * 72) + 12,
                    },
                  ]}
                >
                  <View style={[styles.currentDot, { backgroundColor: theme.danger }]} />
                  <View style={[styles.currentLine, { backgroundColor: theme.danger }]} />
                </View>
              )}

              {/* TIMELINE HOURLY ROWS */}
              {TIMELINE_HOURS.map((hour) => {
                const hourLabel = `${String(hour).padStart(2, '0')}:00`;
                const hourItems = calendarItems.filter((item) => {
                  const itemHour = Math.floor(item.startMinutesFromMidnight / 60);
                  return itemHour === hour;
                });

                return (
                  <View key={hour} style={styles.hourRow}>
                    {/* Hour Label */}
                    <View style={styles.hourLabelCol}>
                      <Text style={[styles.hourLabelText, { color: theme.textMuted }]}>
                        {hourLabel}
                      </Text>
                    </View>

                    {/* Timeline Slot Content */}
                    <View style={[styles.hourGridLine, { borderColor: theme.borderSubtle }]}>
                      {hourItems.map((item) => {
                        const overlapTotal = item.overlapTotal || 1;
                        const overlapIdx = item.overlapIndex || 0;
                        const widthPercent = `${100 / overlapTotal}%`;

                        return (
                          <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.85}
                            onPress={() => handleItemPress(item)}
                            style={[
                              styles.calendarItemBlock,
                              {
                                backgroundColor: item.completed
                                  ? theme.surfaceElevated
                                  : theme.surface,
                                borderColor: item.hasConflict ? theme.warning : theme.border,
                                borderLeftWidth: 3.5,
                                borderLeftColor: item.color,
                                width: widthPercent as any,
                                opacity: item.completed ? 0.65 : 1,
                              },
                            ]}
                          >
                            <View style={styles.itemTopRow}>
                              <View style={styles.itemTypeBadge}>
                                {item.type === 'habit' && (
                                  <Flame size={11} color={item.color} style={{ marginRight: 3 }} />
                                )}
                                {item.type === 'task' && (
                                  <CheckCircle2 size={11} color={item.color} style={{ marginRight: 3 }} />
                                )}
                                <Text
                                  style={[
                                    styles.itemCategoryText,
                                    { color: item.color },
                                  ]}
                                >
                                  {item.category.toUpperCase()}
                                </Text>
                              </View>

                              <View style={styles.timeRangePill}>
                                <Clock size={10} color={theme.textMuted} style={{ marginRight: 2 }} />
                                <Text style={[styles.timeRangeText, { color: theme.textMuted }]}>
                                  {item.startTime} - {item.endTime}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.itemBodyRow}>
                              <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => handleToggleItem(item)}
                                disabled={item.type === 'event'}
                                style={[
                                  styles.checkboxCircle,
                                  {
                                    borderColor: item.completed ? theme.primary : theme.border,
                                    backgroundColor: item.completed ? theme.primary : 'transparent',
                                  },
                                ]}
                              >
                                {item.completed && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                              </TouchableOpacity>

                              <View style={styles.itemTitleCol}>
                                <Text
                                  style={[
                                    styles.itemTitleText,
                                    {
                                      color: theme.textPrimary,
                                      textDecorationLine: item.completed ? 'line-through' : 'none',
                                    },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {item.title}
                                </Text>

                                {item.location && (
                                  <View style={styles.itemLocRow}>
                                    <MapPin size={10} color={theme.textMuted} style={{ marginRight: 2 }} />
                                    <Text style={[styles.itemLocText, { color: theme.textMuted }]} numberOfLines={1}>
                                      {item.location}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
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

      {/* Habit Detail Modal */}
      <HabitDetailModal
        habit={selectedHabitDetail}
        visible={Boolean(selectedHabitDetail)}
        onClose={() => setSelectedHabitDetail(null)}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 2,
  },
  viewToggleBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  viewToggleText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },
  addEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  addEventText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginLeft: 3,
  },
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  conflictBannerText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
  },
  timelineWrapper: {
    position: 'relative',
    marginTop: spacing.md,
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 48,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
  },
  currentLine: {
    flex: 1,
    height: 1.5,
  },
  hourRow: {
    flexDirection: 'row',
    minHeight: 72,
  },
  hourLabelCol: {
    width: 48,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  hourLabelText: {
    fontSize: 10.5,
    fontWeight: typography.fontWeight.medium,
  },
  hourGridLine: {
    flex: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 4,
    paddingLeft: spacing.xs,
  },
  calendarItemBlock: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.xs,
    marginVertical: 2,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCategoryText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  timeRangePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 10,
  },
  itemBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  itemTitleCol: {
    flex: 1,
  },
  itemTitleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  itemLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  itemLocText: {
    fontSize: 10,
  },
});
