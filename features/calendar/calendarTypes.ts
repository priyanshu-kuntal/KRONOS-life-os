import { EventItem, Task, Habit } from '../../types/models';

export type CalendarItemType = 'event' | 'task' | 'habit';

export type CalendarViewMode = 'day' | 'week';

export interface CalendarItem {
  id: string;
  type: CalendarItemType;
  title: string;
  description?: string;
  startTime: string; // HH:mm or ISO
  endTime: string; // HH:mm or ISO
  startMinutesFromMidnight: number; // 0 to 1440
  durationMinutes: number;
  isAllDay: boolean;
  category: string;
  color: string;
  location?: string;
  completed: boolean;
  sourceId: string;
  sourceData: EventItem | Task | Habit;
  hasConflict?: boolean;
  overlapIndex?: number;
  overlapTotal?: number;
}

export interface DayTimelineSlot {
  hour: number; // 0 to 23
  label: string; // "09:00"
}
