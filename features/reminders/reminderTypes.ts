import { Priority, Reminder } from '../../types/models';

export type ReminderOffset =
  | 'at_time'
  | '5m'
  | '10m'
  | '15m'
  | '30m'
  | '1h'
  | '1d';

export const REMINDER_OFFSETS: { label: string; value: ReminderOffset; minutesBefore: number }[] = [
  { label: 'At time', value: 'at_time', minutesBefore: 0 },
  { label: '5m before', value: '5m', minutesBefore: 5 },
  { label: '10m before', value: '10m', minutesBefore: 10 },
  { label: '15m before', value: '15m', minutesBefore: 15 },
  { label: '30m before', value: '30m', minutesBefore: 30 },
  { label: '1h before', value: '1h', minutesBefore: 60 },
  { label: '1d before', value: '1d', minutesBefore: 1440 },
];

export interface CreateReminderInput {
  title: string;
  remindAt: string; // ISO string
  taskId?: string;
  eventId?: string;
  habitId?: string;
  goalId?: string;
  priority?: Priority;
  enabled?: boolean;
}

export interface UpdateReminderInput {
  title?: string;
  remindAt?: string;
  isCompleted?: boolean;
  enabled?: boolean;
  priority?: Priority;
}
