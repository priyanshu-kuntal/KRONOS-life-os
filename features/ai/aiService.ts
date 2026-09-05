// ==============================================================================
// KRONOS PHASE 4: AI MISSION CONTROL - SECURE AI SERVICE LAYER
// ==============================================================================

import {
  ChatMessage,
  AIResponseContract,
  AIContextSnapshot,
  ToolExecutionResult,
  PendingActionPayload,
} from './aiTypes';
import { executeKronosTool, KRONOS_TOOLS } from './aiTools';
import { formatContextForPrompt } from './contextEngine';
import { generateId } from '../../lib/utils';
import { getLocalDateString } from '../tasks/taskUtils';
import { Priority } from '../../types/models';

const AI_API_URL = process.env.EXPO_PUBLIC_AI_API_URL || '';
const AI_API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY || '';

export interface SendMessageOptions {
  message: string;
  context: AIContextSnapshot;
  conversationHistory: ChatMessage[];
  userId: string;
  isDemoMode?: boolean;
}

/**
 * Main dispatch function for AI Mission Control.
 * Dispatches to remote secure server/Edge Function if configured,
 * or falls back cleanly to the deterministic KRONOS Heuristic Engine for Demo/Offline.
 */
export async function sendChatMessage({
  message,
  context,
  conversationHistory,
  userId,
  isDemoMode = false,
}: SendMessageOptions): Promise<AIResponseContract> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { message: 'Please provide a message or command for Mission Control.' };
  }

  // 1. If in Demo mode or no remote AI endpoint configured, use the Deterministic Engine
  const shouldUseLocalEngine = isDemoMode || !AI_API_URL || AI_API_URL.includes('placeholder');

  if (shouldUseLocalEngine) {
    return runDeterministicMissionControl(trimmed, context, userId);
  }

  // 2. Production Remote AI Provider invocation
  try {
    const systemPrompt = `You are KRONOS AI Mission Control, the intelligent executive assistant of the KRONOS Personal Life OS.
Your role is to understand user state, assist with daily planning, provide cross-domain insights, and execute controlled tools for Tasks, Habits, Calendar Events, Goals, and Reminders.

CRITICAL RULES:
1. Always base statements on the provided KRONOS USER SNAPSHOT. Do not hallucinate tasks, habits, or fitness data.
2. For action intents (e.g. creating tasks, logging habits, scheduling events), invoke appropriate tools from the toolset.
3. Destructive actions (deleting tasks, removing events) will require explicit confirmation.
4. Keep answers concise, actionable, and executive-styled.

${formatContextForPrompt(context)}`;

    const messagesPayload = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: trimmed },
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (AI_API_KEY) {
      headers['Authorization'] = `Bearer ${AI_API_KEY}`;
    }

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: messagesPayload,
        tools: KRONOS_TOOLS,
        user_id: userId, // Server will verify auth.uid() against bearer token in production
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[KRONOS AI] Remote API returned HTTP ${response.status}. Falling back to deterministic engine.`);
      return runDeterministicMissionControl(trimmed, context, userId);
    }

    const data = await response.json();

    // Check if remote model called tools
    if (data.tool_calls && Array.isArray(data.tool_calls) && data.tool_calls.length > 0) {
      const toolResults: ToolExecutionResult[] = [];
      let pendingAction: PendingActionPayload | undefined;
      let requiresConfirmation = false;

      for (const call of data.tool_calls) {
        const toolName = call.function?.name || call.name;
        const toolArgs = typeof call.function?.arguments === 'string'
          ? JSON.parse(call.function.arguments)
          : (call.function?.arguments || call.arguments || {});

        const res = await executeKronosTool(toolName, toolArgs, userId);
        toolResults.push(res);
        if (res.requiresConfirmation && res.pendingAction) {
          requiresConfirmation = true;
          pendingAction = res.pendingAction;
        }
      }

      return {
        message: data.content || data.message || 'Action processed.',
        toolCalls: toolResults,
        requiresConfirmation,
        pendingAction,
      };
    }

    return {
      message: data.content || data.message || 'Mission Control updated.',
      toolCalls: [],
    };
  } catch (err: any) {
    console.warn('[KRONOS AI] Remote invocation failed, employing deterministic fallback:', err?.message);
    return runDeterministicMissionControl(trimmed, context, userId);
  }
}

/**
 * Deterministic KRONOS Heuristic Engine for Demo Sandbox and Offline operations.
 * Analyzes intent, executes real tools against the domain store, and constructs
 * grounded executive responses without external API dependencies.
 */
export async function runDeterministicMissionControl(
  prompt: string,
  ctx: AIContextSnapshot,
  userId: string
): Promise<AIResponseContract> {
  const lower = prompt.toLowerCase();
  const todayStr = ctx.date;

  // --------------------------------------------------------------------------
  // INTENT 1: DESTRUCTIVE ACTION (Delete Task / Event / Goal)
  // --------------------------------------------------------------------------
  if (lower.includes('delete') || lower.includes('remove')) {
    if (lower.includes('task') || lower.includes('assignment')) {
      const match = prompt.match(/(?:delete|remove)\s+(?:task\s+)?["']?([^"']+)["']?/i);
      const titleQuery = match ? match[1].replace(/task/i, '').trim() : '';

      const target = ctx.tasksSummary.priorityTasks[0] || ctx.tasksSummary.overdueTasks[0];
      const taskTitle = titleQuery || (target ? target.title : 'selected task');
      const taskId = target ? target.id : 'demo-target';

      const res = await executeKronosTool('delete_task', { taskId, taskTitle, isConfirmed: false }, userId);
      return {
        message: `I can remove that task, but destructive operations require your authorization.`,
        requiresConfirmation: true,
        pendingAction: res.pendingAction,
        toolCalls: [res],
      };
    }

    if (lower.includes('event') || lower.includes('meeting') || lower.includes('schedule')) {
      const target = ctx.eventsSummary.todayEvents[0];
      const eventTitle = target ? target.title : 'scheduled item';
      const eventId = target ? target.id : 'demo-event';

      const res = await executeKronosTool('delete_event', { eventId, eventTitle, isConfirmed: false }, userId);
      return {
        message: `Removing scheduled calendar blocks requires confirmation.`,
        requiresConfirmation: true,
        pendingAction: res.pendingAction,
        toolCalls: [res],
      };
    }
  }

  // --------------------------------------------------------------------------
  // INTENT 2: CREATE TASK (e.g. "Add a task to ...", "Schedule deep work session...")
  // --------------------------------------------------------------------------
  if (
    lower.startsWith('add task') ||
    lower.startsWith('create task') ||
    lower.includes('add a task') ||
    lower.includes('new task') ||
    lower.includes('remind me to')
  ) {
    let title = prompt
      .replace(/^(add a task to|add task|create task|new task|remind me to)\s+/i, '')
      .replace(/tomorrow/i, '')
      .replace(/today/i, '')
      .replace(/tonight/i, '')
      .trim();

    // Clean priority if mentioned
    let priority: Priority = 'medium';
    if (lower.includes('urgent')) priority = 'urgent';
    else if (lower.includes('high priority')) priority = 'high';
    else if (lower.includes('low priority')) priority = 'low';

    // Due date parsing
    let dueDate = todayStr;
    if (lower.includes('tomorrow')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dueDate = getLocalDateString(d);
    }

    // Due time parsing (e.g. "at 5 PM", "at 14:00", "tonight")
    let dueTime: string | undefined;
    const timeMatch = lower.match(/(?:at|by)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const min = timeMatch[2] ? timeMatch[2] : '00';
      const meridian = timeMatch[3];
      if (meridian === 'pm' && hour < 12) hour += 12;
      if (meridian === 'am' && hour === 12) hour = 0;
      dueTime = `${hour.toString().padStart(2, '0')}:${min}`;
    } else if (lower.includes('tonight')) {
      dueTime = '20:00';
    }

    title = title.replace(/\s+(at|by)\s+\d{1,2}(?::\d{2})?\s*(am|pm)?/i, '').trim();
    if (!title) title = 'New Action Item';

    const toolRes = await executeKronosTool(
      'create_task',
      {
        title,
        dueDate,
        dueTime,
        priority,
        estimatedMinutes: 45,
      },
      userId
    );

    return {
      message: `Task established: **"${title}"**${dueTime ? ` at ${dueTime}` : ''} (${dueDate}) with **${priority.toUpperCase()}** priority. It has been synced to your active mission control dashboard.`,
      toolCalls: [toolRes],
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 3: SCHEDULE / CALENDAR EVENT (e.g. "Schedule a 90 minute deep work session...")
  // --------------------------------------------------------------------------
  if (
    lower.includes('schedule a') ||
    lower.includes('schedule an') ||
    lower.includes('add a run') ||
    lower.includes('add a workout') ||
    lower.includes('block time')
  ) {
    let title = 'Deep Work Session';
    if (lower.includes('run')) title = 'Tempo Run';
    else if (lower.includes('workout')) title = 'Strength & Conditioning';
    else if (lower.includes('study')) title = 'Focused Study Block';

    let durationMins = 60;
    const durMatch = lower.match(/(\d+)\s*(?:minute|min)/i);
    if (durMatch) durationMins = parseInt(durMatch[1], 10);

    let targetDateStr = todayStr;
    if (lower.includes('tomorrow')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      targetDateStr = getLocalDateString(d);
    }

    let startHour = 10;
    if (lower.includes('morning')) startHour = 9;
    else if (lower.includes('evening') || lower.includes('6 pm')) startHour = 18;
    else if (lower.includes('7 pm')) startHour = 19;
    else if (lower.includes('afternoon')) startHour = 14;

    const startIso = `${targetDateStr}T${startHour.toString().padStart(2, '0')}:00:00.000Z`;
    const endHour = Math.floor(startHour + durationMins / 60);
    const endMin = (durationMins % 60).toString().padStart(2, '0');
    const endIso = `${targetDateStr}T${endHour.toString().padStart(2, '0')}:${endMin}:00.000Z`;

    const toolRes = await executeKronosTool(
      'create_event',
      {
        title,
        startTime: startIso,
        endTime: endIso,
        category: lower.includes('run') || lower.includes('workout') ? 'Workout' : 'Focus',
      },
      userId
    );

    return {
      message: `Calendar updated: **"${title}"** scheduled for **${startHour}:00 - ${endHour}:${endMin}** on ${targetDateStr}.`,
      toolCalls: [toolRes],
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 4: COMPLETE TASK / LOG HABIT
  // --------------------------------------------------------------------------
  if (lower.includes('complete') || lower.includes('done') || lower.includes('mark as completed')) {
    const taskName = prompt.replace(/(mark as completed|mark|complete|done)\s+/i, '').trim();
    const toolRes = await executeKronosTool('complete_task', { taskTitle: taskName }, userId);
    return {
      message: toolRes.success
        ? `Marked **"${taskName || 'task'}"** as completed. Streak and progress updated.`
        : `Could not find an open task matching "${taskName}". Please check your task list.`,
      toolCalls: [toolRes],
    };
  }

  if (lower.includes('log habit') || lower.includes('drink water') || lower.includes('meditation') || lower.includes('reading')) {
    const habitTitle = lower.includes('water') ? 'Hydration' : prompt.replace(/log habit\s+/i, '').trim();
    const toolRes = await executeKronosTool('log_habit', { habitTitle }, userId);
    return {
      message: toolRes.success
        ? `Habit logged! Your streak is preserved.`
        : `Could not find active habit matching "${habitTitle}".`,
      toolCalls: [toolRes],
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 5: DAILY MISSION BRIEFING / TODAY'S PRIORITIES
  // --------------------------------------------------------------------------
  if (
    lower.includes('mission') ||
    lower.includes('priority') ||
    lower.includes('today') ||
    lower.includes('what should i do') ||
    lower.includes('focus')
  ) {
    const pendingCount = ctx.tasksSummary.pendingToday;
    const eventsCount = ctx.eventsSummary.todayCount;
    const risksCount = ctx.habitsSummary.atRiskHabits.length;
    const priTasks = ctx.tasksSummary.priorityTasks;

    let response = `**Mission Directive for ${ctx.user.fullName}**:\n\n`;
    response += `• **Tasks Remaining**: ${pendingCount} pending today (${ctx.tasksSummary.completedToday} completed).\n`;
    if (priTasks.length > 0) {
      response += `• **Immediate Priority**: [${priTasks[0].priority.toUpperCase()}] **${priTasks[0].title}**${priTasks[0].dueTime ? ` by ${priTasks[0].dueTime}` : ''}.\n`;
    }
    response += `• **Scheduled Events**: ${eventsCount} blocks today.\n`;
    if (risksCount > 0) {
      response += `• **Streak at Risk**: "${ctx.habitsSummary.atRiskHabits[0].title}" (${ctx.habitsSummary.atRiskHabits[0].currentStreak}-day streak).\n`;
    }
    response += `• **Fitness Target**: ${ctx.fitnessSummary.totalDistanceWeekKm} / ${ctx.fitnessSummary.weeklyGoalKm} km completed (${ctx.fitnessSummary.goalPercentage}%).\n\n`;

    response += `**Recommended Strategy**:\n1. Execute high-priority tasks before midday.\n2. Protect your habit streak this afternoon.\n3. Keep your planned workout on schedule.`;

    return { message: response };
  }

  // --------------------------------------------------------------------------
  // INTENT 6: SCHEDULE OPTIMIZATION / RESCHEDULING
  // --------------------------------------------------------------------------
  if (lower.includes('optimize') || lower.includes('conflict') || lower.includes('overload') || lower.includes('reschedule')) {
    if (ctx.eventsSummary.conflicts.length > 0) {
      const conf = ctx.eventsSummary.conflicts[0];
      return {
        message: `⚡ **Conflict Detected** between **"${conf.eventA}"** and **"${conf.eventB}"** from ${conf.overlapStart} to ${conf.overlapEnd}.\n\n**Recommendation**: Shift "${conf.eventB}" to an open afternoon window (e.g. 15:00) to ensure dedicated focus.`,
        recommendations: [
          {
            id: generateId(),
            title: `Shift "${conf.eventB}"`,
            description: `Move ${conf.eventB} to 15:00 to resolve overlap with ${conf.eventA}`,
            reason: 'Direct scheduling overlap',
          },
        ],
      };
    }

    if (ctx.tasksSummary.overdueCount > 0) {
      const ov = ctx.tasksSummary.overdueTasks[0];
      return {
        message: `Your schedule has **${ctx.tasksSummary.overdueCount} overdue task(s)** requiring reallocation, notably **"${ov.title}"**.\n\n**Recommendation**: Dedicate the next open 45-minute block to resolve "${ov.title}" before starting secondary objectives.`,
      };
    }

    return {
      message: `Your schedule currently has **${ctx.eventsSummary.todayCount} event(s)** and **${ctx.freeTimeSlots.length} open daytime blocks** with no direct collisions. Schedule balance is optimal.`,
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 7: FITNESS PROGRESS & TELEMETRY
  // --------------------------------------------------------------------------
  if (lower.includes('fitness') || lower.includes('workout') || lower.includes('running') || lower.includes('run')) {
    const fit = ctx.fitnessSummary;
    let msg = `🏃 **Weekly Fitness Telemetry**:\n\n`;
    msg += `• **Distance Completed**: ${fit.totalDistanceWeekKm} km / ${fit.weeklyGoalKm} km (${fit.goalPercentage}%)\n`;
    msg += `• **Workouts Logged**: ${fit.activitiesCountWeek} session(s)\n`;
    if (fit.latestActivity) {
      msg += `• **Latest Session**: ${fit.latestActivity.title} (${fit.latestActivity.distanceKm} km, ${fit.latestActivity.durationMinutes} mins, ${fit.latestActivity.calories} kcal)\n\n`;
    }
    if (fit.goalPercentage < 70) {
      const remaining = Math.max(0, fit.weeklyGoalKm - fit.totalDistanceWeekKm);
      msg += `**Observation**: You are ${remaining.toFixed(1)} km away from your weekly goal. A 5 km run today or tomorrow will keep you on pace.`;
    } else {
      msg += `**Observation**: Outstanding pacing! You have achieved ${fit.goalPercentage}% of your target.`;
    }

    return { message: msg };
  }

  // --------------------------------------------------------------------------
  // INTENT 8: GOALS & HABITS ANALYSIS
  // --------------------------------------------------------------------------
  if (lower.includes('goal')) {
    const goals = ctx.goalsSummary.goals;
    if (goals.length === 0) {
      return { message: `You do not have any active goals configured yet. Tell me what you'd like to achieve (e.g. "Create a goal to read 12 books") to set one up.` };
    }

    let msg = `🎯 **Active Goals Progress**:\n\n`;
    for (const g of goals) {
      msg += `• **${g.title}**: ${g.percentage}% complete [${g.category}]\n`;
    }
    const lowest = [...goals].sort((a, b) => a.percentage - b.percentage)[0];
    msg += `\n**Focus Area**: "${lowest.title}" (${lowest.percentage}%) needs attention this week.`;
    return { message: msg };
  }

  if (lower.includes('habit')) {
    const risks = ctx.habitsSummary.atRiskHabits;
    if (risks.length > 0) {
      let msg = `⚠️ **Habits at Risk Today**:\n\n`;
      for (const r of risks) {
        msg += `• **${r.title}**: ${r.currentStreak}-day streak at risk (${r.targetDaysPerWeek} days/week target)\n`;
      }
      msg += `\nComplete these today to avoid resetting your consistency multiplier.`;
      return { message: msg };
    }

    return {
      message: `All your active habits are either completed or on track for today (${ctx.habitsSummary.completedToday}/${ctx.habitsSummary.totalActive} logged). Outstanding consistency!`,
    };
  }

  // --------------------------------------------------------------------------
  // GENERAL INTELLIGENCE RESPONSE
  // --------------------------------------------------------------------------
  return {
    message: `Mission Control online, ${ctx.user.fullName}.\n\nYou currently have **${ctx.tasksSummary.pendingToday} tasks pending**, **${ctx.eventsSummary.todayCount} scheduled events**, and **${ctx.fitnessSummary.totalDistanceWeekKm} km** logged toward your weekly fitness target.\n\nHow would you like to direct your mission? You can ask me to schedule events, complete tasks, analyze goals, or optimize your day.`,
  };
}
