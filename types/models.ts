export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type SportType = 'running' | 'cycling' | 'walking' | 'hiking' | 'workout' | 'swimming';
export type HabitFrequency = 'daily' | 'weekly';
export type ThemeMode = 'dark' | 'light' | 'system';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  timezone: string;
  themePreference: ThemeMode;
  weeklyDistanceGoalKm: number;
  dailyTaskGoal: number;
  currentStreak: number;
  totalActivitiesCount: number;
}

export interface Task {
  id: string;
  userId: string;
  goalId?: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: Priority;
  status: TaskStatus;
  category: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  completedAt?: string;
  createdAt: string;
}

export interface EventItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  isAllDay: boolean;
  location?: string;
  color: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Habit {
  id: string;
  userId: string;
  goalId?: string;
  title: string;
  description?: string;
  category: string;
  targetDaysPerWeek: number;
  frequency: HabitFrequency;
  color: string;
  icon: string;
  currentStreak: number;
  bestStreak: number;
  isArchived: boolean;
  completedToday?: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
}

export interface Activity {
  id: string;
  userId: string;
  title: string;
  sportType: SportType;
  distanceMeters: number; // e.g. 5240 -> 5.24 km
  durationSeconds: number; // e.g. 1902 -> 31m 42s
  movingTimeSeconds: number;
  avgSpeedMps: number;
  maxSpeedMps: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories: number;
  elevationGainMeters: number;
  startedAt: string; // ISO string
  completedAt?: string;
  notes?: string;
  routeSvgPath?: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate?: string; // YYYY-MM-DD
  targetDate?: string; // YYYY-MM-DD
  deadline?: string; // alias for targetDate
  category: string;
  status: GoalStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  taskId?: string;
  eventId?: string;
  habitId?: string;
  goalId?: string;
  remindAt: string; // ISO string
  isCompleted: boolean;
  enabled: boolean;
  priority?: Priority;
  createdAt?: string;
  updatedAt?: string;
}

export interface AIInsight {
  id: string;
  type: 'schedule' | 'fitness' | 'habit' | 'focus';
  title: string;
  message: string;
  actionText?: string;
  actionPayload?: any;
  confidenceScore?: number;
  createdAt: string;
}
