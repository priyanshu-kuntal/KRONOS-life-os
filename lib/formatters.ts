/**
 * Formats distance in meters to a clean string (e.g. 5240 -> "5.24 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

/**
 * Formats seconds into HH:MM:SS or MM:SS (e.g. 1902 -> "31:42", 3665 -> "1:01:05")
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    const paddedMins = mins.toString().padStart(2, '0');
    const paddedSecs = secs.toString().padStart(2, '0');
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  const paddedSecs = secs.toString().padStart(2, '0');
  return `${mins}:${paddedSecs}`;
}

/**
 * Formats duration into human readable text (e.g. "2h 40m" or "45m")
 */
export function formatDurationHuman(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return `${mins}m`;
}

/**
 * Formats speed (m/s) to Running Pace (MM:SS /km) or Cycling Speed (km/h)
 */
export function formatPace(metersPerSecond: number, sportType: string = 'running'): string {
  if (!metersPerSecond || metersPerSecond <= 0) return sportType === 'cycling' ? '0.0 km/h' : '--:-- /km';

  if (sportType === 'cycling') {
    const kmh = metersPerSecond * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  }

  // Running / walking pace in seconds per kilometer
  const secondsPerKm = 1000 / metersPerSecond;
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);

  if (mins > 59) return '> 60:00 /km';

  const paddedSecs = secs.toString().padStart(2, '0');
  return `${mins}:${paddedSecs} /km`;
}

/**
 * Formats a Date object or ISO string to display format (e.g. "Wednesday, August 26")
 */
export function formatDisplayDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats a Date object or ISO string to Short Date (e.g. "Aug 26")
 */
export function formatShortDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns dynamic greeting based on hour ("Good morning 👋", "Good afternoon ⚡", "Good evening 🌙")
 */
export function getGreeting(hour?: number): { greeting: string; icon: string } {
  const currentHour = hour !== undefined ? hour : new Date().getHours();
  if (currentHour < 12) {
    return { greeting: 'Good morning', icon: '👋' };
  }
  if (currentHour < 17) {
    return { greeting: 'Good afternoon', icon: '⚡' };
  }
  return { greeting: 'Good evening', icon: '🌙' };
}
