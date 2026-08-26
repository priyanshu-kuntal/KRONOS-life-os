import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Reminder } from '../../types/models';
import { CreateReminderInput, UpdateReminderInput } from './reminderTypes';

function mapDbRowToReminder(row: any): Reminder {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    taskId: row.task_id || undefined,
    eventId: row.event_id || undefined,
    habitId: row.habit_id || undefined,
    goalId: row.goal_id || undefined,
    remindAt: row.remind_at,
    isCompleted: Boolean(row.is_completed),
    enabled: row.enabled !== undefined ? Boolean(row.enabled) : true,
    priority: row.priority || 'medium',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export const reminderService = {
  async fetchReminders(userId?: string): Promise<{ data: Reminder[]; error?: string }> {
    if (!isSupabaseConfigured) {
      return { data: [] };
    }

    try {
      const client = supabase as any;
      let query = client
        .from('reminders')
        .select('*')
        .order('remind_at', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        data: (data || []).map(mapDbRowToReminder),
      };
    } catch (err: any) {
      console.warn('Error fetching reminders from Supabase:', err?.message);
      return { data: [], error: err?.message || 'Failed to fetch reminders' };
    }
  },

  async createReminder(userId: string, input: CreateReminderInput): Promise<{ data?: Reminder; error?: string }> {
    if (!isSupabaseConfigured) {
      return {
        data: {
          id: `rem-${Date.now()}`,
          userId,
          title: input.title,
          taskId: input.taskId,
          eventId: input.eventId,
          habitId: input.habitId,
          goalId: input.goalId,
          remindAt: input.remindAt,
          isCompleted: false,
          enabled: input.enabled !== undefined ? input.enabled : true,
          priority: input.priority || 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    }

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('reminders')
        .insert({
          user_id: userId,
          title: input.title.trim(),
          task_id: input.taskId || null,
          event_id: input.eventId || null,
          habit_id: input.habitId || null,
          goal_id: input.goalId || null,
          remind_at: input.remindAt,
          is_completed: false,
          enabled: input.enabled !== undefined ? input.enabled : true,
          priority: input.priority || 'medium',
        })
        .select()
        .single();

      if (error) throw error;
      return { data: mapDbRowToReminder(data) };
    } catch (err: any) {
      console.warn('Error creating reminder in Supabase:', err?.message);
      return { error: err?.message || 'Failed to create reminder' };
    }
  },

  async updateReminder(reminderId: string, input: UpdateReminderInput): Promise<{ data?: Reminder; error?: string }> {
    if (!isSupabaseConfigured) {
      return { error: undefined };
    }

    try {
      const client = supabase as any;
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (input.title !== undefined) dbUpdates.title = input.title.trim();
      if (input.remindAt !== undefined) dbUpdates.remind_at = input.remindAt;
      if (input.isCompleted !== undefined) dbUpdates.is_completed = input.isCompleted;
      if (input.enabled !== undefined) dbUpdates.enabled = input.enabled;
      if (input.priority !== undefined) dbUpdates.priority = input.priority;

      const { data, error } = await client
        .from('reminders')
        .update(dbUpdates)
        .eq('id', reminderId)
        .select()
        .single();

      if (error) throw error;
      return { data: mapDbRowToReminder(data) };
    } catch (err: any) {
      console.warn('Error updating reminder in Supabase:', err?.message);
      return { error: err?.message || 'Failed to update reminder' };
    }
  },

  async toggleReminder(reminderId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const client = supabase as any;
      const { error } = await client
        .from('reminders')
        .update({
          enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reminderId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.warn('Error toggling reminder in Supabase:', err?.message);
      return { success: false, error: err?.message || 'Failed to toggle reminder' };
    }
  },

  async deleteReminder(reminderId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const client = supabase as any;
      const { error } = await client
        .from('reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.warn('Error deleting reminder in Supabase:', err?.message);
      return { success: false, error: err?.message || 'Failed to delete reminder' };
    }
  },
};
