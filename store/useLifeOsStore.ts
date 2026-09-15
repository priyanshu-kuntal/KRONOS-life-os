import { create } from 'zustand';
import {
  Task,
  Habit,
  EventItem,
  Activity,
  Goal,
  Reminder,
  AIInsight,
  TaskStatus,
  GoalStatus,
} from '../types/models';
import {
  mockTasks,
  mockHabits,
  mockEvents,
  mockActivities,
  mockGoals,
  mockAIInsights,
} from '../constants/mockData';
import { generateId } from '../lib/utils';
import { taskService } from '../features/tasks/taskService';
import { CreateTaskInput, UpdateTaskInput } from '../features/tasks/taskTypes';
import { getLocalDateString } from '../features/tasks/taskUtils';
import { habitService } from '../features/habits/habitService';
import { CreateHabitInput, UpdateHabitInput } from '../features/habits/habitTypes';
import { formatLocalDate } from '../features/habits/streakUtils';
import { eventService } from '../features/events/eventService';
import { CreateEventInput, UpdateEventInput } from '../features/events/eventTypes';
import { goalService } from '../features/goals/goalService';
import { CreateGoalInput, UpdateGoalInput } from '../features/goals/goalTypes';
import { calculateGoalStatus } from '../features/goals/goalUtils';
import { reminderService } from '../features/reminders/reminderService';
import { CreateReminderInput, UpdateReminderInput } from '../features/reminders/reminderTypes';
import { activityService } from '../features/activities/activityService';

const mockInitialReminders: Reminder[] = [
  {
    id: 'rem-mock-1',
    userId: 'demo-user-001',
    title: 'Review System Architecture PRs',
    remindAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    isCompleted: false,
    enabled: true,
    priority: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rem-mock-2',
    userId: 'demo-user-001',
    title: 'Evening Hydration & Mobility Session',
    remindAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    isCompleted: false,
    enabled: true,
    priority: 'medium',
    createdAt: new Date().toISOString(),
  },
];

interface LifeOsState {
  tasks: Task[];
  habits: Habit[];
  events: EventItem[];
  activities: Activity[];
  goals: Goal[];
  reminders: Reminder[];
  aiInsights: AIInsight[];
  selectedDate: string; // YYYY-MM-DD
  isQuickActionOpen: boolean;
  isLoadingTasks: boolean;
  isLoadingHabits: boolean;
  isLoadingEvents: boolean;
  isLoadingGoals: boolean;
  isLoadingReminders: boolean;
  isLoadingActivities: boolean;

  // Actions
  setSelectedDate: (date: string) => void;
  setQuickActionOpen: (isOpen: boolean) => void;
  fetchData: (userId?: string, isDemoMode?: boolean) => Promise<void>;

  // Task actions
  addTask: (userId: string, task: CreateTaskInput) => Promise<{ success: boolean; error?: string }>;
  updateTask: (taskId: string, updates: UpdateTaskInput) => Promise<{ success: boolean; error?: string }>;
  toggleTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;

  // Habit actions
  addHabit: (userId: string, habit: CreateHabitInput) => Promise<{ success: boolean; error?: string }>;
  updateHabit: (habitId: string, updates: UpdateHabitInput) => Promise<{ success: boolean; error?: string }>;
  toggleHabit: (userId: string, habitId: string) => Promise<{ success: boolean; error?: string }>;
  deleteHabit: (habitId: string) => Promise<{ success: boolean; error?: string }>;

  // Event actions
  addEvent: (userId: string, event: CreateEventInput) => Promise<{ success: boolean; error?: string }>;
  updateEvent: (eventId: string, updates: UpdateEventInput) => Promise<{ success: boolean; error?: string }>;
  deleteEvent: (eventId: string) => Promise<{ success: boolean; error?: string }>;

  // Goal actions
  addGoal: (userId: string, goal: CreateGoalInput) => Promise<{ success: boolean; error?: string }>;
  updateGoal: (goalId: string, updates: UpdateGoalInput) => Promise<{ success: boolean; error?: string }>;
  updateGoalProgress: (goalId: string, deltaOrValue: number, isDelta?: boolean) => Promise<{ success: boolean; error?: string }>;
  deleteGoal: (goalId: string) => Promise<{ success: boolean; error?: string }>;

