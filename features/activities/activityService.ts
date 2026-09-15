import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Activity, ActivityPoint, ActivityStatus, SportType } from '../../types/models';
import { CreateActivityInput, UpdateActivityInput, ActivityFilter, SaveActivityPointsInput } from './activityTypes';

function mapDbRowToActivity(row: any): Activity {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    sportType: (row.sport_type as SportType) || 'running',
    distanceMeters: parseFloat(row.distance_meters) || 0,
    durationSeconds: parseInt(row.duration_seconds, 10) || 0,
    movingTimeSeconds: parseInt(row.moving_time_seconds, 10) || 0,
    avgSpeedMps: parseFloat(row.avg_speed_mps) || 0,
    maxSpeedMps: parseFloat(row.max_speed_mps) || 0,
    avgHeartRate: row.avg_heart_rate || undefined,
    maxHeartRate: row.max_heart_rate || undefined,
    calories: parseInt(row.calories, 10) || 0,
    elevationGainMeters: parseFloat(row.elevation_gain_meters) || 0,
    startedAt: row.started_at || new Date().toISOString(),
    completedAt: row.completed_at || undefined,
    notes: row.notes || undefined,
    status: (row.status as ActivityStatus) || 'completed',
  };
}

function mapDbRowToActivityPoint(row: any): ActivityPoint {
  return {
    id: row.id,
    activityId: row.activity_id,
    userId: row.user_id,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    altitude: row.altitude !== null ? parseFloat(row.altitude) : undefined,
    speed: row.speed !== null ? parseFloat(row.speed) : undefined,
    heartRate: row.heart_rate || undefined,
    timestamp: row.timestamp,
  };
}

