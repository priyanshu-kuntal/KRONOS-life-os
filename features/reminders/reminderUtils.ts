import { Reminder } from '../../types/models';
import { ReminderOffset, REMINDER_OFFSETS } from './reminderTypes';

/**
 * Calculates adjusted remind_at ISO timestamp given an item time and offset.
 */
export function calculateReminderTime(targetIso: string, offset: ReminderOffset): string {
  try {
    const targetDate = new Date(targetIso);
    const offsetConfig = REMINDER_OFFSETS.find((o) => o.value === offset);
    const minutesToSubtract = offsetConfig ? offsetConfig.minutesBefore : 0;

    const adjustedMs = targetDate.getTime() - minutesToSubtract * 60 * 1000;
    return new Date(adjustedMs).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Formats a reminder timestamp into readable human time and date.
 */
export function formatReminderDisplay(remindAtIso: string): {
  timeStr: string;
  dateStr: string;
  isPast: boolean;
  relativeLabel: string;
} {
  try {
    const d = new Date(remindAtIso);
    const now = new Date();
    const isPast = d.getTime() < now.getTime();

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const diffMin = Math.round((d.getTime() - now.getTime()) / (1000 * 60));
    let relativeLabel = '';
    if (isPast) {
      relativeLabel = 'Past';
    } else if (diffMin < 60) {
      relativeLabel = `In ${diffMin}m`;
    } else if (diffMin < 1440) {
      relativeLabel = `In ${Math.round(diffMin / 60)}h`;
    } else {
      relativeLabel = `In ${Math.round(diffMin / 1440)}d`;
    }

    return { timeStr, dateStr, isPast, relativeLabel };
  } catch {
    return { timeStr: '12:00', dateStr: 'Today', isPast: false, relativeLabel: 'Upcoming' };
  }
}

/**
 * Sorts reminders chronologically by remindAt timestamp.
 */
export function sortRemindersByTime(reminders: Reminder[]): Reminder[] {
  return [...reminders].sort((a, b) => {
    return new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime();
  });
}
