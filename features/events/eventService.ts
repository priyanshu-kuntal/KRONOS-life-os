import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { EventItem } from '../../types/models';
import { CreateEventInput, UpdateEventInput, EVENT_CATEGORY_COLORS } from './eventTypes';

function mapDbRowToEvent(row: any): EventItem {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    startTime: row.start_time,
    endTime: row.end_time,
    isAllDay: Boolean(row.is_all_day),
    location: row.location || undefined,
    color: row.color || EVENT_CATEGORY_COLORS[row.category as keyof typeof EVENT_CATEGORY_COLORS] || '#4F8CFF',
    category: row.category || 'Work',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export const eventService = {
  async fetchEvents(
    userId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: EventItem[]; error?: string }> {
    if (!isSupabaseConfigured) {
      return { data: [] };
    }

    try {
      const client = supabase as any;
      let query = client
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (startDate) {
        query = query.gte('start_time', `${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        query = query.lte('end_time', `${endDate}T23:59:59.999Z`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        data: (data || []).map(mapDbRowToEvent),
      };
    } catch (err: any) {
      console.warn('Error fetching events from Supabase:', err?.message);
      return { data: [], error: err?.message || 'Failed to fetch events' };
    }
  },

  async createEvent(userId: string, input: CreateEventInput): Promise<{ data?: EventItem; error?: string }> {
    const categoryColor = input.color || EVENT_CATEGORY_COLORS[input.category] || '#4F8CFF';

    if (!isSupabaseConfigured) {
      return {
        data: {
          id: `evt-${Date.now()}`,
          userId,
          title: input.title,
          description: input.description,
          category: input.category,
          startTime: input.startTime,
          endTime: input.endTime,
          isAllDay: Boolean(input.isAllDay),
          location: input.location,
          color: categoryColor,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    }

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('events')
        .insert({
          user_id: userId,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          category: input.category,
          start_time: input.startTime,
          end_time: input.endTime,
          is_all_day: Boolean(input.isAllDay),
          location: input.location?.trim() || null,
          color: categoryColor,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: mapDbRowToEvent(data) };
    } catch (err: any) {
      console.warn('Error creating event in Supabase:', err?.message);
      return { error: err?.message || 'Failed to create event' };
    }
  },

  async updateEvent(eventId: string, input: UpdateEventInput): Promise<{ data?: EventItem; error?: string }> {
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
      if (input.category !== undefined) {
        dbUpdates.category = input.category;
        if (!input.color) {
          dbUpdates.color = EVENT_CATEGORY_COLORS[input.category] || '#4F8CFF';
        }
      }
      if (input.startTime !== undefined) dbUpdates.start_time = input.startTime;
      if (input.endTime !== undefined) dbUpdates.end_time = input.endTime;
      if (input.isAllDay !== undefined) dbUpdates.is_all_day = input.isAllDay;
      if (input.location !== undefined) dbUpdates.location = input.location.trim() || null;
      if (input.color !== undefined) dbUpdates.color = input.color;

      const { data, error } = await client
        .from('events')
        .update(dbUpdates)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return { data: mapDbRowToEvent(data) };
    } catch (err: any) {
      console.warn('Error updating event in Supabase:', err?.message);
      return { error: err?.message || 'Failed to update event' };
    }
  },

  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const client = supabase as any;
      const { error } = await client
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.warn('Error deleting event in Supabase:', err?.message);
      return { success: false, error: err?.message || 'Failed to delete event' };
    }
  },
};
