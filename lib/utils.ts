/**
 * Generates simple unique identifiers for local items
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Clamps a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates percentage integer (0 to 100)
 */
export function calculatePercentage(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round(clamp((current / total) * 100, 0, 100));
}

/**
 * Generates an array of dates for a given week centered around or starting from a date
 */
export function getWeekDates(baseDate: Date = new Date()): { date: Date; isToday: boolean; dayName: string; dayNumber: number; dateString: string }[] {
  const current = new Date(baseDate);
  const day = current.getDay();
  // Start on Monday (day 1)
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));

  const week = [];
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    const dateString = nextDate.toISOString().split('T')[0];

    week.push({
      date: nextDate,
      isToday: dateString === todayString,
      dayName: nextDate.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: nextDate.getDate(),
      dateString,
    });
  }

  return week;
}
