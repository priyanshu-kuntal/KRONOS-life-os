// ==============================================================================
// KRONOS PHASE 4: AI MISSION CONTROL - CONTEXT ENGINE
// ==============================================================================

import {
  UserProfile,
  Task,
  EventItem,
  Habit,
  Goal,
  Reminder,
  Activity,
  Priority,
} from '../../types/models';
import { AIContextSnapshot, FreeTimeSlot } from './aiTypes';
import { getLocalDateString } from '../tasks/taskUtils';

export interface BuildContextParams {
  user: UserProfile;
  tasks: Task[];
  events: EventItem[];
  habits: Habit[];
  goals: Goal[];
  reminders: Reminder[];
  activities: Activity[];
  referenceDate?: Date;
}

const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Builds a deterministic, user-isolated snapshot of the user's Life OS state.
 * Implements strict user isolation and token-efficient summarization.
 */
export function buildAIContext({
  user,
  tasks,
  events,
  habits,
  goals,
  reminders,
  activities,
  referenceDate = new Date(),
}: BuildContextParams): AIContextSnapshot {
  const userId = user.id;
  const todayStr = getLocalDateString(referenceDate);
  const nowHours = referenceDate.getHours().toString().padStart(2, '0');
  const nowMins = referenceDate.getMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${nowHours}:${nowMins}`;

  // 1. Strict user-isolation filter
  const userTasks = tasks.filter((t) => t.userId === userId);
  const userEvents = events.filter((e) => e.userId === userId);
  const userHabits = habits.filter((h) => h.userId === userId && !h.isArchived);
  const userGoals = goals.filter((g) => g.userId === userId && g.status === 'active');
  const userReminders = reminders.filter((r) => r.userId === userId && r.enabled && !r.isCompleted);
  const userActivities = activities.filter((a) => a.userId === userId);

  // 2. Tasks analysis
  const todayTasks = userTasks.filter((t) => !t.dueDate || t.dueDate === todayStr);
  const completedToday = todayTasks.filter((t) => t.status === 'completed').length;
  const pendingToday = todayTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length;

  // Overdue tasks: Due before today, not completed/cancelled
  const overdueTasks = userTasks
    .filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'completed' && t.status !== 'cancelled')
    .sort((a, b) => (PRIORITY_ORDER[b.priority] || 1) - (PRIORITY_ORDER[a.priority] || 1))
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate!,
      priority: t.priority,
    }));

  // Priority tasks for today (sorted by priority descending)
  const priorityTasks = todayTasks
    .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
    .sort((a, b) => (PRIORITY_ORDER[b.priority] || 1) - (PRIORITY_ORDER[a.priority] || 1))
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      dueTime: t.dueTime,
      status: t.status,
      category: t.category,
    }));

  // 3. Calendar & Events analysis (Today and Next 48 Hours)
  const nowEpoch = referenceDate.getTime();
  const next48hEpoch = nowEpoch + 48 * 3600 * 1000;

  const todayEvents = userEvents
    .filter((e) => {
      const eDate = e.startTime.substring(0, 10);
      return eDate === todayStr || e.isAllDay;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingNext48h = userEvents
    .filter((e) => {
      const start = new Date(e.startTime).getTime();
      return start >= nowEpoch && start <= next48hEpoch;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 8)
    .map((e) => ({
      id: e.id,
      title: e.title,
      startTime: e.startTime,
      endTime: e.endTime,
    }));

  // Conflict detection for today's timed events
  const timedTodayEvents = todayEvents.filter((e) => !e.isAllDay);
  const conflicts: AIContextSnapshot['eventsSummary']['conflicts'] = [];

  for (let i = 0; i < timedTodayEvents.length; i++) {
    for (let j = i + 1; j < timedTodayEvents.length; j++) {
      const a = timedTodayEvents[i];
      const b = timedTodayEvents[j];
      const aStart = new Date(a.startTime).getTime();
      const aEnd = new Date(a.endTime).getTime();
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();

      if (Math.max(aStart, bStart) < Math.min(aEnd, bEnd)) {
        conflicts.push({
          eventA: a.title,
          eventB: b.title,
          overlapStart: new Date(Math.max(aStart, bStart)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          overlapEnd: new Date(Math.min(aEnd, bEnd)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        });
      }
    }
  }

  // Free time slots during active daytime (08:00 - 22:00)
  const freeTimeSlots = computeDayFreeSlots(todayStr, timedTodayEvents);

  // 4. Habits analysis
  const habitCompletedToday = userHabits.filter((h) => h.completedToday).length;
  const habitPendingToday = userHabits.length - habitCompletedToday;

  // At-risk habits: High target frequency (>= 5 days/wk) with streak > 1 not completed yet today
  const atRiskHabits = userHabits
    .filter((h) => !h.completedToday && h.targetDaysPerWeek >= 4 && h.currentStreak > 0)
    .map((h) => ({
      id: h.id,
      title: h.title,
      currentStreak: h.currentStreak,
      targetDaysPerWeek: h.targetDaysPerWeek,
    }));

  // 5. Goals analysis
  const activeGoals = userGoals.slice(0, 4).map((g) => {
    const pct = g.targetValue > 0 ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0;
    return {
      id: g.id,
      title: g.title,
      percentage: pct,
      status: g.status,
      category: g.category,
      deadline: g.deadline || g.targetDate,
    };
  });

  // 6. Reminders analysis (next 24 hours)
  const next24hEpoch = nowEpoch + 24 * 3600 * 1000;
  const upcomingReminders = userReminders
    .filter((r) => {
      const rTime = new Date(r.remindAt).getTime();
      return rTime >= nowEpoch && rTime <= next24hEpoch;
    })
    .sort((a, b) => a.remindAt.localeCompare(b.remindAt))
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      title: r.title,
      remindAt: r.remindAt,
      priority: r.priority,
    }));

  // 7. Fitness Telemetry (Past 7 days)
  const past7DaysEpoch = nowEpoch - 7 * 24 * 3600 * 1000;
  const weekActivities = userActivities.filter((a) => {
    const actTime = new Date(a.startedAt).getTime();
    return actTime >= past7DaysEpoch;
  });

  const totalDistMeters = weekActivities.reduce((sum, a) => sum + (a.distanceMeters || 0), 0);
  const totalDistanceWeekKm = Number((totalDistMeters / 1000).toFixed(1));
  const weeklyGoalKm = user.weeklyDistanceGoalKm || 25.0;
  const fitnessGoalPct = weeklyGoalKm > 0 ? Math.min(100, Math.round((totalDistanceWeekKm / weeklyGoalKm) * 100)) : 0;

  const latest = userActivities.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const latestActivity = latest
    ? {
        title: latest.title,
        sportType: latest.sportType,
        distanceKm: Number(((latest.distanceMeters || 0) / 1000).toFixed(2)),
        durationMinutes: Math.round((latest.durationSeconds || 0) / 60),
        calories: latest.calories || 0,
        startedAt: latest.startedAt,
      }
    : undefined;

  return {
    user: {
      id: user.id,
      fullName: user.fullName || 'User',
      timezone: user.timezone || 'UTC',
      weeklyDistanceGoalKm: weeklyGoalKm,
      dailyTaskGoal: user.dailyTaskGoal || 6,
    },
    date: todayStr,
    currentTimeStr,
    tasksSummary: {
      totalToday: todayTasks.length,
      completedToday,
      pendingToday,
      overdueCount: overdueTasks.length,
      priorityTasks,
      overdueTasks,
    },
    eventsSummary: {
      todayCount: todayEvents.length,
      todayEvents: todayEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime,
        category: e.category,
      })),
      upcomingNext48h,
      conflicts,
    },
    habitsSummary: {
      totalActive: userHabits.length,
      completedToday: habitCompletedToday,
      pendingToday: habitPendingToday,
      atRiskHabits,
    },
    goalsSummary: {
      totalActive: userGoals.length,
      goals: activeGoals,
    },
    remindersSummary: {
      upcomingNext24h: upcomingReminders,
    },
    fitnessSummary: {
      activitiesCountWeek: weekActivities.length,
      totalDistanceWeekKm,
      weeklyGoalKm,
      goalPercentage: fitnessGoalPct,
      latestActivity,
    },
    freeTimeSlots,
  };
}

/**
 * Computes open blocks between 08:00 and 22:00 outside of scheduled events.
 */
function computeDayFreeSlots(dateStr: string, timedEvents: EventItem[]): FreeTimeSlot[] {
  const dayStartMin = 8 * 60; // 08:00
  const dayEndMin = 22 * 60; // 22:00

  // Map events to minute intervals from midnight
  const busyIntervals: [number, number][] = [];

  for (const e of timedEvents) {
    const sDate = new Date(e.startTime);
    const eDate = new Date(e.endTime);
    const sMin = sDate.getHours() * 60 + sDate.getMinutes();
    const eMin = eDate.getHours() * 60 + eDate.getMinutes();
    if (eMin > sMin) {
      busyIntervals.push([Math.max(dayStartMin, sMin), Math.min(dayEndMin, eMin)]);
    }
  }

  // Sort and merge busy intervals
  busyIntervals.sort((a, b) => a[0] - b[0]);
  const mergedBusy: [number, number][] = [];
  for (const interval of busyIntervals) {
    if (mergedBusy.length === 0) {
      mergedBusy.push(interval);
    } else {
      const last = mergedBusy[mergedBusy.length - 1];
      if (interval[0] <= last[1]) {
        last[1] = Math.max(last[1], interval[1]);
      } else {
        mergedBusy.push(interval);
      }
    }
  }

  // Find free gaps between dayStartMin and dayEndMin
  const freeSlots: FreeTimeSlot[] = [];
  let currentCursor = dayStartMin;

  for (const [busyStart, busyEnd] of mergedBusy) {
    if (busyStart > currentCursor + 15) {
      // Gap of at least 15 minutes
      const dur = busyStart - currentCursor;
      const startH = Math.floor(currentCursor / 60).toString().padStart(2, '0');
      const startM = (currentCursor % 60).toString().padStart(2, '0');
      const endH = Math.floor(busyStart / 60).toString().padStart(2, '0');
      const endM = (busyStart % 60).toString().padStart(2, '0');

      freeSlots.push({
        start: `${startH}:${startM}`,
        end: `${endH}:${endM}`,
        startIso: `${dateStr}T${startH}:${startM}:00.000Z`,
        endIso: `${dateStr}T${endH}:${endM}:00.000Z`,
        durationMinutes: dur,
      });
    }
    currentCursor = Math.max(currentCursor, busyEnd);
  }

  if (currentCursor + 15 < dayEndMin) {
    const dur = dayEndMin - currentCursor;
    const startH = Math.floor(currentCursor / 60).toString().padStart(2, '0');
    const startM = (currentCursor % 60).toString().padStart(2, '0');
    const endH = Math.floor(dayEndMin / 60).toString().padStart(2, '0');
    const endM = (dayEndMin % 60).toString().padStart(2, '0');

    freeSlots.push({
      start: `${startH}:${startM}`,
      end: `${endH}:${endM}`,
      startIso: `${dateStr}T${startH}:${startM}:00.000Z`,
      endIso: `${dateStr}T${endH}:${endM}:00.000Z`,
      durationMinutes: dur,
    });
  }

  return freeSlots;
}

/**
 * Formats an AIContextSnapshot into a token-budgeted prompt string for the LLM.
 */
export function formatContextForPrompt(ctx: AIContextSnapshot): string {
  const lines: string[] = [];

  lines.push(`=== KRONOS USER SNAPSHOT ===`);
  lines.push(`User: ${ctx.user.fullName} | Timezone: ${ctx.user.timezone} | Date: ${ctx.date} ${ctx.currentTimeStr}`);
  lines.push(
    `Daily Task Target: ${ctx.user.dailyTaskGoal} | Weekly Distance Goal: ${ctx.user.weeklyDistanceGoalKm} km`
  );

  lines.push(`\n--- TODAY'S TASKS (${ctx.tasksSummary.completedToday}/${ctx.tasksSummary.totalToday} Completed, ${ctx.tasksSummary.pendingToday} Pending) ---`);
  if (ctx.tasksSummary.priorityTasks.length > 0) {
    lines.push(`Priority Tasks:`);
    for (const t of ctx.tasksSummary.priorityTasks) {
      lines.push(` • [${t.priority.toUpperCase()}] ${t.title}${t.dueTime ? ` @ ${t.dueTime}` : ''} (${t.category})`);
    }
  } else {
    lines.push(`(No pending tasks for today)`);
  }

  if (ctx.tasksSummary.overdueTasks.length > 0) {
    lines.push(`Overdue Tasks (${ctx.tasksSummary.overdueCount} total):`);
    for (const t of ctx.tasksSummary.overdueTasks) {
      lines.push(` ⚠️ ${t.title} (Due: ${t.dueDate}, ${t.priority.toUpperCase()})`);
    }
  }

  lines.push(`\n--- TODAY'S SCHEDULE (${ctx.eventsSummary.todayCount} Events) ---`);
  if (ctx.eventsSummary.todayEvents.length > 0) {
    for (const e of ctx.eventsSummary.todayEvents) {
      const timeLabel = `${new Date(e.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(e.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      lines.push(` • ${timeLabel}: ${e.title} [${e.category}]`);
    }
  } else {
    lines.push(`(No scheduled events today)`);
  }

  if (ctx.eventsSummary.conflicts.length > 0) {
    lines.push(`Schedule Conflicts Detected:`);
    for (const c of ctx.eventsSummary.conflicts) {
      lines.push(` ⚡ CONFLICT: "${c.eventA}" & "${c.eventB}" overlap from ${c.overlapStart} to ${c.overlapEnd}`);
    }
  }

  lines.push(`\n--- HABITS (${ctx.habitsSummary.completedToday}/${ctx.habitsSummary.totalActive} Completed Today) ---`);
  if (ctx.habitsSummary.atRiskHabits.length > 0) {
    lines.push(`Habits At Risk:`);
    for (const h of ctx.habitsSummary.atRiskHabits) {
      lines.push(` ⚠️ ${h.title} (Current streak: ${h.currentStreak} days, Target: ${h.targetDaysPerWeek}d/wk)`);
    }
  }

  lines.push(`\n--- ACTIVE GOALS (${ctx.goalsSummary.totalActive} Active) ---`);
  if (ctx.goalsSummary.goals.length > 0) {
    for (const g of ctx.goalsSummary.goals) {
      lines.push(` • ${g.title}: ${g.percentage}% complete (${g.category})`);
    }
  }

  lines.push(`\n--- FITNESS TELEMETRY (Last 7 Days) ---`);
  lines.push(
    `Distance: ${ctx.fitnessSummary.totalDistanceWeekKm} / ${ctx.fitnessSummary.weeklyGoalKm} km (${ctx.fitnessSummary.goalPercentage}% of weekly target) across ${ctx.fitnessSummary.activitiesCountWeek} workouts.`
  );
  if (ctx.fitnessSummary.latestActivity) {
    const lat = ctx.fitnessSummary.latestActivity;
    lines.push(`Latest: ${lat.title} (${lat.sportType}) - ${lat.distanceKm}km, ${lat.durationMinutes}m, ${lat.calories}kcal`);
  }

  lines.push(`\n--- OPEN TIME SLOTS TODAY ---`);
  if (ctx.freeTimeSlots.length > 0) {
    const slotsStr = ctx.freeTimeSlots
      .map((s) => `${s.start}-${s.end} (${s.durationMinutes}m)`)
      .join(', ');
    lines.push(`Free: ${slotsStr}`);
  } else {
    lines.push(`(No open daytime blocks)`);
  }

  return lines.join('\n');
}
