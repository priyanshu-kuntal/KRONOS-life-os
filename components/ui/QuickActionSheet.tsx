import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  CheckSquare,
  Calendar,
  Sparkles,
  Target,
  Activity as ActivityIcon,
  MapPin,
} from 'lucide-react-native';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { useThemeStore } from '../../store/useThemeStore';
import { BottomSheet } from './BottomSheet';
import { Input } from './Input';
import { AppButton } from './AppButton';
import { radii, spacing, typography } from '../../constants/theme';
import { Priority, SportType, HabitFrequency } from '../../types/models';
import { TaskCategory } from '../../features/tasks/taskTypes';
import { HabitCategory } from '../../features/habits/habitTypes';
import { EventCategory, EVENT_CATEGORIES, EVENT_CATEGORY_COLORS } from '../../features/events/eventTypes';
import { GoalCategory, GOAL_CATEGORIES, GOAL_CATEGORY_COLORS } from '../../features/goals/goalTypes';
import { getLocalDateString } from '../../features/tasks/taskUtils';

type ActionTab = 'task' | 'habit' | 'event' | 'goal' | 'workout';

const TASK_CATEGORIES: TaskCategory[] = ['Work', 'Study', 'Personal', 'Fitness', 'Health', 'Other'];
const HABIT_CATEGORIES: HabitCategory[] = ['Health', 'Productivity', 'Mindset', 'Fitness', 'Learning', 'Other'];
const FREQUENCIES: { label: string; value: HabitFrequency; days: number }[] = [
  { label: 'Daily (7d)', value: 'daily', days: 7 },
  { label: 'Weekdays (5d)', value: 'daily', days: 5 },
  { label: 'Weekly (1d)', value: 'weekly', days: 1 },
];

