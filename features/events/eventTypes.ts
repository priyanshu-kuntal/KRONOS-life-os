export type EventCategory =
  | 'Work'
  | 'Study'
  | 'Personal'
  | 'Fitness'
  | 'Health'
  | 'Meeting'
  | 'Other';

export const EVENT_CATEGORIES: EventCategory[] = [
  'Work',
  'Study',
  'Personal',
  'Fitness',
  'Health',
  'Meeting',
  'Other',
];

export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  Work: '#4F8CFF',
  Meeting: '#8B7CFF',
  Fitness: '#38BDF8',
  Health: '#34D399',
  Study: '#FBBF24',
  Personal: '#A1A8B5',
  Other: '#687080',
};

export interface CreateEventInput {
  title: string;
  description?: string;
  category: EventCategory;
  startTime: string; // ISO string
  endTime: string; // ISO string
  isAllDay?: boolean;
  location?: string;
  color?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  category?: EventCategory;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  location?: string;
  color?: string;
}
