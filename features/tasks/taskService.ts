import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Task, TaskStatus } from '../../types/models';
import { CreateTaskInput, UpdateTaskInput } from './taskTypes';
import { getLocalDateString } from './taskUtils';

function mapDbRowToTask(row: any): Task {
  return {
    id: row.id,
    userId: row.user_id,
    goalId: row.goal_id || undefined,
    title: row.title,
    description: row.description || undefined,
    dueDate: row.due_date,
    dueTime: row.due_time ? row.due_time.substring(0, 5) : undefined,
    priority: row.priority || 'medium',
    status: row.status || 'pending',
    category: row.category || 'Work',
    estimatedMinutes: row.estimated_minutes || 30,
    actualMinutes: row.actual_minutes || undefined,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export const taskService = {
  async fetchTasks(userId?: string): Promise<{ data: Task[]; error?: string }> {
    if (!isSupabaseConfigured) {
      return { data: [] };
    }

    try {
      const client = supabase as any;
      let query = client.from('tasks').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        data: (data || []).map(mapDbRowToTask),
      };
    } catch (err: any) {
      console.warn('Error fetching tasks from Supabase:', err?.message);
      return { data: [], error: err?.message || 'Failed to fetch tasks' };
    }
  },

  async createTask(userId: string, input: CreateTaskInput): Promise<{ data?: Task; error?: string }> {
    const dueDate = input.dueDate || getLocalDateString();
    const priority = input.priority || 'medium';
    const category = input.category || 'Work';

    if (!isSupabaseConfigured) {
      return {
        data: {
          id: `tsk-${Date.now()}`,
          userId,
          goalId: input.goalId,
          title: input.title,
          description: input.description,
          dueDate,
          dueTime: input.dueTime,
          priority,
          status: 'pending',
          category,
          estimatedMinutes: input.estimatedMinutes || 30,
          createdAt: new Date().toISOString(),
        },
      };
    }

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('tasks')
        .insert({
          user_id: userId,
          goal_id: input.goalId || null,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          due_date: dueDate,
          due_time: input.dueTime || null,
          priority,
          category,
          estimated_minutes: input.estimatedMinutes || 30,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return { data: mapDbRowToTask(data) };
    } catch (err: any) {
      console.warn('Error creating task in Supabase:', err?.message);
      return { error: err?.message || 'Failed to create task' };
    }
  },

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<{ data?: Task; error?: string }> {
    if (!isSupabaseConfigured) {
      return { error: undefined };
    }

    try {
      const client = supabase as any;
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (input.title !== undefined) dbUpdates.title = input.title.trim();
      if (input.description !== undefined) dbUpdates.description = input.description.trim() || null;
      if (input.dueDate !== undefined) dbUpdates.due_date = input.dueDate;
      if (input.dueTime !== undefined) dbUpdates.due_time = input.dueTime || null;
      if (input.priority !== undefined) dbUpdates.priority = input.priority;
      if (input.category !== undefined) dbUpdates.category = input.category;
      if (input.estimatedMinutes !== undefined) dbUpdates.estimated_minutes = input.estimatedMinutes;
      if (input.status !== undefined) {
        dbUpdates.status = input.status;
        dbUpdates.completed_at = input.status === 'completed' ? new Date().toISOString() : null;
      }

      const { data, error } = await client
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return { data: mapDbRowToTask(data) };
    } catch (err: any) {
      console.warn('Error updating task in Supabase:', err?.message);
      return { error: err?.message || 'Failed to update task' };
    }
  },

  async toggleTask(taskId: string, currentStatus: TaskStatus): Promise<{ data?: Task; error?: string }> {
    const isNowCompleted = currentStatus !== 'completed';
    const newStatus: TaskStatus = isNowCompleted ? 'completed' : 'pending';

    return this.updateTask(taskId, {
      status: newStatus,
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
    });
  },

  async deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const client = supabase as any;
      const { error } = await client
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.warn('Error deleting task in Supabase:', err?.message);
      return { success: false, error: err?.message || 'Failed to delete task' };
    }
  },
};
