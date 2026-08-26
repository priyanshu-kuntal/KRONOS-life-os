import { EventItem, Task, Habit } from '../../types/models';
import { CalendarItem } from './calendarTypes';
import { processCalendarOverlaps } from './conflictUtils';
import { EVENT_CATEGORY_COLORS } from '../events/eventTypes';

function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 9 * 60; // Default to 09:00 if not specified
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

function parseIsoToLocalTime(isoStr: string): { timeStr: string; minutes: number; dateStr: string } {
  try {
    const d = new Date(isoStr);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return { timeStr, minutes: hours * 60 + minutes, dateStr };
  } catch {
    return { timeStr: '09:00', minutes: 540, dateStr: '' };
  }
}

export function buildDayCalendarItems(
  selectedDateStr: string,
  events: EventItem[],
  tasks: Task[],
  habits: Habit[]
): CalendarItem[] {
  const items: CalendarItem[] = [];

  // 1. Process Events
  events.forEach((evt) => {
    const startParsed = parseIsoToLocalTime(evt.startTime);
    const endParsed = parseIsoToLocalTime(evt.endTime);

    // Check if event touches selectedDate
    const isMatchingDate =
      evt.startTime.startsWith(selectedDateStr) ||
      startParsed.dateStr === selectedDateStr ||
      evt.isAllDay;

    if (isMatchingDate) {
      const duration = Math.max(30, endParsed.minutes - startParsed.minutes);
      items.push({
        id: `cal-evt-${evt.id}`,
        type: 'event',
        title: evt.title,
        description: evt.description,
        startTime: startParsed.timeStr,
        endTime: endParsed.timeStr,
        startMinutesFromMidnight: evt.isAllDay ? 0 : startParsed.minutes,
        durationMinutes: evt.isAllDay ? 1440 : duration,
        isAllDay: evt.isAllDay,
        category: evt.category || 'Work',
        color: evt.color || EVENT_CATEGORY_COLORS[evt.category as keyof typeof EVENT_CATEGORY_COLORS] || '#4F8CFF',
        location: evt.location,
        completed: false,
        sourceId: evt.id,
        sourceData: evt,
      });
    }
  });

  // 2. Process Scheduled Tasks
  tasks.forEach((task) => {
    const isMatchingDate = !task.dueDate || task.dueDate === selectedDateStr;
    if (isMatchingDate) {
      const startMin = parseTimeToMinutes(task.dueTime || '10:00');
      const duration = task.estimatedMinutes || 30;
      const endMin = startMin + duration;
      const endHours = Math.floor(endMin / 60) % 24;
      const endMinutes = endMin % 60;
      const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

      items.push({
        id: `cal-tsk-${task.id}`,
        type: 'task',
        title: task.title,
        description: task.description,
        startTime: task.dueTime || '10:00',
        endTime: endTimeStr,
        startMinutesFromMidnight: startMin,
        durationMinutes: duration,
        isAllDay: false,
        category: task.category || 'Task',
        color: task.priority === 'urgent' ? '#FB7185' : task.priority === 'high' ? '#FBBF24' : '#4F8CFF',
        completed: task.status === 'completed',
        sourceId: task.id,
        sourceData: task,
      });
    }
  });

  // 3. Process Habits
  habits.forEach((habit, idx) => {
    if (!habit.isArchived) {
      // Schedule morning or evening habit slot
      const startMin = 8 * 60 + idx * 30; // Spread morning habits cleanly
      const endMin = startMin + 20;
      const startHours = Math.floor(startMin / 60);
      const startMins = startMin % 60;
      const endHours = Math.floor(endMin / 60);
      const endMins = endMin % 60;

      items.push({
        id: `cal-hab-${habit.id}`,
        type: 'habit',
        title: habit.title,
        description: habit.description,
        startTime: `${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')}`,
        endTime: `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`,
        startMinutesFromMidnight: startMin,
        durationMinutes: 20,
        isAllDay: false,
        category: habit.category || 'Habit',
        color: habit.color || '#38BDF8',
        completed: Boolean(habit.completedToday),
        sourceId: habit.id,
        sourceData: habit,
      });
    }
  });

  return processCalendarOverlaps(items);
}
