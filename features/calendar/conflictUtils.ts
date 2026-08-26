import { CalendarItem } from './calendarTypes';

/**
 * Checks if two calendar items overlap in time
 */
export function doItemsOverlap(a: CalendarItem, b: CalendarItem): boolean {
  if (a.isAllDay || b.isAllDay) return false;
  const aStart = a.startMinutesFromMidnight;
  const aEnd = a.startMinutesFromMidnight + a.durationMinutes;
  const bStart = b.startMinutesFromMidnight;
  const bEnd = b.startMinutesFromMidnight + b.durationMinutes;

  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

/**
 * Analyzes items for scheduling conflicts and annotates items with conflict flags
 * and column layout metrics (overlapIndex, overlapTotal).
 */
export function processCalendarOverlaps(items: CalendarItem[]): CalendarItem[] {
  const timedItems = items.filter((i) => !i.isAllDay);
  const allDayItems = items.filter((i) => i.isAllDay);

  if (timedItems.length === 0) {
    return items;
  }

  // Sort timed items by start time, then longer duration first
  const sorted = [...timedItems].sort((a, b) => {
    if (a.startMinutesFromMidnight !== b.startMinutesFromMidnight) {
      return a.startMinutesFromMidnight - b.startMinutesFromMidnight;
    }
    return b.durationMinutes - a.durationMinutes;
  });

  // Find overlapping clusters
  const clusters: CalendarItem[][] = [];
  let currentCluster: CalendarItem[] = [];
  let clusterEnd = -1;

  for (const item of sorted) {
    const itemStart = item.startMinutesFromMidnight;
    const itemEnd = itemStart + item.durationMinutes;

    if (currentCluster.length === 0 || itemStart < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, itemEnd);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = itemEnd;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Assign column slots within each cluster
  const processedTimedItems: CalendarItem[] = [];

  for (const cluster of clusters) {
    const isConflict = cluster.length > 1;
    const columns: CalendarItem[][] = [];

    for (const item of cluster) {
      let placed = false;
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        const col = columns[colIdx];
        const lastInCol = col[col.length - 1];
        const lastEnd = lastInCol.startMinutesFromMidnight + lastInCol.durationMinutes;

        if (item.startMinutesFromMidnight >= lastEnd) {
          col.push(item);
          item.overlapIndex = colIdx;
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([item]);
        item.overlapIndex = columns.length - 1;
      }
    }

    const overlapTotal = columns.length;
    for (const item of cluster) {
      processedTimedItems.push({
        ...item,
        hasConflict: isConflict,
        overlapTotal,
        overlapIndex: item.overlapIndex || 0,
      });
    }
  }

  return [...allDayItems, ...processedTimedItems];
}
