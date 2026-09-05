// ==============================================================================
// KRONOS PHASE 4: AI MISSION CONTROL - CONTROLLED FUNCTION / TOOL LAYER
// ==============================================================================

import { ToolDefinition, ToolExecutionResult, PendingActionPayload } from './aiTypes';
import { useLifeOsStore } from '../../store/useLifeOsStore';
import { Priority, TaskStatus, SportType } from '../../types/models';
import { generateId } from '../../lib/utils';
import { getLocalDateString } from '../tasks/taskUtils';

export const KRONOS_TOOLS: ToolDefinition[] = [
  // 1. Task Tools
  {
    name: 'create_task',
    description: 'Create a new task in KRONOS Life OS with priority, due date, and estimated duration.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Optional detailed notes or description' },
        dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format (defaults to today)' },
        dueTime: { type: 'string', description: 'Due time in HH:mm 24-hour format (e.g. 14:30)' },
        priority: {
          type: 'string',
          description: 'Task priority level',
          enum: ['low', 'medium', 'high', 'urgent'],
        },
        category: { type: 'string', description: 'Category (e.g., Work, Health, Personal, Study)' },
        estimatedMinutes: { type: 'number', description: 'Estimated duration in minutes (e.g., 30, 45, 90)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed using either its task ID or matching title.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'The unique ID of the task to complete' },
        taskTitle: { type: 'string', description: 'The title of the task if ID is unknown' },
      },
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task details like priority, due time, or title.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'The ID of the task to update' },
        title: { type: 'string', description: 'Updated title' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Updated priority' },
        dueTime: { type: 'string', description: 'Updated due time in HH:mm' },
        dueDate: { type: 'string', description: 'Updated due date in YYYY-MM-DD' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task. This is a DESTRUCTIVE action requiring user confirmation.',
    isDestructive: true,
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'The ID of the task to delete' },
        taskTitle: { type: 'string', description: 'Title of the task for confirmation resolution' },
        isConfirmed: { type: 'boolean', description: 'Set to true only after explicit user confirmation' },
      },
    },
  },
  {
    name: 'list_tasks',
    description: 'List user tasks filtered by date or status.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Filter by date YYYY-MM-DD (e.g. today)' },
        status: { type: 'string', enum: ['pending', 'completed', 'all'], description: 'Filter by status' },
      },
    },
  },

  // 2. Habit Tools
  {
    name: 'log_habit',
    description: 'Log or toggle completion of a habit for today.',
    parameters: {
      type: 'object',
      properties: {
        habitId: { type: 'string', description: 'The ID of the habit' },
        habitTitle: { type: 'string', description: 'Title of the habit if ID is unknown' },
      },
    },
  },
  {
    name: 'create_habit',
    description: 'Create a new daily or weekly habit with target streak frequency.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Name of the habit' },
        category: { type: 'string', description: 'Category (Health, Mind, Productivity, etc.)' },
        targetDaysPerWeek: { type: 'number', description: 'Target frequency per week (1-7)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_habits',
    description: 'List all active habits and their streak statuses.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  // 3. Goal Tools
  {
    name: 'create_goal',
    description: 'Create a measurable goal with target value, unit, and deadline.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Goal title' },
        targetValue: { type: 'number', description: 'Target numerical value (e.g., 100, 50, 25)' },
        unit: { type: 'string', description: 'Unit of measurement (e.g., %, km, hours, books)' },
        category: { type: 'string', description: 'Category (Fitness, Career, Learning, Personal)' },
        deadline: { type: 'string', description: 'Target deadline in YYYY-MM-DD' },
      },
      required: ['title', 'targetValue', 'unit'],
    },
  },
  {
    name: 'update_goal_progress',
    description: 'Update the progress value of an existing goal.',
    parameters: {
      type: 'object',
      properties: {
        goalId: { type: 'string', description: 'The ID of the goal' },
        goalTitle: { type: 'string', description: 'Goal title if ID is unknown' },
        newValue: { type: 'number', description: 'The new current value' },
        isDelta: { type: 'boolean', description: 'Whether newValue is an incremental delta or absolute' },
      },
    },
  },
  {
    name: 'list_goals',
    description: 'List active goals with their current completion percentages.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  // 4. Calendar & Event Tools
  {
    name: 'create_event',
    description: 'Schedule a calendar event or time block in KRONOS.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the event' },
        startTime: { type: 'string', description: 'ISO start time string (e.g. 2026-09-06T10:00:00.000Z)' },
        endTime: { type: 'string', description: 'ISO end time string (e.g. 2026-09-06T11:30:00.000Z)' },
        category: { type: 'string', description: 'Category (Work, Workout, Study, Personal)' },
        description: { type: 'string', description: 'Optional description or location' },
      },
      required: ['title', 'startTime', 'endTime'],
    },
  },
  {
    name: 'delete_event',
    description: 'Delete a scheduled calendar event. This is a DESTRUCTIVE action.',
    isDestructive: true,
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The ID of the event to delete' },
        eventTitle: { type: 'string', description: 'Title of the event if ID is unknown' },
        isConfirmed: { type: 'boolean', description: 'Set to true only after explicit user confirmation' },
      },
    },
  },
  {
    name: 'find_free_time',
    description: 'Find open, unscheduled time blocks in the user schedule.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' },
        minimumMinutes: { type: 'number', description: 'Minimum block duration in minutes (default 30)' },
      },
    },
  },

  // 5. Reminder Tools
  {
    name: 'create_reminder',
    description: 'Create an alert or reminder for a specific time.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'What to remind the user of' },
        remindAt: { type: 'string', description: 'ISO timestamp or HH:mm time string today' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level' },
      },
      required: ['title', 'remindAt'],
    },
  },

  // 6. Fitness & Telemetry Tools
  {
    name: 'get_fitness_trends',
    description: 'Retrieve user fitness telemetry, weekly distance, pace, and workout summary.',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Number of past days to inspect (default 7)' },
      },
    },
  },
];

