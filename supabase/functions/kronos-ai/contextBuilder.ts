// ==============================================================================
// KRONOS SUPABASE EDGE FUNCTION - SERVER-SIDE CONTEXT BUILDER
// ==============================================================================
// Authoritatively queries the database for the authenticated user (auth.uid())
// to provide zero-trust, grounded context for the Real LLM.

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

export interface ServerContextSnapshot {
  user: {
    id: string;
    fullName?: string;
    timezone?: string;
  };
  metrics: {
    pendingTasksCount: number;
    overdueTasksCount: number;
    completedTodayCount: number;
    activeHabitStreak: number;
    habitsRemainingToday: number;
    readinessScore: number;
    weeklyWorkoutsCount: number;
    weeklyDistanceKm: number;
  };
  tasks: Array<{ id: string; title: string; priority: string; due_time?: string; is_overdue: boolean }>;
  eventsToday: Array<{ id: string; title: string; start_time: string; end_time: string }>;
  habits: Array<{ id: string; title: string; current_streak: number; completed_today: boolean }>;
  goals: Array<{ id: string; title: string; current: number; target: number; unit: string }>;
  reminders: Array<{ id: string; title: string; remind_at: string }>;
}

export async function buildServerContext(
  supabase: SupabaseClient,
  userId: string
): Promise<{ snapshot: ServerContextSnapshot; promptString: string }> {
  const today = new Date().toISOString().split('T')[0];
  const startOfDay = `${today}T00:00:00.000Z`;
  const endOfDay = `${today}T23:59:59.999Z`;

  // Seven days ago for weekly fitness
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  // Run authoritative queries in parallel
  const [
    profileRes,
    tasksRes,
    habitsRes,
    habitLogsRes,
    eventsRes,
    goalsRes,
    remindersRes,
    activitiesRes,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, timezone').eq('id', userId).maybeSingle(),
    supabase.from('tasks').select('*').eq('user_id', userId).neq('status', 'cancelled'),
    supabase.from('habits').select('*').eq('user_id', userId).eq('is_archived', false),
    supabase.from('habit_logs').select('*').eq('user_id', userId).eq('date', today),
    supabase.from('events').select('*').eq('user_id', userId).gte('start_time', startOfDay).lte('start_time', endOfDay).order('start_time'),
    supabase.from('goals').select('*').eq('user_id', userId).eq('status', 'active'),
    supabase.from('reminders').select('*').eq('user_id', userId).eq('is_completed', false).gte('remind_at', startOfDay).order('remind_at'),
    supabase.from('activities').select('*').eq('user_id', userId).gte('started_at', sevenDaysAgoIso),
  ]);

  const profile = profileRes.data || {};
  const allTasks = tasksRes.data || [];
  const habits = habitsRes.data || [];
  const habitLogs = habitLogsRes.data || [];
  const events = eventsRes.data || [];
  const goals = goalsRes.data || [];
  const reminders = remindersRes.data || [];
  const activities = activitiesRes.data || [];

  // Metrics computation
  const pendingTasks = allTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completedToday = allTasks.filter((t) => t.status === 'completed' && t.completed_at && t.completed_at.startsWith(today));
  const overdueTasks = pendingTasks.filter((t) => t.due_date && t.due_date < today);

  const completedHabitIds = new Set(habitLogs.filter((l) => l.completed).map((l) => l.habit_id));
  const habitsRemaining = habits.filter((h) => !completedHabitIds.has(h.id)).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.current_streak || 0), 0);

  // Readiness score (Heuristic base 100 - fatigue/overdue)
  let readiness = 92;
  if (overdueTasks.length > 0) readiness -= Math.min(25, overdueTasks.length * 8);
  if (activities.length >= 5) readiness -= 10;
  readiness = Math.max(40, Math.min(100, readiness));

  // Weekly fitness
  const totalMeters = activities.reduce((sum, a) => sum + (Number(a.distance_meters) || 0), 0);
  const weeklyDistanceKm = Math.round((totalMeters / 1000) * 10) / 10;

  const snapshot: ServerContextSnapshot = {
    user: {
      id: userId,
      fullName: profile.full_name || 'Operative',
      timezone: profile.timezone || 'UTC',
    },
    metrics: {
      pendingTasksCount: pendingTasks.length,
      overdueTasksCount: overdueTasks.length,
      completedTodayCount: completedToday.length,
      activeHabitStreak: bestStreak,
      habitsRemainingToday: habitsRemaining,
      readinessScore: readiness,
      weeklyWorkoutsCount: activities.length,
      weeklyDistanceKm,
    },
    tasks: pendingTasks.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      due_time: t.due_time,
      is_overdue: Boolean(t.due_date && t.due_date < today),
    })),
    eventsToday: events.map((e) => ({
      id: e.id,
      title: e.title,
      start_time: e.start_time,
      end_time: e.end_time,
    })),
    habits: habits.map((h) => ({
      id: h.id,
      title: h.title,
      current_streak: h.current_streak,
      completed_today: completedHabitIds.has(h.id),
    })),
    goals: goals.map((g) => ({
      id: g.id,
      title: g.title,
      current: Number(g.current_value) || 0,
      target: Number(g.target_value) || 100,
      unit: g.unit || '%',
    })),
    reminders: reminders.map((r) => ({
      id: r.id,
      title: r.title,
      remind_at: r.remind_at,
    })),
  };

  const promptString = `
[AUTHENTICATED KRONOS USER SNAPSHOT]
Date: ${today}
User: ${snapshot.user.fullName} (${snapshot.user.timezone})
Readiness Score: ${snapshot.metrics.readinessScore}/100
Tasks: ${snapshot.metrics.pendingTasksCount} pending (${snapshot.metrics.overdueTasksCount} overdue, ${snapshot.metrics.completedTodayCount} completed today)
${snapshot.tasks.length > 0 ? 'Top Tasks:\n' + snapshot.tasks.slice(0, 5).map((t) => `  - [${t.priority.toUpperCase()}] ${t.title}${t.is_overdue ? ' (OVERDUE)' : ''}${t.due_time ? ' at ' + t.due_time : ''}`).join('\n') : 'No pending tasks.'}

Habits: ${snapshot.habits.length} active (Longest streak: ${snapshot.metrics.activeHabitStreak} days, ${snapshot.metrics.habitsRemainingToday} remaining today)
${snapshot.habits.map((h) => `  - ${h.title}: streak ${h.current_streak}d [${h.completed_today ? 'DONE' : 'PENDING'}]`).join('\n')}

Schedule Today (${snapshot.eventsToday.length} events):
${snapshot.eventsToday.length > 0 ? snapshot.eventsToday.map((e) => `  - ${e.title} (${e.start_time.split('T')[1].slice(0, 5)} - ${e.end_time.split('T')[1].slice(0, 5)})`).join('\n') : '  - No events scheduled today.'}

Active Goals:
${snapshot.goals.map((g) => `  - ${g.title}: ${g.current}/${g.target} ${g.unit}`).join('\n')}

Fitness Past 7 Days:
  - Total Workouts: ${snapshot.metrics.weeklyWorkoutsCount}
  - Total Distance: ${snapshot.metrics.weeklyDistanceKm} km
`.trim();

  return { snapshot, promptString };
}
