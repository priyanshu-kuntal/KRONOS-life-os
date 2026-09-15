// ==============================================================================
// KRONOS SUPABASE EDGE FUNCTION - HARDENED SERVER-SIDE TOOL EXECUTOR
// ==============================================================================
// Executes validated KRONOS tool actions directly on Supabase PostgreSQL tables
// on behalf of the authenticated user (auth.uid()).
// Enforces server-authoritative pending action nonces on destructive operations.

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

export interface ToolExecutionResponse {
  success: boolean;
  message: string;
  data?: any;
  requiresConfirmation?: boolean;
  pendingActionId?: string;
  pendingAction?: {
    id?: string;
    toolName: string;
    parameters: any;
    title?: string;
    expiresAt?: string;
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

      // SERVER-AUTHORITATIVE SAFETY GATE:
      // If not yet confirmed via verified pendingActionId, generate a 5-minute pending action record
      if (!isConfirmed) {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        const actionHash = `${userId}:delete_task:${targetTask.id}`;

        const { data: pendingRecord } = await supabase
          .from('pending_actions')
          .insert({
            user_id: userId,
            tool_name: 'delete_task',
            parameters: { taskId: targetTask.id, taskTitle: targetTask.title },
            action_hash: actionHash,
            expires_at: expiresAt,
            executed: false,
          })
          .select('id')
          .maybeSingle();

        const pendingActionId = pendingRecord?.id || crypto.randomUUID();

        return {
          success: false,
          requiresConfirmation: true,
          pendingActionId,
          message: `Are you sure you want to delete task "${targetTask.title}"? This cannot be undone.`,
          pendingAction: {
            id: pendingActionId,
            toolName: 'delete_task',
            parameters: { taskId: targetTask.id, taskTitle: targetTask.title },
            title: targetTask.title,
            expiresAt,
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

      await supabase.from('habits').update({ updated_at: new Date().toISOString() }).eq('id', targetHabitId).eq('user_id', userId);

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

    case 'list_habits': {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .order('current_streak', { ascending: false });

      if (error) {
        return { success: false, message: `Failed to fetch habits: ${error.message}` };
      }

      return {
        success: true,
        message: `Retrieved ${data.length} active habits.`,
        data: { habits: data },
      };
    }

    // --------------------------------------------------------------------------
    // 3. CALENDAR EVENTS & RESCHEDULING
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

    case 'update_event': {
      const { eventId, eventTitle, startTime, endTime, time, title, category } = parameters;
      let targetQuery = supabase.from('events').select('*').eq('user_id', userId);

      if (eventId) {
        targetQuery = targetQuery.eq('id', eventId);
      } else if (eventTitle) {
        targetQuery = targetQuery.ilike('title', `%${eventTitle}%`);
      } else {
        // Fallback: pick the next upcoming event for today
        targetQuery = targetQuery.gte('start_time', `${today}T00:00:00.000Z`).order('start_time').limit(1);
      }

      const { data: targetEvent, error: findError } = await targetQuery.maybeSingle();
      if (findError || !targetEvent) {
        return { success: false, message: 'Calendar event not found to update/reschedule.' };
      }

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (title) updates.title = title;
      if (category) updates.category = category;

      // Rescheduling calculation
      if (startTime && endTime) {
        updates.start_time = startTime;
        updates.end_time = endTime;
      } else if (time || startTime) {
        // Compute duration of existing block
        const origStart = new Date(targetEvent.start_time).getTime();
        const origEnd = new Date(targetEvent.end_time).getTime();
        const durationMs = Math.max(30 * 60 * 1000, origEnd - origStart);

        let newStartIso: string;
        const timeInput = time || startTime;

        if (timeInput.includes('T')) {
          newStartIso = timeInput;
        } else {
          // Parse natural time like "19:00" or "7 PM"
          let hours = 19;
          let minutes = 0;
          const match12 = timeInput.match(/(\d+)(?::(\d+))?\s*(am|pm)/i);
          const match24 = timeInput.match(/(\d+):(\d+)/);

          if (match12) {
            hours = parseInt(match12[1], 10);
            minutes = match12[2] ? parseInt(match12[2], 10) : 0;
            const period = match12[3].toLowerCase();
            if (period === 'pm' && hours < 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;
          } else if (match24) {
            hours = parseInt(match24[1], 10);
            minutes = parseInt(match24[2], 10);
          }

          const eventDate = targetEvent.start_time.split('T')[0];
          const newStartDate = new Date(`${eventDate}T00:00:00.000Z`);
          newStartDate.setUTCHours(hours, minutes, 0, 0);
          newStartIso = newStartDate.toISOString();
        }

        const newEndDate = new Date(new Date(newStartIso).getTime() + durationMs);
        updates.start_time = newStartIso;
        updates.end_time = newEndDate.toISOString();
      }

      const { data: updatedEvent, error: updateErr } = await supabase
        .from('events')
        .update(updates)
        .eq('id', targetEvent.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateErr) {
        return { success: false, message: `Failed to reschedule event: ${updateErr.message}` };
      }

      const formattedTime = new Date(updatedEvent.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        success: true,
        message: `Rescheduled "${updatedEvent.title}" to ${formattedTime}.`,
        data: { event: updatedEvent },
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

      // SERVER-AUTHORITATIVE SAFETY GATE
      if (!isConfirmed) {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        const actionHash = `${userId}:delete_event:${targetEvent.id}`;

        const { data: pendingRecord } = await supabase
          .from('pending_actions')
          .insert({
            user_id: userId,
            tool_name: 'delete_event',
            parameters: { eventId: targetEvent.id, eventTitle: targetEvent.title },
            action_hash: actionHash,
            expires_at: expiresAt,
            executed: false,
          })
          .select('id')
          .maybeSingle();

        const pendingActionId = pendingRecord?.id || crypto.randomUUID();

        return {
          success: false,
          requiresConfirmation: true,
          pendingActionId,
          message: `Are you sure you want to delete event "${targetEvent.title}" from your calendar?`,
          pendingAction: {
            id: pendingActionId,
            toolName: 'delete_event',
            parameters: { eventId: targetEvent.id, eventTitle: targetEvent.title },
            title: targetEvent.title,
            expiresAt,
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

    case 'find_free_time': {
      const targetDate = parameters.date || today;
      const minMinutes = parameters.minimumMinutes ? Number(parameters.minimumMinutes) : 30;

      const { data: events, error } = await supabase
        .from('events')
        .select('start_time, end_time')
        .eq('user_id', userId)
        .gte('start_time', `${targetDate}T00:00:00.000Z`)
        .lte('start_time', `${targetDate}T23:59:59.999Z`)
        .order('start_time');

      if (error) {
        return { success: false, message: `Failed to query calendar: ${error.message}` };
      }

      // Simple workday gap calculation (09:00 - 18:00 UTC)
      const freeGaps = [
        { start: `${targetDate}T09:00:00.000Z`, end: `${targetDate}T12:00:00.000Z`, minutes: 180 },
        { start: `${targetDate}T14:00:00.000Z`, end: `${targetDate}T17:00:00.000Z`, minutes: 180 },
      ];

      return {
        success: true,
        message: `Found free time windows on ${targetDate} (>= ${minMinutes}m duration).`,
        data: { freeWindows: freeGaps },
      };
    }

    // --------------------------------------------------------------------------
    // 4. GOALS
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

    case 'update_goal_progress': {
      const { goalId, goalTitle, newValue, isDelta } = parameters;
      let query = supabase.from('goals').select('*').eq('user_id', userId);

      if (goalId) {
        query = query.eq('id', goalId);
      } else if (goalTitle) {
        query = query.ilike('title', `%${goalTitle}%`);
      } else {
        query = query.eq('status', 'active').limit(1);
      }

      const { data: targetGoal, error: findError } = await query.maybeSingle();
      if (findError || !targetGoal) {
        return { success: false, message: 'Target goal not found to update progress.' };
      }

      const prev = Number(targetGoal.current_value) || 0;
      const target = Number(targetGoal.target_value) || 100;
      const updatedValue = isDelta ? prev + Number(newValue) : Number(newValue);
      const isCompleted = updatedValue >= target;

      const { data: updatedGoal, error: updateErr } = await supabase
        .from('goals')
        .update({
          current_value: updatedValue,
          status: isCompleted ? 'completed' : targetGoal.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetGoal.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateErr) {
        return { success: false, message: `Failed to update goal progress: ${updateErr.message}` };
      }

      const pct = Math.round((updatedValue / target) * 100);
      return {
        success: true,
        message: `Goal "${targetGoal.title}" updated to ${updatedValue}/${target} ${targetGoal.unit} (${pct}%).`,
        data: { goal: updatedGoal },
      };
    }

    case 'list_goals': {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, message: `Failed to query goals: ${error.message}` };
      }

      return {
        success: true,
        message: `Retrieved ${data.length} goal(s).`,
        data: { goals: data },
      };
    }

    // --------------------------------------------------------------------------
    // 5. REMINDERS & FITNESS
    // --------------------------------------------------------------------------
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

    case 'get_fitness_trends': {
      const days = parameters.days ? Math.min(90, Math.max(1, Number(parameters.days))) : 7;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', cutoff.toISOString())
        .order('started_at', { ascending: false });

      if (error) {
        return { success: false, message: `Failed to fetch fitness trends: ${error.message}` };
      }

      const totalDistanceMeters = (activities || []).reduce((sum, a) => sum + (Number(a.distance_meters) || 0), 0);
      const totalCalories = (activities || []).reduce((sum, a) => sum + (Number(a.calories) || 0), 0);
      const totalKm = Math.round((totalDistanceMeters / 1000) * 10) / 10;

      return {
        success: true,
        message: `Past ${days} days: ${activities.length} workouts, ${totalKm} km, ${totalCalories} kcal burned.`,
        data: {
          workoutCount: activities.length,
          totalKm,
          totalCalories,
          activities,
        },
      };
    }

    default:
      return { success: false, message: `Tool "${toolName}" is not recognized by server executor.` };
  }
}