/**
 * Executes a controlled KRONOS tool safely against the store and database.
 * Enforces user confirmation on destructive actions.
 */
export async function executeKronosTool(
  toolName: string,
  args: Record<string, any>,
  userId: string
): Promise<ToolExecutionResult> {
  const store = useLifeOsStore.getState();
  const toolCallId = generateId();

  try {
    switch (toolName) {
      // ------------------------------------------------------------------------
      // TASK TOOLS
      // ------------------------------------------------------------------------
      case 'create_task': {
        const todayStr = getLocalDateString();
        const dueDate = args.dueDate || todayStr;
        const priority: Priority = (args.priority as Priority) || 'medium';

        const result = await store.addTask(userId, {
          title: args.title,
          description: args.description || '',
          dueDate,
          dueTime: args.dueTime,
          priority,
          category: args.category || 'General',
          estimatedMinutes: args.estimatedMinutes || 30,
        });

        if (!result.success) {
          return { toolCallId, toolName, success: false, error: result.error };
        }

        return {
          toolCallId,
          toolName,
          success: true,
          result: {
            message: `Created task "${args.title}" due ${dueDate}${args.dueTime ? ` at ${args.dueTime}` : ''} [${priority.toUpperCase()} priority].`,
          },
        };
      }

      case 'complete_task': {
        let task = args.taskId ? store.tasks.find((t) => t.id === args.taskId) : null;
        if (!task && args.taskTitle) {
          const lower = args.taskTitle.toLowerCase();
          task = store.tasks.find((t) => t.title.toLowerCase().includes(lower) && t.status !== 'completed');
        }

        if (!task) {
          return { toolCallId, toolName, success: false, error: `Could not find pending task matching "${args.taskTitle || args.taskId}".` };
        }

        const res = await store.toggleTask(task.id);
        return {
          toolCallId,
          toolName,
          success: res.success,
          result: { message: `Completed task: "${task.title}".` },
        };
      }

      case 'update_task': {
        const task = store.tasks.find((t) => t.id === args.taskId);
        if (!task) {
          return { toolCallId, toolName, success: false, error: `Task not found with ID ${args.taskId}` };
        }

        const updates: any = {};
        if (args.title) updates.title = args.title;
        if (args.priority) updates.priority = args.priority;
        if (args.dueTime) updates.dueTime = args.dueTime;
        if (args.dueDate) updates.dueDate = args.dueDate;

        const res = await store.updateTask(task.id, updates);
        return {
          toolCallId,
          toolName,
          success: res.success,
          result: { message: `Updated task "${task.title}".` },
        };
      }

      case 'delete_task': {
        let task = args.taskId ? store.tasks.find((t) => t.id === args.taskId) : null;
        if (!task && args.taskTitle) {
          const lower = args.taskTitle.toLowerCase();
          task = store.tasks.find((t) => t.title.toLowerCase().includes(lower));
        }

        const taskTitle = task ? task.title : (args.taskTitle || 'selected task');
        const taskId = task ? task.id : (args.taskId || 'target-task');

        // Check explicit confirmation first
        if (!args.isConfirmed) {
          const pendingAction: PendingActionPayload = {
            id: generateId(),
            toolName: 'delete_task',
            description: `Delete task "${taskTitle}"`,
            destructive: true,
            payload: { taskId, taskTitle, isConfirmed: true },
          };

          return {
            toolCallId,
            toolName,
            success: true,
            requiresConfirmation: true,
            confirmationPrompt: `Are you sure you want to delete task "${taskTitle}"?`,
            pendingAction,
            result: { pending: true },
          };
        }

        if (!task) {
          return { toolCallId, toolName, success: false, error: `Task not found to delete.` };
        }

        const res = await store.deleteTask(task.id);
        return {
          toolCallId,
          toolName,
          success: res.success,
          result: { message: `Deleted task "${task.title}".` },
        };
      }

      case 'list_tasks': {
        const todayStr = getLocalDateString();
        const dateFilter = args.date || todayStr;
        const tasks = store.tasks.filter((t) => {
          if (args.status === 'pending' && t.status === 'completed') return false;
          if (args.status === 'completed' && t.status !== 'completed') return false;
          if (dateFilter !== 'all' && t.dueDate && t.dueDate !== dateFilter) return false;
          return true;
        });

        return {
          toolCallId,
          toolName,
          success: true,
          result: {
            count: tasks.length,
            tasks: tasks.slice(0, 10).map((t) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              status: t.status,
              dueTime: t.dueTime,
            })),
          },
        };
      }

      // ------------------------------------------------------------------------
      // HABIT TOOLS
      // ------------------------------------------------------------------------
      case 'log_habit': {
        let habit = args.habitId ? store.habits.find((h) => h.id === args.habitId) : null;
        if (!habit && args.habitTitle) {
          const lower = args.habitTitle.toLowerCase();
          habit = store.habits.find((h) => h.title.toLowerCase().includes(lower));
        }

        if (!habit) {
          return { toolCallId, toolName, success: false, error: `Could not find habit matching "${args.habitTitle || args.habitId}".` };
        }

        const res = await store.toggleHabit(userId, habit.id);
        const updated = store.habits.find((h) => h.id === habit!.id);
        const streakNow = updated ? updated.currentStreak : habit.currentStreak;

        return {
          toolCallId,
          toolName,
          success: res.success,
          result: {
            message: `Logged habit "${habit.title}". Current streak: ${streakNow} days!`,
          },
        };
      }

      case 'create_habit': {
        const res = await store.addHabit(userId, {
          title: args.title,
          category: args.category || 'Health',
          targetDaysPerWeek: args.targetDaysPerWeek || 7,
          frequency: 'daily',
          color: '#38BDF8',
          icon: 'sparkles',
        });

        return {
          toolCallId,
          toolName,
          success: res.success,
          result: { message: `Created habit "${args.title}" with target ${args.targetDaysPerWeek || 7} days/week.` },
        };
      }

      case 'list_habits': {
        const active = store.habits.filter((h) => !h.isArchived);
        return {
          toolCallId,
          toolName,
          success: true,
          result: {
            count: active.length,
            habits: active.map((h) => ({
              id: h.id,
              title: h.title,
              streak: h.currentStreak,
              completedToday: Boolean(h.completedToday),
            })),
          },
        };
      }

      // ------------------------------------------------------------------------
      // GOAL TOOLS
      // ------------------------------------------------------------------------
      case 'create_goal': {
        const res = await store.addGoal(userId, {
          title: args.title,
          targetValue: args.targetValue,
          currentValue: 0,
          unit: args.unit,
          category: args.category || 'Personal',
          targetDate: args.deadline,
          status: 'active',
        });

        return {
          toolCallId,
          toolName,
          success: res.success,
          result: { message: `Created goal "${args.title}" with target ${args.targetValue} ${args.unit}.` },
        };
      }

      case 'update_goal_progress': {
        let goal = args.goalId ? store.goals.find((g) => g.id === args.goalId) : null;
        if (!goal && args.goalTitle) {
          const lower = args.goalTitle.toLowerCase();
          goal = store.goals.find((g) => g.title.toLowerCase().includes(lower));
        }

        if (!goal) {
          return { toolCallId, toolName, success: false, error: `Goal not found.` };
        }

        const res = await store.updateGoalProgress(goal.id, args.newValue, args.isDelta);
        return {
          toolCallId,
          toolName,
          success: res.success,
          result: { message: `Updated progress for "${goal.title}".` },
        };
      }

      case 'list_goals': {
        const goals = store.goals.filter((g) => g.status === 'active');
        return {
          toolCallId,
          toolName,
          success: true,
          result: {
            goals: goals.map((g) => {
              const pct = g.targetValue > 0 ? Math.round((g.currentValue / g.targetValue) * 100) : 0;
              return {
                id: g.id,
                title: g.title,
                current: g.currentValue,
                target: g.targetValue,
                unit: g.unit,
                percentage: pct,
              };
            }),
          },
        };
      }

      // ------------------------------------------------------------------------
      // CALENDAR / EVENT TOOLS
      // ------------------------------------------------------------------------
      case 'create_event': {
        const res = await store.addEvent(userId, {
          title: args.title,
          description: args.description || '',
          startTime: args.startTime,
          endTime: args.endTime,
          isAllDay: false,
          category: args.category || 'General',
          color: '#4F8CFF',
        });

        const startDisplay = new Date(args.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const endDisplay = new Date(args.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        return {
          toolCallId,
          toolName,
          success: res.success,
          result: { message: `Scheduled "${args.title}" from ${startDisplay} to ${endDisplay}.` },
        };
      }

      case 'delete_event': {
        let event = args.eventId ? store.events.find((e) => e.id === args.eventId) : null;
        if (!event && args.eventTitle) {
          const lower = args.eventTitle.toLowerCase();
          event = store.events.find((e) => e.title.toLowerCase().includes(lower));
        }

        const eventTitle = event ? event.title : (args.eventTitle || 'scheduled item');
        const eventId = event ? event.id : (args.eventId || 'target-event');

        if (!args.isConfirmed) {
          const pendingAction: PendingActionPayload = {
            id: generateId(),
            toolName: 'delete_event',
            description: `Delete scheduled event "${eventTitle}"`,
            destructive: true,
            payload: { eventId, eventTitle, isConfirmed: true },
          };

          return {
            toolCallId,
            toolName,
            success: true,
            requiresConfirmation: true,
            confirmationPrompt: `Are you sure you want to remove event "${eventTitle}" from your schedule?`,
            pendingAction,
            result: { pending: true },
          };
        }

        if (!event) {
          return { toolCallId, toolName, success: false, error: `Event not found to delete.` };
        }

        const res = await store.deleteEvent(event.id);
        return {
          toolCallId,
          toolName,
          success: res.success,
          result: { message: `Deleted event "${event.title}".` },
        };
      }

      case 'find_free_time': {
        const todayStr = args.date || getLocalDateString();
        const minMins = args.minimumMinutes || 30;
        const dayEvents = store.events.filter((e) => {
          const eDate = e.startTime.substring(0, 10);
          return eDate === todayStr && !e.isAllDay;
        });

        // Compute gaps
        const freeSlots = computeFreeGaps(todayStr, dayEvents, minMins);
        return {
          toolCallId,
          toolName,
          success: true,
          result: {
            date: todayStr,
            freeSlots,
          },
        };
      }

      // ------------------------------------------------------------------------
      // REMINDER TOOLS
      // ------------------------------------------------------------------------
      case 'create_reminder': {
        let remindAtIso = args.remindAt;
        if (args.remindAt.includes(':') && !args.remindAt.includes('T')) {
          // HH:mm format today
          const today = getLocalDateString();
          remindAtIso = `${today}T${args.remindAt}:00.000Z`;
        }

        const res = await store.addReminder(userId, {
          title: args.title,
          remindAt: remindAtIso,
          priority: args.priority || 'medium',
        });

        const timeDisplay = new Date(remindAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        return {
          toolCallId,
          toolName,
          success: res.success,
          result: { message: `Set reminder for "${args.title}" at ${timeDisplay}.` },
        };
      }

      // ------------------------------------------------------------------------
      // FITNESS TOOLS
      // ------------------------------------------------------------------------
      case 'get_fitness_trends': {
        const stats = store.getWeeklyFitnessStats();
        const latest = store.activities[0];
        return {
          toolCallId,
          toolName,
          success: true,
          result: {
            weeklyDistanceKm: stats.totalDistanceKm,
            totalWorkouts: stats.activitiesCount,
            totalCalories: stats.totalCalories,
            latestWorkout: latest
              ? {
                  title: latest.title,
                  sport: latest.sportType,
                  distanceKm: Number(((latest.distanceMeters || 0) / 1000).toFixed(2)),
                  durationMinutes: Math.round((latest.durationSeconds || 0) / 60),
                }
              : null,
          },
        };
      }

      default:
        return { toolCallId, toolName, success: false, error: `Unknown tool "${toolName}".` };
    }
  } catch (err: any) {
    return {
      toolCallId,
      toolName,
      success: false,
      error: err?.message || 'Error executing tool',
    };
  }
}

function computeFreeGaps(dateStr: string, events: any[], minMins: number) {
  const dayStart = 8 * 60; // 08:00
  const dayEnd = 22 * 60; // 22:00

  const intervals: [number, number][] = [];
  for (const e of events) {
    const s = new Date(e.startTime);
    const end = new Date(e.endTime);
    intervals.push([s.getHours() * 60 + s.getMinutes(), end.getHours() * 60 + end.getMinutes()]);
  }
  intervals.sort((a, b) => a[0] - b[0]);

  const slots: string[] = [];
  let cur = dayStart;
  for (const [start, end] of intervals) {
    if (start - cur >= minMins) {
      const sh = Math.floor(cur / 60).toString().padStart(2, '0');
      const sm = (cur % 60).toString().padStart(2, '0');
      const eh = Math.floor(start / 60).toString().padStart(2, '0');
      const em = (start % 60).toString().padStart(2, '0');
      slots.push(`${sh}:${sm} - ${eh}:${em} (${start - cur}m)`);
    }
    cur = Math.max(cur, end);
  }

  if (dayEnd - cur >= minMins) {
    const sh = Math.floor(cur / 60).toString().padStart(2, '0');
    const sm = (cur % 60).toString().padStart(2, '0');
    const eh = Math.floor(dayEnd / 60).toString().padStart(2, '0');
    const em = (dayEnd % 60).toString().padStart(2, '0');
    slots.push(`${sh}:${sm} - ${eh}:${em} (${dayEnd - cur}m)`);
  }

  return slots;
}