export const activityService = {
  /**
   * Fetches user activities ordered chronologically.
   */
  async fetchActivities(
    userId?: string,
    filter?: ActivityFilter
  ): Promise<{ data: Activity[]; error?: string }> {
    if (!isSupabaseConfigured) {
      return { data: [] };
    }

    try {
      const client = supabase as any;
      let query = client
        .from('activities')
        .select('*')
        .order('started_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (filter?.sportType && filter.sportType !== 'all') {
        query = query.eq('sport_type', filter.sportType);
      }

      if (filter?.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        data: (data || []).map(mapDbRowToActivity),
      };
    } catch (err: any) {
      console.warn('Error fetching activities from Supabase:', err?.message);
      return { data: [], error: err?.message || 'Failed to fetch activities' };
    }
  },

  /**
   * Fetches a single activity by ID.
   */
  async getActivityById(activityId: string): Promise<{ data?: Activity; error?: string }> {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase unconfigured' };
    }

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (error) throw error;
      return { data: mapDbRowToActivity(data) };
    } catch (err: any) {
      console.warn('Error fetching activity details:', err?.message);
      return { error: err?.message || 'Failed to fetch activity' };
    }
  },

  /**
   * Creates a new workout activity session.
   */
  async createActivity(
    userId: string,
    input: CreateActivityInput
  ): Promise<{ data?: Activity; error?: string }> {
    const startedAt = input.startedAt || new Date().toISOString();
    const status = input.status || 'active';

    if (!isSupabaseConfigured) {
      return {
        data: {
          id: `act-${Date.now()}`,
          userId,
          title: input.title,
          sportType: input.sportType,
          distanceMeters: 0,
          durationSeconds: 0,
          movingTimeSeconds: 0,
          avgSpeedMps: 0,
          maxSpeedMps: 0,
          calories: 0,
          elevationGainMeters: 0,
          startedAt,
          status,
          notes: input.notes,
        },
      };
    }

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('activities')
        .insert({
          user_id: userId,
          title: input.title.trim(),
          sport_type: input.sportType,
          started_at: startedAt,
          status,
          notes: input.notes?.trim() || null,
          distance_meters: 0,
          duration_seconds: 0,
          moving_time_seconds: 0,
          avg_speed_mps: 0,
          max_speed_mps: 0,
          calories: 0,
          elevation_gain_meters: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: mapDbRowToActivity(data) };
    } catch (err: any) {
      console.warn('Error creating activity in Supabase:', err?.message);
      return { error: err?.message || 'Failed to create activity' };
    }
  },

  /**
   * Updates an existing activity record with ongoing or final telemetry metrics.
   */
  async updateActivity(
    activityId: string,
    updates: UpdateActivityInput
  ): Promise<{ data?: Activity; error?: string }> {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase unconfigured' };
    }

    try {
      const client = supabase as any;
      const payload: any = {};

      if (updates.title !== undefined) payload.title = updates.title.trim();
      if (updates.distanceMeters !== undefined) payload.distance_meters = updates.distanceMeters;
      if (updates.durationSeconds !== undefined) payload.duration_seconds = updates.durationSeconds;
      if (updates.movingTimeSeconds !== undefined) payload.moving_time_seconds = updates.movingTimeSeconds;
      if (updates.avgSpeedMps !== undefined) payload.avg_speed_mps = updates.avgSpeedMps;
      if (updates.maxSpeedMps !== undefined) payload.max_speed_mps = updates.maxSpeedMps;
      if (updates.calories !== undefined) payload.calories = updates.calories;
      if (updates.elevationGainMeters !== undefined) payload.elevation_gain_meters = updates.elevationGainMeters;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt;
      if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;

      const { data, error } = await client
        .from('activities')
        .update(payload)
        .eq('id', activityId)
        .select()
        .single();

      if (error) throw error;
      return { data: mapDbRowToActivity(data) };
    } catch (err: any) {
      console.warn('Error updating activity in Supabase:', err?.message);
      return { error: err?.message || 'Failed to update activity' };
    }
  },

  /**
   * Completes a workout session with final telemetry.
   */
  async completeActivity(
    activityId: string,
    finalData: UpdateActivityInput
  ): Promise<{ data?: Activity; error?: string }> {
    return this.updateActivity(activityId, {
      ...finalData,
      status: 'completed',
      completedAt: finalData.completedAt || new Date().toISOString(),
    });
  },

  /**
   * Deletes an activity and all associated GPS points (via cascade).
   */
  async deleteActivity(activityId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const client = supabase as any;
      const { error } = await client
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.warn('Error deleting activity in Supabase:', err?.message);
      return { success: false, error: err?.message || 'Failed to delete activity' };
    }
  },

  /**
   * Persists GPS breadcrumbs into public.activity_points in batched chunks.
   */
  async saveActivityPoints(
    input: SaveActivityPointsInput
  ): Promise<{ success: boolean; count: number; error?: string }> {
    if (!isSupabaseConfigured || input.points.length === 0) {
      return { success: true, count: input.points.length };
    }

    try {
      const client = supabase as any;
      const rows = input.points.map((pt) => ({
        activity_id: input.activityId,
        user_id: input.userId,
        latitude: pt.latitude,
        longitude: pt.longitude,
        altitude: pt.altitude !== undefined ? pt.altitude : null,
        speed: pt.speed !== undefined ? pt.speed : null,
        heart_rate: pt.heartRate !== undefined ? pt.heartRate : null,
        timestamp: pt.timestamp,
      }));

      // Batch in chunks of 100 points to ensure performant network requests
      const CHUNK_SIZE = 100;
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const { error } = await client.from('activity_points').insert(chunk);
        if (error) throw error;
      }

      return { success: true, count: rows.length };
    } catch (err: any) {
      console.warn('Error saving activity points in Supabase:', err?.message);
      return { success: false, count: 0, error: err?.message || 'Failed to save GPS points' };
    }
  },

  /**
   * Fetches GPS breadcrumbs for an activity to render detailed route replays.
   */
  async fetchActivityPoints(
    activityId: string
  ): Promise<{ data: ActivityPoint[]; error?: string }> {
    if (!isSupabaseConfigured) {
      return { data: [] };
    }

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('activity_points')
        .select('*')
        .eq('activity_id', activityId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return {
        data: (data || []).map(mapDbRowToActivityPoint),
      };
    } catch (err: any) {
      console.warn('Error fetching activity points:', err?.message);
      return { data: [], error: err?.message || 'Failed to fetch GPS points' };
    }
  },
};
