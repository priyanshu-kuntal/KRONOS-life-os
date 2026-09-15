// ==============================================================================
// KRONOS PHASE 4: AI MISSION CONTROL - PROACTIVE SCHEDULE OPTIMIZER
// ==============================================================================

import { AIContextSnapshot, ScheduleRecommendation } from './aiTypes';
import { generateId } from '../../lib/utils';
import { getLocalDateString } from '../tasks/taskUtils';

export interface ScheduleAuditResult {
  isOverloaded: boolean;
  totalScheduledHours: number;
  conflictsCount: number;
  tightTransitionsCount: number;
  recommendations: ScheduleRecommendation[];
  summary: string;
}

/**
 * Analyzes the user's schedule for workload bottlenecks, direct collisions,
 * tight transitions, and overdue priorities.
 * Operates on a RECOMMENDATION-FIRST basis; never mutates without user consent.
 */
export function analyzeAndOptimizeSchedule(ctx: AIContextSnapshot): ScheduleAuditResult {
  const recommendations: ScheduleRecommendation[] = [];
  const timedEvents = ctx.eventsSummary.todayEvents;
  const todayStr = ctx.date;

  // 1. Calculate total scheduled hours
  let totalScheduledMinutes = 0;
  for (const e of timedEvents) {
    const s = new Date(e.startTime).getTime();
    const end = new Date(e.endTime).getTime();
    if (end > s) {
      totalScheduledMinutes += Math.round((end - s) / (60 * 1000));
    }
  }
  const totalScheduledHours = Number((totalScheduledMinutes / 60).toFixed(1));
  const isOverloaded = totalScheduledHours >= 7.0 || ctx.tasksSummary.pendingToday >= 7;

  // 2. Direct event collisions
  const conflictsCount = ctx.eventsSummary.conflicts.length;
  for (const conf of ctx.eventsSummary.conflicts) {
    // Find free time gap in afternoon
    const freeGap = ctx.freeTimeSlots.find((s) => s.durationMinutes >= 45);
    const targetSlot = freeGap ? freeGap.start : '16:00';

    recommendations.push({
      id: generateId(),
      title: `Shift "${conf.eventB}"`,
      description: `Resolve schedule collision by relocating "${conf.eventB}" from ${conf.overlapStart} to open window at ${targetSlot}.`,
      reason: `Direct collision with "${conf.eventA}" between ${conf.overlapStart} and ${conf.overlapEnd}.`,
      actionPayload: {
        eventTitle: conf.eventB,
        proposedStart: targetSlot,
      },
    });
  }

  // 3. Tight transitions (< 15 min buffer between consecutive events)
  const sortedEvents = [...timedEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));
  let tightTransitionsCount = 0;

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currEnd = new Date(sortedEvents[i].endTime).getTime();
    const nextStart = new Date(sortedEvents[i + 1].startTime).getTime();
    const bufferMin = Math.round((nextStart - currEnd) / (60 * 1000));

    if (bufferMin >= 0 && bufferMin < 15) {
      tightTransitionsCount++;
      recommendations.push({
        id: generateId(),
        title: `Add Buffer after "${sortedEvents[i].title}"`,
        description: `Back-to-back transition (${bufferMin} min buffer) before "${sortedEvents[i + 1].title}". Recommend adding 15 min buffer.`,
        reason: 'Prevents mental fatigue and meeting overrun spillovers.',
      });
    }
  }

  // 4. Overdue Task Allocation
  if (ctx.tasksSummary.overdueCount > 0 && ctx.freeTimeSlots.length > 0) {
    const overdueTask = ctx.tasksSummary.overdueTasks[0];
    const bestSlot = ctx.freeTimeSlots[0];
    recommendations.push({
      id: generateId(),
      title: `Block Time for "${overdueTask.title}"`,
      description: `Assign open slot (${bestSlot.start} - ${bestSlot.end}) to complete overdue task.`,
      reason: `Task was due on ${overdueTask.dueDate} and remains pending.`,
      actionPayload: {
        taskId: overdueTask.id,
        slotStart: bestSlot.startIso,
        slotEnd: bestSlot.endIso,
      },
    });
  }

  // 5. Build summary
  let summary = '';
  if (isOverloaded) {
    summary = `Schedule is overloaded (${totalScheduledHours} hrs scheduled). Consider shifting lower-priority blocks.`;
  } else if (conflictsCount > 0) {
    summary = `${conflictsCount} scheduling conflict(s) detected requiring adjustment.`;
  } else if (recommendations.length > 0) {
    summary = `Schedule is feasible with ${recommendations.length} optimization opportunities.`;
  } else {
    summary = `Schedule is balanced. ${totalScheduledHours} hours committed across ${timedEvents.length} blocks.`;
  }

  return {
    isOverloaded,
    totalScheduledHours,
    conflictsCount,
    tightTransitionsCount,
    recommendations,
    summary,
  };
}
