import { HabitLog } from '../../types/models';
import { HabitHistoryDay } from './habitTypes';

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Calculates current streak, best streak, completed today status,
 * completion rate, and 7-day visual history from raw habit logs.
 */
export function calculateHabitStreak(
  logs: HabitLog[],
  todayStr: string = formatLocalDate(new Date())
): {
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  completionRate: number;
  weeklyHistory: HabitHistoryDay[];
} {
  // Create a fast lookup Set of completed dates
  const completedDateSet = new Set<string>();
  logs.forEach((log) => {
    if (log.completed) {
      completedDateSet.add(log.date);
    }
  });

  const completedToday = completedDateSet.has(todayStr);

  // 1. Calculate Current Streak
  let currentStreak = 0;
  const cursorDate = new Date();

  // If not completed today, start checking from yesterday
  if (!completedToday) {
    cursorDate.setDate(cursorDate.getDate() - 1);
  }

  // Count backwards day by day as long as dates are in completedDateSet
  while (true) {
    const dateKey = formatLocalDate(cursorDate);
    if (completedDateSet.has(dateKey)) {
      currentStreak++;
      cursorDate.setDate(cursorDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 2. Calculate Best Streak across sorted log dates
  const sortedDates = Array.from(completedDateSet).sort();
  let bestStreak = currentStreak;
  let runningStreak = 0;
  let previousTimestamp = 0;

  for (const dateKey of sortedDates) {
    const currentTimestamp = new Date(dateKey + 'T00:00:00').getTime();
    if (previousTimestamp === 0) {
      runningStreak = 1;
    } else {
      const diffDays = Math.round((currentTimestamp - previousTimestamp) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
    }
    previousTimestamp = currentTimestamp;
    if (runningStreak > bestStreak) {
      bestStreak = runningStreak;
    }
  }

  // 3. Generate 7-Day History Window (Past 6 days + Today)
  const weeklyHistory: HabitHistoryDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = formatLocalDate(d);

    weeklyHistory.push({
      date: dateKey,
      dayLabel: dayNames[d.getDay()],
      dayNumber: d.getDate(),
      completed: completedDateSet.has(dateKey),
      isToday: dateKey === todayStr,
    });
  }

  // 4. Completion rate over past 30 days
  let past30Count = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = formatLocalDate(d);
    if (completedDateSet.has(dateKey)) {
      past30Count++;
    }
  }
  const completionRate = Math.round((past30Count / 30) * 100);

  return {
    currentStreak,
    bestStreak,
    completedToday,
    completionRate,
    weeklyHistory,
  };
}