export const QuickActionSheet: React.FC = () => {
  const { isQuickActionOpen, setQuickActionOpen, addTask, addHabit, addEvent, addGoal, addActivity } = useLifeOsStore();
  const { user, isDemoMode } = useAuthStore();
  const { showToast } = useToastStore();
  const { theme } = useThemeStore();

  const [activeTab, setActiveTab] = useState<ActionTab>('task');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('Work');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskDueDate, setTaskDueDate] = useState(getLocalDateString());
  const [taskDueTime, setTaskDueTime] = useState('17:00');
  const [taskMinutes, setTaskMinutes] = useState('30');

  // Habit form state
  const [habitTitle, setHabitTitle] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [habitCategory, setHabitCategory] = useState<HabitCategory>('Health');
  const [habitFrequency, setHabitFrequency] = useState<HabitFrequency>('daily');
  const [habitDaysPerWeek, setHabitDaysPerWeek] = useState(7);

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCategory, setEventCategory] = useState<EventCategory>('Work');
  const [eventDate, setEventDate] = useState(getLocalDateString());
  const [eventStartTime, setEventStartTime] = useState('17:00');
  const [eventEndTime, setEventEndTime] = useState('18:00');
  const [eventLocation, setEventLocation] = useState('');

  // Goal form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('Fitness');
  const [goalTargetValue, setGoalTargetValue] = useState('100');
  const [goalCurrentValue, setGoalCurrentValue] = useState('0');
  const [goalUnit, setGoalUnit] = useState('km');
  const [goalStartDate, setGoalStartDate] = useState(getLocalDateString());
  const [goalTargetDate, setGoalTargetDate] = useState('');

  // Workout form state
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutSport, setWorkoutSport] = useState<SportType>('running');
  const [workoutDistanceKm, setWorkoutDistanceKm] = useState('5.0');
  const [workoutDurationMins, setWorkoutDurationMins] = useState('30');

  const userId = user?.id || (isDemoMode ? 'demo-user-001' : 'guest-user');

  const handleClose = () => {
    setQuickActionOpen(false);
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      showToast({
        title: 'Title Required',
        message: 'Please provide a title for your task.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await addTask(userId, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        dueDate: taskDueDate.trim() || getLocalDateString(),
        dueTime: taskDueTime.trim() || undefined,
        priority: taskPriority,
        category: taskCategory,
        estimatedMinutes: parseInt(taskMinutes, 10) || 30,
      });

      if (res.success) {
        showToast({
          title: 'Task Created',
          message: `"${taskTitle.trim()}" added to your tasks.`,
          type: 'success',
        });
        setTaskTitle('');
        setTaskDescription('');
        handleClose();
      } else {
        showToast({
          title: 'Failed to Create Task',
          message: res.error || 'Could not save task.',
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateHabit = async () => {
    if (!habitTitle.trim()) {
      showToast({
        title: 'Name Required',
        message: 'Please provide a habit name.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await addHabit(userId, {
        title: habitTitle.trim(),
        description: habitDescription.trim() || undefined,
        category: habitCategory,
        targetDaysPerWeek: habitDaysPerWeek,
        frequency: habitFrequency,
        color: theme.secondary,
        icon: 'sparkles',
      });

      if (res.success) {
        showToast({
          title: 'Habit Created',
          message: `Started tracking streak for "${habitTitle.trim()}".`,
          type: 'success',
        });
        setHabitTitle('');
        setHabitDescription('');
        handleClose();
      } else {
        showToast({
          title: 'Failed to Create Habit',
          message: res.error || 'Could not save habit.',
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      showToast({
        title: 'Title Required',
        message: 'Please provide an event title.',
        type: 'warning',
      });
      return;
    }

    if (eventStartTime >= eventEndTime) {
      showToast({
        title: 'Invalid Time Range',
        message: 'End time must be after start time.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const startIso = `${eventDate}T${eventStartTime}:00.000Z`;
      const endIso = `${eventDate}T${eventEndTime}:00.000Z`;

      const res = await addEvent(userId, {
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        category: eventCategory,
        startTime: startIso,
        endTime: endIso,
        isAllDay: false,
        location: eventLocation.trim() || undefined,
        color: EVENT_CATEGORY_COLORS[eventCategory] || '#4F8CFF',
      });

      if (res.success) {
        showToast({
          title: 'Event Scheduled',
          message: `Scheduled "${eventTitle.trim()}" for ${eventStartTime}.`,
          type: 'success',
        });
        setEventTitle('');
        setEventDescription('');
        setEventLocation('');
        handleClose();
      } else {
        showToast({
          title: 'Failed to Schedule Event',
          message: res.error || 'Could not schedule event.',
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!goalTitle.trim()) {
      showToast({
        title: 'Title Required',
        message: 'Please provide a goal title.',
        type: 'warning',
      });
      return;
    }

    const targetVal = parseFloat(goalTargetValue);
    if (isNaN(targetVal) || targetVal <= 0) {
      showToast({
        title: 'Invalid Target',
        message: 'Target value must be a positive number.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await addGoal(userId, {
        title: goalTitle.trim(),
        description: goalDescription.trim() || undefined,
        category: goalCategory,
        targetValue: targetVal,
        currentValue: parseFloat(goalCurrentValue) || 0,
        unit: goalUnit.trim() || '%',
        startDate: goalStartDate.trim() || undefined,
        targetDate: goalTargetDate.trim() || undefined,
        status: 'active',
      });

      if (res.success) {
        showToast({
          title: 'Goal Established',
          message: `Now tracking "${goalTitle.trim()}".`,
          type: 'success',
        });
        setGoalTitle('');
        setGoalDescription('');
        handleClose();
      } else {
        showToast({
          title: 'Failed to Create Goal',
          message: res.error || 'Could not create goal.',
          type: 'error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWorkout = () => {
    if (!workoutTitle.trim()) return;
    const distKm = parseFloat(workoutDistanceKm) || 5;
    const durMins = parseInt(workoutDurationMins, 10) || 30;
    const durSecs = durMins * 60;
    const distMeters = distKm * 1000;
    const speedMps = distMeters / durSecs;

    addActivity({
      userId,
      title: workoutTitle.trim(),
      sportType: workoutSport,
      distanceMeters: distMeters,
      durationSeconds: durSecs,
      movingTimeSeconds: durSecs - 60,
      avgSpeedMps: speedMps,
      maxSpeedMps: speedMps * 1.25,
      calories: Math.round(distKm * 75),
      elevationGainMeters: 45,
      startedAt: new Date().toISOString(),
    });
    setWorkoutTitle('');
    handleClose();
    showToast({
      title: 'Activity Logged',
      message: `Recorded ${workoutTitle} (${distKm} km in ${durMins}m).`,
      type: 'success',
    });
  };

  return (
    <BottomSheet
      visible={isQuickActionOpen}
      onClose={handleClose}
      title="Quick Action"
      subtitle="Log or schedule into your personal Life OS"
    >
      {/* Action Type Selector Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('task')}
          style={[
            styles.tabItem,
            {
              backgroundColor: activeTab === 'task' ? theme.primary : theme.surfaceElevated,
              borderColor: activeTab === 'task' ? theme.primary : theme.border,
            },
          ]}
        >
          <CheckSquare size={14} color={activeTab === 'task' ? '#FFFFFF' : theme.textSecondary} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'task' ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            Task
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('habit')}
          style={[
            styles.tabItem,
            {
              backgroundColor: activeTab === 'habit' ? theme.primary : theme.surfaceElevated,
              borderColor: activeTab === 'habit' ? theme.primary : theme.border,
            },
          ]}
        >
          <Sparkles size={14} color={activeTab === 'habit' ? '#FFFFFF' : theme.textSecondary} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'habit' ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            Habit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('event')}
          style={[
            styles.tabItem,
            {
              backgroundColor: activeTab === 'event' ? theme.primary : theme.surfaceElevated,
              borderColor: activeTab === 'event' ? theme.primary : theme.border,
            },
          ]}
        >
          <Calendar size={14} color={activeTab === 'event' ? '#FFFFFF' : theme.textSecondary} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'event' ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            Event
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('goal')}
          style={[
            styles.tabItem,
            {
              backgroundColor: activeTab === 'goal' ? theme.primary : theme.surfaceElevated,
              borderColor: activeTab === 'goal' ? theme.primary : theme.border,
            },
          ]}
        >
          <Target size={14} color={activeTab === 'goal' ? '#FFFFFF' : theme.textSecondary} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'goal' ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            Goal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('workout')}
          style={[
            styles.tabItem,
            {
              backgroundColor: activeTab === 'workout' ? theme.primary : theme.surfaceElevated,
              borderColor: activeTab === 'workout' ? theme.primary : theme.border,
            },
          ]}
        >
          <ActivityIcon size={14} color={activeTab === 'workout' ? '#FFFFFF' : theme.textSecondary} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'workout' ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            Workout
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.formContainer}>
        {/* TASK FORM */}
        {activeTab === 'task' && (
          <View>
            <Input
              label="Task Title"
              placeholder="e.g. Implement Supabase RLS policies"
              value={taskTitle}
              onChangeText={setTaskTitle}
              autoFocus
            />

            <Input
              label="Description (Optional)"
              placeholder="e.g. Ensure user_id matches auth.uid()"
              value={taskDescription}
              onChangeText={setTaskDescription}
              multiline
              numberOfLines={2}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              PRIORITY
            </Text>
            <View style={styles.pillRow}>
              {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.75}
                  onPress={() => setTaskPriority(p)}
                  style={[
                    styles.priorityPill,
                    {
                      backgroundColor: taskPriority === p ? theme.primary : theme.surfaceElevated,
                      borderColor: taskPriority === p ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: taskPriority === p ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              CATEGORY
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {TASK_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.75}
                  onPress={() => setTaskCategory(cat)}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: taskCategory === cat ? theme.primary : theme.surfaceElevated,
                      borderColor: taskCategory === cat ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catText,
                      { color: taskCategory === cat ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.inlineRow}>
              <View style={{ flex: 1, marginRight: spacing.xs }}>
                <Input
                  label="Due Date"
                  placeholder="YYYY-MM-DD"
                  value={taskDueDate}
                  onChangeText={setTaskDueDate}
                />
              </View>
              <View style={{ width: 100, marginRight: spacing.xs }}>
                <Input
                  label="Due Time"
                  placeholder="17:00"
                  value={taskDueTime}
                  onChangeText={setTaskDueTime}
                />
              </View>
              <View style={{ width: 90 }}>
                <Input
                  label="Est. Min"
                  placeholder="30"
                  keyboardType="numeric"
                  value={taskMinutes}
                  onChangeText={setTaskMinutes}
                />
              </View>
            </View>

            <AppButton
              title="Add Task to Plan"
              onPress={handleCreateTask}
              loading={isSubmitting}
              disabled={!taskTitle.trim()}
              fullWidth
              style={styles.submitBtn}
            />
          </View>
        )}

        {/* HABIT FORM */}
        {activeTab === 'habit' && (
          <View>
            <Input
              label="Habit Name"
              placeholder="e.g. 10m Morning Breathwork & Meditation"
              value={habitTitle}
              onChangeText={setHabitTitle}
              autoFocus
            />

            <Input
              label="Description (Optional)"
              placeholder="e.g. 4-7-8 deep breathing right after waking up"
              value={habitDescription}
              onChangeText={setHabitDescription}
              multiline
              numberOfLines={2}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              CATEGORY
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {HABIT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.75}
                  onPress={() => setHabitCategory(cat)}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: habitCategory === cat ? theme.primary : theme.surfaceElevated,
                      borderColor: habitCategory === cat ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catText,
                      { color: habitCategory === cat ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              FREQUENCY & TARGET
            </Text>
            <View style={styles.pillRow}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f.label}
                  activeOpacity={0.75}
                  onPress={() => {
                    setHabitFrequency(f.value);
                    setHabitDaysPerWeek(f.days);
                  }}
                  style={[
                    styles.priorityPill,
                    {
                      backgroundColor: habitDaysPerWeek === f.days ? theme.primary : theme.surfaceElevated,
                      borderColor: habitDaysPerWeek === f.days ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: habitDaysPerWeek === f.days ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <AppButton
              title="Start Habit Streak"
              onPress={handleCreateHabit}
              loading={isSubmitting}
              disabled={!habitTitle.trim()}
              variant="primary"
              fullWidth
              style={styles.submitBtn}
            />
          </View>
        )}

        {/* EVENT FORM */}
        {activeTab === 'event' && (
          <View>
            <Input
              label="Event Title"
              placeholder="e.g. Product Architecture Review"
              value={eventTitle}
              onChangeText={setEventTitle}
              autoFocus
            />

            <Input
              label="Description (Optional)"
              placeholder="e.g. Review database schema and API endpoints"
              value={eventDescription}
              onChangeText={setEventDescription}
              multiline
              numberOfLines={2}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              CATEGORY
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {EVENT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.75}
                  onPress={() => setEventCategory(cat)}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: eventCategory === cat ? EVENT_CATEGORY_COLORS[cat] : theme.surfaceElevated,
                      borderColor: eventCategory === cat ? EVENT_CATEGORY_COLORS[cat] : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catText,
                      { color: eventCategory === cat ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.inlineRow}>
              <View style={{ flex: 1.2, marginRight: spacing.xs }}>
                <Input
                  label="Date"
                  placeholder="YYYY-MM-DD"
                  value={eventDate}
                  onChangeText={setEventDate}
                />
              </View>
              <View style={{ flex: 1, marginRight: spacing.xs }}>
                <Input
                  label="Start Time"
                  placeholder="17:00"
                  value={eventStartTime}
                  onChangeText={setEventStartTime}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="End Time"
                  placeholder="18:00"
                  value={eventEndTime}
                  onChangeText={setEventEndTime}
                />
              </View>
            </View>

            <Input
              label="Location / Link"
              placeholder="e.g. Meeting Room 3 or Zoom link"
              value={eventLocation}
              onChangeText={setEventLocation}
              leftIcon={<MapPin size={16} color={theme.textMuted} />}
            />

            <AppButton
              title="Schedule Event"
              onPress={handleCreateEvent}
              loading={isSubmitting}
              disabled={!eventTitle.trim()}
              variant="primary"
              fullWidth
              style={styles.submitBtn}
            />
          </View>
        )}

        {/* GOAL FORM */}
        {activeTab === 'goal' && (
          <View>
            <Input
              label="Goal Title"
              placeholder="e.g. Run 100 km"
              value={goalTitle}
              onChangeText={setGoalTitle}
              autoFocus
            />

            <Input
              label="Description (Optional)"
              placeholder="e.g. Monthly running milestone"
              value={goalDescription}
              onChangeText={setGoalDescription}
              multiline
              numberOfLines={2}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              CATEGORY
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {GOAL_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.75}
                  onPress={() => setGoalCategory(cat)}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: goalCategory === cat ? GOAL_CATEGORY_COLORS[cat] : theme.surfaceElevated,
                      borderColor: goalCategory === cat ? GOAL_CATEGORY_COLORS[cat] : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catText,
                      { color: goalCategory === cat ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.inlineRow}>
              <View style={{ flex: 1, marginRight: spacing.xs }}>
                <Input
                  label="Target Value"
                  placeholder="100"
                  keyboardType="numeric"
                  value={goalTargetValue}
                  onChangeText={setGoalTargetValue}
                />
              </View>
              <View style={{ flex: 1, marginRight: spacing.xs }}>
                <Input
                  label="Current Value"
                  placeholder="0"
                  keyboardType="numeric"
                  value={goalCurrentValue}
                  onChangeText={setGoalCurrentValue}
                />
              </View>
              <View style={{ width: 80 }}>
                <Input
                  label="Unit"
                  placeholder="km"
                  value={goalUnit}
                  onChangeText={setGoalUnit}
                />
              </View>
            </View>

            <View style={styles.inlineRow}>
              <View style={{ flex: 1, marginRight: spacing.xs }}>
                <Input
                  label="Start Date"
                  placeholder="YYYY-MM-DD"
                  value={goalStartDate}
                  onChangeText={setGoalStartDate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Target Deadline"
                  placeholder="YYYY-MM-DD"
                  value={goalTargetDate}
                  onChangeText={setGoalTargetDate}
                />
              </View>
            </View>

            <AppButton
              title="Establish Goal"
              onPress={handleCreateGoal}
              loading={isSubmitting}
              disabled={!goalTitle.trim()}
              variant="primary"
              fullWidth
              style={styles.submitBtn}
            />
          </View>
        )}

        {/* WORKOUT FORM */}
        {activeTab === 'workout' && (
          <View>
            <Input
              label="Workout Title"
              placeholder="e.g. Zone 2 Endurance Run"
              value={workoutTitle}
              onChangeText={setWorkoutTitle}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              ACTIVITY TYPE
            </Text>
            <View style={styles.pillRow}>
              {(['running', 'cycling', 'walking'] as SportType[]).map((sport) => (
                <TouchableOpacity
                  key={sport}
                  activeOpacity={0.75}
                  onPress={() => setWorkoutSport(sport)}
                  style={[
                    styles.priorityPill,
                    {
                      backgroundColor: workoutSport === sport ? theme.primary : theme.surfaceElevated,
                      borderColor: workoutSport === sport ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: workoutSport === sport ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {sport.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inlineRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Input
                  label="Distance (km)"
                  placeholder="5.0"
                  keyboardType="numeric"
                  value={workoutDistanceKm}
                  onChangeText={setWorkoutDistanceKm}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Duration (mins)"
                  placeholder="30"
                  keyboardType="numeric"
                  value={workoutDurationMins}
                  onChangeText={setWorkoutDurationMins}
                />
              </View>
            </View>

            <AppButton
              title="Log Activity"
              onPress={handleCreateWorkout}
              disabled={!workoutTitle.trim()}
              variant="primary"
              fullWidth
              style={styles.submitBtn}
            />

            <Text style={[styles.workoutNotice, { color: theme.textMuted }]}>
              Real-time GPS tracking & Strava synchronization will be enabled in Phase 3.
            </Text>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  tabScroll: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  formContainer: {
    paddingVertical: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  priorityPill: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  catPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  catText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },
  inlineRow: {
    flexDirection: 'row',
  },
  submitBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  workoutNotice: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
});
