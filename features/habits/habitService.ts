import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Habit, HabitLog } from '../../types/models';
import { CreateHabitInput, UpdateHabitInput } from './habitTypes';
import { calculateHabitStreak, formatLocalDate } from './streakUtils';

function mapDbRowToHabit(row: any, logs: HabitLog[] = []): Habit {
  const { currentStreak, bestStreak, completedToday } = calculateHabitStreak(logs);

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    category: row.category || 'Health',
    targetDaysPerWeek: row.target_days_per_week || 7,
    frequency: row.frequency || 'daily',
    color: row.color || '#38BDF8',
    icon: row.icon || 'sparkles',
    currentStreak: currentStreak || row.current_streak || 0,
    bestStreak: Math.max(bestStreak, row.best_streak || 0),
    isArchived: Boolean(row.is_archived),
    completedToday,
  };
}

export const habitService = {
  async fetchHabits(userId?: string): Promise<{ data: Habit[]; error?: string }> {
    if (!isSupabaseConfigured) {
      return { data: [] };
    }

    try {
      const client = supabase as any;

      // 1. Fetch habits
      let habitQuery = client.from('habits').select('*').eq('is_archived', false).order('created_at', { ascending: true });
      if (userId) {
        habitQuery = habitQuery.eq('user_id', userId);
      }
      const { data: habitsData, error: habitsError } = await habitQuery;
      if (habitsError) throw habitsError;

      // 2. Fetch recent habit logs for streak computation (last 60 days)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const startDateStr = formatLocalDate(sixtyDaysAgo);

      let logQuery = client
        .from('habit_logs')
        .select('*')
        .gte('date', startDateStr);
      if (userId) {
        logQuery = logQuery.eq('user_id', userId);
      }
      const { data: logsData, error: logsError } = await logQuery;
      if (logsError) throw logsError;

      // Group logs by habit_id
      const logsByHabit: Record<string, HabitLog[]> = {};
      (logsData || []).forEach((row: any) => {
        if (!logsByHabit[row.habit_id]) {
          logsByHabit[row.habit_id] = [];
        }
        logsByHabit[row.habit_id].push({
          id: row.id,
          habitId: row.habit_id,
          userId: row.user_id,
          date: row.date,
          completed: Boolean(row.completed),
          notes: row.notes || undefined,
        });
      });

      const habits: Habit[] = (habitsData || []).map((row: any) =>
        mapDbRowToHabit(row, logsByHabit[row.id] || [])
      );

      return { data: habits };
    } catch (err: any) {
      console.warn('Error fetching habits from Supabase:', err?.message);
      return { data: [], error: err?.message || 'Failed to fetch habits' };
    }
  },

  async fetchLogsForHabit(habitId: string): Promise<HabitLog[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habitId)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        habitId: row.habit_id,
        userId: row.user_id,
        date: row.date,
        completed: Boolean(row.completed),
        notes: row.notes || undefined,
      }));
    } catch (err) {
      console.warn('Error fetching habit logs:', err);
      return [];
    }
  },

  async createHabit(userId: string, input: CreateHabitInput): Promise<{ data?: Habit; error?: string }> {
    if (!isSupabaseConfigured) {
      return {
        data: {
          id: `hab-${Date.now()}`,
          userId,
          title: input.title,
          description: input.description,
          category: input.category,
          targetDaysPerWeek: input.targetDaysPerWeek,
          frequency: input.frequency,
          color: input.color || '#38BDF8',
          icon: input.icon || 'sparkles',
          currentStreak: 0,
          bestStreak: 0,
          isArchived: false,
          completedToday: false,
        },
      };
    }

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('habits')
        .insert({
          user_id: userId,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          category: input.category,
          target_days_per_week: input.targetDaysPerWeek,
          frequency: input.frequency,
          color: input.color || '#38BDF8',
          icon: input.icon || 'sparkles',
          current_streak: 0,
          best_streak: 0,
          is_archived: false,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: mapDbRowToHabit(data, []) };
    } catch (err: any) {
      console.warn('Error creating habit in Supabase:', err?.message);
      return { error: err?.message || 'Failed to create habit' };
    }
  },

  async toggleHabitLog(
    userId: string,
    habitId: string,
    dateStr: string = formatLocalDate(),
    isCurrentlyCompleted: boolean = false
  ): Promise<{ completed: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { completed: !isCurrentlyCompleted };
    }

    try {
      const client = supabase as any;

      if (isCurrentlyCompleted) {
        // Uncomplete -> delete log entry
        const { error } = await client
          .from('habit_logs')
          .delete()
          .match({ habit_id: habitId, user_id: userId, date: dateStr });

        if (error) throw error;
        return { completed: false };
      } else {
        // Complete -> upsert log entry
        const { error } = await client
          .from('habit_logs')
          .upsert({
            habit_id: habitId,
            user_id: userId,
            date: dateStr,
            completed: true,
          }, { onConflict: 'habit_id,user_id,date' });

        if (error) throw error;
        return { completed: true };
      }
    } catch (err: any) {
      console.warn('Error toggling habit log in Supabase:', err?.message);
      return { completed: isCurrentlyCompleted, error: err?.message || 'Failed to update habit' };
    }
  },

  async updateHabit(habitId: string, input: UpdateHabitInput): Promise<{ data?: Habit; error?: string }> {
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
      if (input.category !== undefined) dbUpdates.category = input.category;
      if (input.targetDaysPerWeek !== undefined) dbUpdates.target_days_per_week = input.targetDaysPerWeek;
      if (input.frequency !== undefined) dbUpdates.frequency = input.frequency;
      if (input.color !== undefined) dbUpdates.color = input.color;
      if (input.icon !== undefined) dbUpdates.icon = input.icon;
      if (input.isArchived !== undefined) dbUpdates.is_archived = input.isArchived;

      const { data, error } = await client
        .from('habits')
        .update(dbUpdates)
        .eq('id', habitId)
        .select()
        .single();

      if (error) throw error;
      const logs = await this.fetchLogsForHabit(habitId);
      return { data: mapDbRowToHabit(data, logs) };
    } catch (err: any) {
      console.warn('Error updating habit in Supabase:', err?.message);
      return { error: err?.message || 'Failed to update habit' };
    }
  },

  async deleteHabit(habitId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const client = supabase as any;
      const { error } = await client
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.warn('Error deleting habit in Supabase:', err?.message);
      return { success: false, error: err?.message || 'Failed to delete habit' };
    }
  },
};
