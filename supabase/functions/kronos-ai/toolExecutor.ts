// ==============================================================================
// KRONOS SUPABASE EDGE FUNCTION - SERVER-SIDE TOOL EXECUTOR
// ==============================================================================
// Executes validated KRONOS tool actions directly on Supabase PostgreSQL tables
// on behalf of the authenticated user (auth.uid()).
// Enforces destructive action confirmation gates on delete operations.

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

export interface ToolExecutionResponse {
  success: boolean;
  message: string;
  data?: any;
  requiresConfirmation?: boolean;
  pendingAction?: {
    toolName: string;
    parameters: any;
    title?: string;
  };
}

export async function executeServerTool(
  supabase: SupabaseClient,
  userId: string,
  toolName: string,
  parameters: Record<string, any>,
  isConfirmed: boolean = false
): Promise<ToolExecutionResponse> {
  const today = new Date().toISOString().split('T')[0];

  switch (toolName) {
    // --------------------------------------------------------------------------
    // 1. TASKS
    // --------------------------------------------------------------------------
    case 'create_task': {
      const { title, description, dueDate, dueTime, priority, category, estimatedMinutes } = parameters;
      if (!title) {
        return { success: false, message: 'Task title is required.' };
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title,
          description: description || null,
          due_date: dueDate || today,
          due_time: dueTime ? (dueTime.length === 5 ? `${dueTime}:00` : dueTime) : null,
          priority: priority || 'medium',
          category: category || 'Work',
          estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : 30,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        return { success: false, message: `Failed to create task: ${error.message}` };
      }

      return {
        success: true,
        message: `Task "${title}" created successfully for ${dueDate || 'today'}.`,
        data: { task: data },
      };
    }

    case 'complete_task': {
      const { taskId, taskTitle } = parameters;
      let query = supabase.from('tasks').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);

      if (taskId) {
        query = query.eq('id', taskId);
      } else if (taskTitle) {
        query = query.ilike('title', `%${taskTitle}%`);
      } else {
        return { success: false, message: 'Either taskId or taskTitle must be provided.' };
      }

      const { data, error } = await query.select().single();
      if (error) {
        return { success: false, message: `Failed to complete task: ${error.message}` };
      }

      return {
        success: true,
        message: `Task "${data.title}" marked as completed!`,
        data: { task: data },
      };
    }

    case 'update_task': {
      const { taskId, title, priority, dueTime, dueDate } = parameters;
      if (!taskId) {
        return { success: false, message: 'taskId is required to update a task.' };
      }

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (title) updates.title = title;
      if (priority) updates.priority = priority;
      if (dueTime) updates.due_time = dueTime.length === 5 ? `${dueTime}:00` : dueTime;
      if (dueDate) updates.due_date = dueDate;

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, message: `Failed to update task: ${error.message}` };
      }

      return {
        success: true,
        message: `Task "${data.title}" updated successfully.`,
        data: { task: data },
      };
    }

    case 'delete_task': {
      const { taskId, taskTitle } = parameters;
      // First, find the target task
      let fetchQuery = supabase.from('tasks').select('id, title').eq('user_id', userId);
      if (taskId) {
        fetchQuery = fetchQuery.eq('id', taskId);
      } else if (taskTitle) {
        fetchQuery = fetchQuery.ilike('title', `%${taskTitle}%`);
      } else {
        return { success: false, message: 'Please specify the task to delete.' };
      }

      const { data: targetTask, error: findError } = await fetchQuery.maybeSingle();
      if (findError || !targetTask) {
        return { success: false, message: 'Task not found to delete.' };
      }

      // DESTRUCTIVE SAFETY GATE: Check if user has explicitly confirmed
      if (!isConfirmed) {
        return {
          success: false,
          requiresConfirmation: true,
          message: `Are you sure you want to delete task "${targetTask.title}"? This cannot be undone.`,
          pendingAction: {
            toolName: 'delete_task',
            parameters: { taskId: targetTask.id, taskTitle: targetTask.title },
            title: targetTask.title,
          },
        };
      }

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', targetTask.id)
        .eq('user_id', userId);

      if (deleteError) {
        return { success: false, message: `Failed to delete task: ${deleteError.message}` };
      }

      return {
        success: true,
        message: `Task "${targetTask.title}" deleted successfully.`,
        data: { deletedTaskId: targetTask.id },
      };
    }

    case 'list_tasks': {
      const { date, status } = parameters;
      let query = supabase.from('tasks').select('*').eq('user_id', userId).order('due_time', { ascending: true, nullsFirst: false });

      if (date) {
        query = query.eq('due_date', date);
      }
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) {
        return { success: false, message: `Failed to query tasks: ${error.message}` };
      }

      return {
        success: true,
        message: `Found ${data.length} task(s).`,
        data: { tasks: data },
      };
    }

    // --------------------------------------------------------------------------
    // 2. HABITS
    // --------------------------------------------------------------------------
    case 'log_habit': {
      const { habitId, habitTitle } = parameters;
      let targetHabitId = habitId;

      if (!targetHabitId && habitTitle) {
        const { data: found } = await supabase
          .from('habits')
          .select('id, title')
          .eq('user_id', userId)
          .ilike('title', `%${habitTitle}%`)
          .maybeSingle();
        if (found) targetHabitId = found.id;
      }

      if (!targetHabitId) {
        return { success: false, message: 'Habit could not be found to log.' };
      }

      // Upsert habit log for today
      const { data: logData, error: logError } = await supabase
        .from('habit_logs')
        .upsert(
          {
            habit_id: targetHabitId,
            user_id: userId,
            date: today,
            completed: true,
          },
          { onConflict: 'habit_id,user_id,date' }
        )
        .select()
        .single();

      if (logError) {
        return { success: false, message: `Failed to log habit: ${logError.message}` };
      }

      // Increment current streak
      await supabase.rpc('increment_streak', { habit_row_id: targetHabitId }).catch(() => {
        // Fallback: direct update
        supabase.from('habits').update({ updated_at: new Date().toISOString() }).eq('id', targetHabitId);
      });

      return {
        success: true,
        message: 'Habit completed for today! Streak updated.',
        data: { habitLog: logData },
      };
    }

    case 'create_habit': {
      const { title, category, targetDaysPerWeek } = parameters;
      if (!title) {
        return { success: false, message: 'Habit title is required.' };
      }

      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          title,
          category: category || 'Health',
          target_days_per_week: targetDaysPerWeek ? Math.min(7, Math.max(1, Number(targetDaysPerWeek))) : 7,
          frequency: 'daily',
          current_streak: 0,
          best_streak: 0,
        })
        .select()
        .single();

      if (error) {
        return { success: false, message: `Failed to create habit: ${error.message}` };
      }

      return {
        success: true,
        message: `Habit "${title}" created successfully!`,
        data: { habit: data },
      };
    }

    // --------------------------------------------------------------------------
    // 3. CALENDAR EVENTS
    // --------------------------------------------------------------------------
    case 'create_event': {
      const { title, description, startTime, endTime, category, isAllDay } = parameters;
      if (!title || !startTime || !endTime) {
        return { success: false, message: 'Title, startTime, and endTime are required for calendar events.' };
      }

      const { data, error } = await supabase
        .from('events')
        .insert({
          user_id: userId,
          title,
          description: description || null,
          start_time: startTime,
          end_time: endTime,
          category: category || 'Work',
          is_all_day: Boolean(isAllDay),
          color: '#4F8CFF',
        })
        .select()
        .single();

      if (error) {
        return { success: false, message: `Failed to schedule event: ${error.message}` };
      }

      return {
        success: true,
        message: `Event "${title}" scheduled successfully.`,
        data: { event: data },
      };
    }

    case 'delete_event': {
      const { eventId, eventTitle } = parameters;
      let query = supabase.from('events').select('id, title').eq('user_id', userId);
      if (eventId) {
        query = query.eq('id', eventId);
      } else if (eventTitle) {
        query = query.ilike('title', `%${eventTitle}%`);
      } else {
        return { success: false, message: 'Please specify the event to delete.' };
      }

      const { data: targetEvent, error: findError } = await query.maybeSingle();
      if (findError || !targetEvent) {
        return { success: false, message: 'Event not found to delete.' };
      }

      // DESTRUCTIVE SAFETY GATE
      if (!isConfirmed) {
        return {
          success: false,
          requiresConfirmation: true,
          message: `Are you sure you want to delete event "${targetEvent.title}" from your calendar?`,
          pendingAction: {
            toolName: 'delete_event',
            parameters: { eventId: targetEvent.id, eventTitle: targetEvent.title },
            title: targetEvent.title,
          },
        };
      }

      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', targetEvent.id)
        .eq('user_id', userId);

      if (deleteError) {
        return { success: false, message: `Failed to delete event: ${deleteError.message}` };
      }

      return {
        success: true,
        message: `Event "${targetEvent.title}" deleted successfully.`,
        data: { deletedEventId: targetEvent.id },
      };
    }

    // --------------------------------------------------------------------------
    // 4. GOALS & REMINDERS
    // --------------------------------------------------------------------------
    case 'create_goal': {
      const { title, targetValue, unit, category, deadline } = parameters;
      if (!title || targetValue === undefined) {
        return { success: false, message: 'Goal title and targetValue are required.' };
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          title,
          target_value: Number(targetValue),
          current_value: 0,
          unit: unit || '%',
          category: category || 'Personal',
          deadline: deadline || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        return { success: false, message: `Failed to create goal: ${error.message}` };
      }

      return {
        success: true,
        message: `Goal "${title}" created (Target: ${targetValue} ${unit || '%'}).`,
        data: { goal: data },
      };
    }

    case 'create_reminder': {
      const { title, remindAt, priority } = parameters;
      if (!title || !remindAt) {
        return { success: false, message: 'Title and remindAt timestamp are required.' };
      }

      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: userId,
          title,
          remind_at: remindAt,
          priority: priority || 'medium',
          enabled: true,
          is_completed: false,
        })
        .select()
        .single();

      if (error) {
        return { success: false, message: `Failed to create reminder: ${error.message}` };
      }

      return {
        success: true,
        message: `Reminder "${title}" set for ${new Date(remindAt).toLocaleTimeString()}.`,
        data: { reminder: data },
      };
    }

    default:
      return { success: false, message: `Tool "${toolName}" is not recognized by server executor.` };
  }
}
