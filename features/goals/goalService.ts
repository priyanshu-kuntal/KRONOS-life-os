import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Goal, GoalStatus } from '../../types/models';
import { CreateGoalInput, UpdateGoalInput } from './goalTypes';
import { calculateGoalStatus } from './goalUtils';

function mapDbRowToGoal(row: any): Goal {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    category: row.category || 'Personal',
    targetValue: parseFloat(row.target_value) || 100,
    currentValue: parseFloat(row.current_value) || 0,
    unit: row.unit || '%',
    startDate: row.start_date || undefined,
    targetDate: row.target_date || row.deadline || undefined,
    deadline: row.target_date || row.deadline || undefined,
    status: (row.status as GoalStatus) || 'active',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export const goalService = {
  async fetchGoals(userId?: string): Promise<{ data: Goal[]; error?: string }> {
    if (!isSupabaseConfigured) {
      return { data: [] };
    }

    try {
      const client = supabase as any;
      let query = client
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        data: (data || []).map(mapDbRowToGoal),
      };
    } catch (err: any) {
      console.warn('Error fetching goals from Supabase:', err?.message);
      return { data: [], error: err?.message || 'Failed to fetch goals' };
    }
  },

  async createGoal(userId: string, input: CreateGoalInput): Promise<{ data?: Goal; error?: string }> {
    const targetVal = input.targetValue || 100;
    const currentVal = input.currentValue || 0;
    const status = input.status || calculateGoalStatus(currentVal, targetVal);

    if (!isSupabaseConfigured) {
      return {
        data: {
          id: `goal-${Date.now()}`,
          userId,
          title: input.title,
          description: input.description,
          category: input.category,
          targetValue: targetVal,
          currentValue: currentVal,
          unit: input.unit || '%',
          startDate: input.startDate,
          targetDate: input.targetDate,
          deadline: input.targetDate,
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    }

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('goals')
        .insert({
          user_id: userId,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          category: input.category,
          target_value: targetVal,
          current_value: currentVal,
          unit: input.unit?.trim() || '%',
          start_date: input.startDate || null,
          target_date: input.targetDate || null,
          deadline: input.targetDate || null,
          status,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: mapDbRowToGoal(data) };
    } catch (err: any) {
      console.warn('Error creating goal in Supabase:', err?.message);
      return { error: err?.message || 'Failed to create goal' };
    }
  },

  async updateGoal(goalId: string, input: UpdateGoalInput): Promise<{ data?: Goal; error?: string }> {
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
      if (input.targetValue !== undefined) dbUpdates.target_value = input.targetValue;
      if (input.currentValue !== undefined) dbUpdates.current_value = input.currentValue;
      if (input.unit !== undefined) dbUpdates.unit = input.unit.trim();
      if (input.startDate !== undefined) dbUpdates.start_date = input.startDate || null;
      if (input.targetDate !== undefined) {
        dbUpdates.target_date = input.targetDate || null;
        dbUpdates.deadline = input.targetDate || null;
      }
      if (input.status !== undefined) dbUpdates.status = input.status;

      const { data, error } = await client
        .from('goals')
        .update(dbUpdates)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      return { data: mapDbRowToGoal(data) };
    } catch (err: any) {
      console.warn('Error updating goal in Supabase:', err?.message);
      return { error: err?.message || 'Failed to update goal' };
    }
  },

  async updateGoalProgress(
    goalId: string,
    deltaOrNewVal: number,
    isDelta = true
  ): Promise<{ data?: Goal; error?: string }> {
    if (!isSupabaseConfigured) {
      return { error: undefined };
    }

    try {
      const client = supabase as any;
      const { data: existing, error: fetchErr } = await client
        .from('goals')
        .select('current_value, target_value, status')
        .eq('id', goalId)
        .single();

      if (fetchErr || !existing) throw fetchErr || new Error('Goal not found');

      const prevVal = parseFloat(existing.current_value) || 0;
      const targetVal = parseFloat(existing.target_value) || 100;
      const newVal = Math.max(0, isDelta ? prevVal + deltaOrNewVal : deltaOrNewVal);
      const newStatus = calculateGoalStatus(newVal, targetVal, existing.status);

      const { data, error } = await client
        .from('goals')
        .update({
          current_value: newVal,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      return { data: mapDbRowToGoal(data) };
    } catch (err: any) {
      console.warn('Error updating goal progress in Supabase:', err?.message);
      return { error: err?.message || 'Failed to update progress' };
    }
  },

  async deleteGoal(goalId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const client = supabase as any;
      const { error } = await client
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.warn('Error deleting goal in Supabase:', err?.message);
      return { success: false, error: err?.message || 'Failed to delete goal' };
    }
  },
};