  // Reminder actions
  addReminder: (userId: string, reminder: CreateReminderInput) => Promise<{ success: boolean; error?: string }>;
  updateReminder: (reminderId: string, updates: UpdateReminderInput) => Promise<{ success: boolean; error?: string }>;
  toggleReminder: (reminderId: string) => Promise<{ success: boolean; error?: string }>;
  deleteReminder: (reminderId: string) => Promise<{ success: boolean; error?: string }>;

  // Activity actions
  addActivity: (activity: Omit<Activity, 'id' | 'startedAt'> & { id?: string; startedAt?: string }) => void;
  deleteActivity: (activityId: string) => Promise<{ success: boolean; error?: string }>;

  // AI actions
  dismissInsight: (insightId: string) => void;

  // Computed metrics
  getDailyTaskStats: (customDate?: string) => { total: number; completed: number; percentage: number };
  getDailyHabitStats: () => { total: number; completed: number; percentage: number };
  getWeeklyFitnessStats: () => { totalDistanceKm: number; totalDurationSeconds: number; totalCalories: number; activitiesCount: number };
  getActiveGoalsStats: () => { total: number; completed: number; active: number; avgPercentage: number };
}

export const useLifeOsStore = create<LifeOsState>((set, get) => ({
  tasks: mockTasks,
  habits: mockHabits,
  events: mockEvents,
  activities: mockActivities,
  goals: mockGoals as Goal[],
  reminders: mockInitialReminders,
  aiInsights: mockAIInsights,
  selectedDate: getLocalDateString(new Date()),
  isQuickActionOpen: false,
  isLoadingTasks: false,
  isLoadingHabits: false,
  isLoadingEvents: false,
  isLoadingGoals: false,
  isLoadingReminders: false,
  isLoadingActivities: false,

  setSelectedDate: (date: string) => set({ selectedDate: date }),
  setQuickActionOpen: (isOpen: boolean) => set({ isQuickActionOpen: isOpen }),

  fetchData: async (userId?: string, isDemoMode?: boolean) => {
    if (isDemoMode || !userId) {
      set({
        tasks: mockTasks,
        habits: mockHabits,
        events: mockEvents,
        activities: mockActivities,
        goals: mockGoals as Goal[],
        reminders: mockInitialReminders,
        isLoadingTasks: false,
        isLoadingHabits: false,
        isLoadingEvents: false,
        isLoadingGoals: false,
        isLoadingReminders: false,
        isLoadingActivities: false,
      });
      return;
    }

    try {
      set({
        isLoadingTasks: true,
        isLoadingHabits: true,
        isLoadingEvents: true,
        isLoadingGoals: true,
        isLoadingReminders: true,
        isLoadingActivities: true,
      });

      const [tasksRes, habitsRes, eventsRes, goalsRes, remindersRes, activitiesRes] = await Promise.all([
        taskService.fetchTasks(userId),
        habitService.fetchHabits(userId),
        eventService.fetchEvents(userId),
        goalService.fetchGoals(userId),
        reminderService.fetchReminders(userId),
        activityService.fetchActivities(userId),
      ]);

      set({
        tasks: tasksRes.data || [],
        habits: habitsRes.data || [],
        events: eventsRes.data || [],
        goals: goalsRes.data || [],
        reminders: remindersRes.data || [],
        activities: activitiesRes.data && activitiesRes.data.length > 0 ? activitiesRes.data : mockActivities,
        isLoadingTasks: false,
        isLoadingHabits: false,
        isLoadingEvents: false,
        isLoadingGoals: false,
        isLoadingReminders: false,
        isLoadingActivities: false,
      });
    } catch (err) {
      console.warn('Error in useLifeOsStore.fetchData:', err);
      set({
        isLoadingTasks: false,
        isLoadingHabits: false,
        isLoadingEvents: false,
        isLoadingGoals: false,
        isLoadingReminders: false,
        isLoadingActivities: false,
      });
    }
  },

  addTask: async (userId: string, input: CreateTaskInput) => {
    const tempId = `temp-${Date.now()}`;
    const dueDate = input.dueDate || getLocalDateString();
    const priority = input.priority || 'medium';
    const category = input.category || 'Work';

    const optimisticTask: Task = {
      id: tempId,
      userId,
      goalId: input.goalId,
      title: input.title,
      description: input.description,
      dueDate,
      dueTime: input.dueTime,
      priority,
      status: 'pending',
      category,
      estimatedMinutes: input.estimatedMinutes || 30,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ tasks: [optimisticTask, ...state.tasks] }));

    const res = await taskService.createTask(userId, input);
    if (res.data) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === tempId ? res.data! : t)),
      }));
      return { success: true };
    } else {
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== tempId) }));
      return { success: false, error: res.error || 'Failed to create task' };
    }
  },

  updateTask: async (taskId: string, updates: UpdateTaskInput) => {
    const previousTasks = get().tasks;
    const targetTask = previousTasks.find((t) => t.id === taskId);
    if (!targetTask) return { success: false, error: 'Task not found' };

    const updatedTask: Task = {
      ...targetTask,
      ...updates,
      title: updates.title !== undefined ? updates.title : targetTask.title,
      description: updates.description !== undefined ? updates.description : targetTask.description,
      dueDate: updates.dueDate !== undefined ? updates.dueDate : targetTask.dueDate,
      dueTime: updates.dueTime !== undefined ? updates.dueTime : targetTask.dueTime,
      priority: updates.priority !== undefined ? updates.priority : targetTask.priority,
      category: updates.category !== undefined ? updates.category : targetTask.category,
      estimatedMinutes: updates.estimatedMinutes !== undefined ? updates.estimatedMinutes : targetTask.estimatedMinutes,
      status: updates.status !== undefined ? updates.status : targetTask.status,
    };

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    }));

    const res = await taskService.updateTask(taskId, updates);
    if (res.error) {
      set({ tasks: previousTasks });
      return { success: false, error: res.error };
    }

    if (res.data) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? res.data! : t)),
      }));
    }
    return { success: true };
  },

  toggleTask: async (taskId: string) => {
    const previousTasks = get().tasks;
    const task = previousTasks.find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found' };

    const isNowCompleted = task.status !== 'completed';
    const newStatus: TaskStatus = isNowCompleted ? 'completed' : 'pending';

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completedAt: isNowCompleted ? new Date().toISOString() : undefined,
            }
          : t
      ),
    }));

    const res = await taskService.toggleTask(taskId, task.status);
    if (res.error) {
      set({ tasks: previousTasks });
      return { success: false, error: res.error };
    }
    return { success: true };
  },

  deleteTask: async (taskId: string) => {
    const previousTasks = get().tasks;
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));

    const res = await taskService.deleteTask(taskId);
    if (!res.success) {
      set({ tasks: previousTasks });
      return { success: false, error: res.error };
    }
    return { success: true };
  },

  addHabit: async (userId: string, input: CreateHabitInput) => {
    const tempId = `temp-hab-${Date.now()}`;
    const optimisticHabit: Habit = {
      id: tempId,
      userId,
      goalId: input.goalId,
      title: input.title,
      description: input.description,
      category: input.category,
      targetDaysPerWeek: input.targetDaysPerWeek,
      frequency: input.frequency,
      color: input.color || '#38BDF8',
      icon: input.icon || 'sparkles',
      currentStreak: 0,
      bestStreak: 0,
      isArchived: false,
      completedToday: false,
    };

    set((state) => ({ habits: [...state.habits, optimisticHabit] }));

    const res = await habitService.createHabit(userId, input);
    if (res.data) {
      set((state) => ({
        habits: state.habits.map((h) => (h.id === tempId ? res.data! : h)),
      }));
      return { success: true };
    } else {
      set((state) => ({ habits: state.habits.filter((h) => h.id !== tempId) }));
      return { success: false, error: res.error || 'Failed to create habit' };
    }
  },

  updateHabit: async (habitId: string, updates: UpdateHabitInput) => {
    const res = await habitService.updateHabit(habitId, updates);
    if (res.data) {
      set((state) => ({
        habits: state.habits.map((h) => (h.id === habitId ? res.data! : h)),
      }));
      return { success: true };
    } else {
      return { success: false, error: res.error };
    }
  },

  toggleHabit: async (userId: string, habitId: string) => {
    const previousHabits = get().habits;
    const habit = previousHabits.find((h) => h.id === habitId);
    if (!habit) return { success: false, error: 'Habit not found' };

    const completedToday = !habit.completedToday;
    const currentStreak = completedToday
      ? habit.currentStreak + 1
      : Math.max(0, habit.currentStreak - 1);

    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId
          ? {
              ...h,
              completedToday,
              currentStreak,
              bestStreak: Math.max(h.bestStreak, currentStreak),
            }
          : h
      ),
    }));

    const res = await habitService.toggleHabitLog(
      userId,
      habitId,
      formatLocalDate(),
      habit.completedToday
    );

    if (res.error) {
      set({ habits: previousHabits });
      return { success: false, error: res.error };
    }
    return { success: true };
  },

  deleteHabit: async (habitId: string) => {
    const previousHabits = get().habits;
    set((state) => ({ habits: state.habits.filter((h) => h.id !== habitId) }));

    const res = await habitService.deleteHabit(habitId);
    if (!res.success) {
      set({ habits: previousHabits });
      return { success: false, error: res.error };
    }
    return { success: true };
  },

  addEvent: async (userId: string, input: CreateEventInput) => {
    const tempId = `temp-evt-${Date.now()}`;
    const optimisticEvent: EventItem = {
      id: tempId,
      userId,
      title: input.title,
      description: input.description,
      startTime: input.startTime,
      endTime: input.endTime,
      isAllDay: Boolean(input.isAllDay),
      location: input.location,
      color: input.color || '#4F8CFF',
      category: input.category,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ events: [optimisticEvent, ...state.events] }));

    const res = await eventService.createEvent(userId, input);
    if (res.data) {
      set((state) => ({
        events: state.events.map((e) => (e.id === tempId ? res.data! : e)),
      }));
      return { success: true };
    } else {
      set((state) => ({ events: state.events.filter((e) => e.id !== tempId) }));
      return { success: false, error: res.error || 'Failed to create event' };
    }
  },

  updateEvent: async (eventId: string, updates: UpdateEventInput) => {
    const previousEvents = get().events;
    const targetEvent = previousEvents.find((e) => e.id === eventId);
    if (!targetEvent) return { success: false, error: 'Event not found' };

    const updatedEvent: EventItem = {
      ...targetEvent,
      ...updates,
      title: updates.title !== undefined ? updates.title : targetEvent.title,
      description: updates.description !== undefined ? updates.description : targetEvent.description,
      startTime: updates.startTime !== undefined ? updates.startTime : targetEvent.startTime,
      endTime: updates.endTime !== undefined ? updates.endTime : targetEvent.endTime,
      isAllDay: updates.isAllDay !== undefined ? updates.isAllDay : targetEvent.isAllDay,
      location: updates.location !== undefined ? updates.location : targetEvent.location,
      color: updates.color !== undefined ? updates.color : targetEvent.color,
      category: updates.category !== undefined ? updates.category : targetEvent.category,
    };

    set((state) => ({
      events: state.events.map((e) => (e.id === eventId ? updatedEvent : e)),
    }));

    const res = await eventService.updateEvent(eventId, updates);
    if (res.error) {
      set({ events: previousEvents });
      return { success: false, error: res.error };
    }

    if (res.data) {
      set((state) => ({
        events: state.events.map((e) => (e.id === eventId ? res.data! : e)),
      }));
    }
    return { success: true };
  },

  deleteEvent: async (eventId: string) => {
    const previousEvents = get().events;
    set((state) => ({ events: state.events.filter((e) => e.id !== eventId) }));

    const res = await eventService.deleteEvent(eventId);
    if (!res.success) {
      set({ events: previousEvents });
      return { success: false, error: res.error };
    }
    return { success: true };
  },

  addGoal: async (userId: string, input: CreateGoalInput) => {
    const tempId = `temp-goal-${Date.now()}`;
    const targetVal = input.targetValue || 100;
    const currentVal = input.currentValue || 0;
    const optimisticGoal: Goal = {
      id: tempId,
      userId,
      title: input.title,
      description: input.description,
      category: input.category,
      targetValue: targetVal,
      currentValue: currentVal,
      unit: input.unit || '%',
      startDate: input.startDate,
      targetDate: input.targetDate,
      deadline: input.targetDate,
      status: input.status || calculateGoalStatus(currentVal, targetVal),
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ goals: [optimisticGoal, ...state.goals] }));

    const res = await goalService.createGoal(userId, input);
    if (res.data) {
      set((state) => ({
        goals: state.goals.map((g) => (g.id === tempId ? res.data! : g)),
      }));
      return { success: true };
    } else {
      set((state) => ({ goals: state.goals.filter((g) => g.id !== tempId) }));
      return { success: false, error: res.error || 'Failed to create goal' };
    }
  },

  updateGoal: async (goalId: string, updates: UpdateGoalInput) => {
    const previousGoals = get().goals;
    const targetGoal = previousGoals.find((g) => g.id === goalId);
    if (!targetGoal) return { success: false, error: 'Goal not found' };

    const updatedGoal: Goal = {
      ...targetGoal,
      ...updates,
      title: updates.title !== undefined ? updates.title : targetGoal.title,
      description: updates.description !== undefined ? updates.description : targetGoal.description,
      category: updates.category !== undefined ? updates.category : targetGoal.category,
      targetValue: updates.targetValue !== undefined ? updates.targetValue : targetGoal.targetValue,
      currentValue: updates.currentValue !== undefined ? updates.currentValue : targetGoal.currentValue,
      unit: updates.unit !== undefined ? updates.unit : targetGoal.unit,
      startDate: updates.startDate !== undefined ? updates.startDate : targetGoal.startDate,
      targetDate: updates.targetDate !== undefined ? updates.targetDate : targetGoal.targetDate,
      deadline: updates.targetDate !== undefined ? updates.targetDate : targetGoal.deadline,
      status: updates.status !== undefined ? updates.status : targetGoal.status,
    };

    set((state) => ({
      goals: state.goals.map((g) => (g.id === goalId ? updatedGoal : g)),
    }));

    const res = await goalService.updateGoal(goalId, updates);
    if (res.error) {
      set({ goals: previousGoals });
      return { success: false, error: res.error };
    }

    if (res.data) {
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? res.data! : g)),
      }));
    }
    return { success: true };
  },

  updateGoalProgress: async (goalId: string, deltaOrValue: number, isDelta = true) => {
    const previousGoals = get().goals;
    const targetGoal = previousGoals.find((g) => g.id === goalId);
    if (!targetGoal) return { success: false, error: 'Goal not found' };

    const newVal = Math.max(0, isDelta ? targetGoal.currentValue + deltaOrValue : deltaOrValue);
    const newStatus = calculateGoalStatus(newVal, targetGoal.targetValue, targetGoal.status);

    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              currentValue: newVal,
              status: newStatus,
            }
          : g
      ),
    }));

    const res = await goalService.updateGoalProgress(goalId, deltaOrValue, isDelta);
    if (res.error) {
      set({ goals: previousGoals });
      return { success: false, error: res.error };
    }
    return { success: true };
  },

  deleteGoal: async (goalId: string) => {
    const previousGoals = get().goals;
    set((state) => ({ goals: state.goals.filter((g) => g.id !== goalId) }));

    const res = await goalService.deleteGoal(goalId);
    if (!res.success) {
      set({ goals: previousGoals });
      return { success: false, error: res.error };
    }
    return { success: true };
  },

  addReminder: async (userId: string, input: CreateReminderInput) => {
    const tempId = `temp-rem-${Date.now()}`;
    const optimisticRem: Reminder = {
      id: tempId,
      userId,
      title: input.title,
      taskId: input.taskId,
      eventId: input.eventId,
      habitId: input.habitId,
      goalId: input.goalId,
      remindAt: input.remindAt,
      isCompleted: false,
      enabled: input.enabled !== undefined ? input.enabled : true,
      priority: input.priority || 'medium',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({ reminders: [optimisticRem, ...state.reminders] }));

    const res = await reminderService.createReminder(userId, input);
    if (res.data) {
      set((state) => ({
        reminders: state.reminders.map((r) => (r.id === tempId ? res.data! : r)),
      }));
      return { success: true };
    } else {
      set((state) => ({ reminders: state.reminders.filter((r) => r.id !== tempId) }));
      return { success: false, error: res.error || 'Failed to create reminder' };
    }
  },

  updateReminder: async (reminderId: string, updates: UpdateReminderInput) => {
    const previousReminders = get().reminders;
    const targetRem = previousReminders.find((r) => r.id === reminderId);
    if (!targetRem) return { success: false, error: 'Reminder not found' };

    const updatedRem: Reminder = {
      ...targetRem,
      ...updates,
      title: updates.title !== undefined ? updates.title : targetRem.title,
      remindAt: updates.remindAt !== undefined ? updates.remindAt : targetRem.remindAt,
      isCompleted: updates.isCompleted !== undefined ? updates.isCompleted : targetRem.isCompleted,
      enabled: updates.enabled !== undefined ? updates.enabled : targetRem.enabled,
      priority: updates.priority !== undefined ? updates.priority : targetRem.priority,
    };

    set((state) => ({
      reminders: state.reminders.map((r) => (r.id === reminderId ? updatedRem : r)),
    }));

    const res = await reminderService.updateReminder(reminderId, updates);
    if (res.error) {
      set({ reminders: previousReminders });
      return { success: false, error: res.error };
    }
    return { success: true };
  },

  toggleReminder: async (reminderId: string) => {
    const previousReminders = get().reminders;
    const rem = previousReminders.find((r) => r.id === reminderId);
    if (!rem) return { success: false, error: 'Reminder not found' };

    const newEnabled = !rem.enabled;
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === reminderId ? { ...r, enabled: newEnabled } : r
      ),
    }));

    const res = await reminderService.toggleReminder(reminderId, newEnabled);
    if (res.error) {
      set({ reminders: previousReminders });
      return { success: false, error: res.error };
    }
    return { success: true };
  },

  deleteReminder: async (reminderId: string) => {
    const previousReminders = get().reminders;
    set((state) => ({ reminders: state.reminders.filter((r) => r.id !== reminderId) }));

    const res = await reminderService.deleteReminder(reminderId);
    if (!res.success) {
      set({ reminders: previousReminders });
      return { success: false, error: res.error };
    }
    return { success: true };
  },

  addActivity: (newActivityData) => {
    const newActivity: Activity = {
      ...newActivityData,
      id: newActivityData.id || generateId('act'),
      startedAt: newActivityData.startedAt || new Date().toISOString(),
    };
    set((state) => ({ activities: [newActivity, ...state.activities] }));
  },

  deleteActivity: async (activityId: string) => {
    const previousActivities = get().activities;
    set((state) => ({ activities: state.activities.filter((a) => a.id !== activityId) }));

    const res = await activityService.deleteActivity(activityId);
    if (!res.success) {
      set({ activities: previousActivities });
      return { success: false, error: res.error };
    }
    return { success: true };
  },

  dismissInsight: (insightId: string) => {
    set((state) => ({
      aiInsights: state.aiInsights.filter((ins) => ins.id !== insightId),
    }));
  },

  getDailyTaskStats: (customDate?: string) => {
    const { tasks, selectedDate } = get();
    const targetDate = customDate || selectedDate || getLocalDateString();
    const dayTasks = tasks.filter((t) => !t.dueDate || t.dueDate === targetDate);
    const total = dayTasks.length;
    const completed = dayTasks.filter((t) => t.status === 'completed').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  },

  getDailyHabitStats: () => {
    const { habits } = get();
    const activeHabits = habits.filter((h) => !h.isArchived);
    const total = activeHabits.length;
    const completed = activeHabits.filter((h) => h.completedToday).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  },

  getWeeklyFitnessStats: () => {
    const { activities } = get();
    let totalMeters = 0;
    let totalSeconds = 0;
    let totalCals = 0;
    activities.forEach((act) => {
      totalMeters += act.distanceMeters;
      totalSeconds += act.durationSeconds;
      totalCals += act.calories;
    });

    return {
      totalDistanceKm: +(totalMeters / 1000).toFixed(2),
      totalDurationSeconds: totalSeconds,
      totalCalories: totalCals,
      activitiesCount: activities.length,
    };
  },

  getActiveGoalsStats: () => {
    const { goals } = get();
    const total = goals.length;
    const completed = goals.filter((g) => g.status === 'completed' || (g.targetValue > 0 && g.currentValue >= g.targetValue)).length;
    const active = goals.filter((g) => g.status === 'active' && g.currentValue < g.targetValue).length;

    let sumPct = 0;
    goals.forEach((g) => {
      if (g.targetValue > 0) {
        sumPct += Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
      }
    });
    const avgPercentage = total > 0 ? Math.round(sumPct / total) : 0;

    return { total, completed, active, avgPercentage };
  },
}));
