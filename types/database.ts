export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          timezone: string;
          theme_preference: 'dark' | 'light' | 'system';
          weekly_distance_goal_km: number;
          daily_task_goal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          timezone?: string;
          theme_preference?: 'dark' | 'light' | 'system';
          weekly_distance_goal_km?: number;
          daily_task_goal?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          timezone?: string;
          theme_preference?: 'dark' | 'light' | 'system';
          weekly_distance_goal_km?: number;
          daily_task_goal?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          due_time: string | null;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          category: string;
          estimated_minutes: number;
          actual_minutes: number | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          category?: string;
          estimated_minutes?: number;
          actual_minutes?: number | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
          category?: string;
          estimated_minutes?: number;
          actual_minutes?: number | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          is_all_day: boolean;
          location: string | null;
          color: string;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          is_all_day?: boolean;
          location?: string | null;
          color?: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          is_all_day?: boolean;
          location?: string | null;
          color?: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          target_days_per_week: number;
          frequency: 'daily' | 'weekly';
          color: string;
          icon: string;
          current_streak: number;
          best_streak: number;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string;
          target_days_per_week?: number;
          frequency?: 'daily' | 'weekly';
          color?: string;
          icon?: string;
          current_streak?: number;
          best_streak?: number;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          target_days_per_week?: number;
          frequency?: 'daily' | 'weekly';
          color?: string;
          icon?: string;
          current_streak?: number;
          best_streak?: number;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          sport_type: 'running' | 'cycling' | 'walking' | 'hiking' | 'workout' | 'swimming';
          distance_meters: number;
          duration_seconds: number;
          moving_time_seconds: number;
          avg_speed_mps: number;
          max_speed_mps: number;
          avg_heart_rate: number | null;
          max_heart_rate: number | null;
          calories: number;
          elevation_gain_meters: number;
          started_at: string;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          sport_type: 'running' | 'cycling' | 'walking' | 'hiking' | 'workout' | 'swimming';
          distance_meters?: number;
          duration_seconds?: number;
          moving_time_seconds?: number;
          avg_speed_mps?: number;
          max_speed_mps?: number;
          avg_heart_rate?: number | null;
          max_heart_rate?: number | null;
          calories?: number;
          elevation_gain_meters?: number;
          started_at: string;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          sport_type?: 'running' | 'cycling' | 'walking' | 'hiking' | 'workout' | 'swimming';
          distance_meters?: number;
          duration_seconds?: number;
          moving_time_seconds?: number;
          avg_speed_mps?: number;
          max_speed_mps?: number;
          avg_heart_rate?: number | null;
          max_heart_rate?: number | null;
          calories?: number;
          elevation_gain_meters?: number;
          started_at?: string;
          status?: 'active' | 'paused' | 'completed' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_points: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          altitude: number | null;
          speed: number | null;
          heart_rate: number | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          altitude?: number | null;
          speed?: number | null;
          heart_rate?: number | null;
          timestamp: string;
        };
        Update: {
          id?: string;
          activity_id?: string;
          user_id?: string;
          latitude?: number;
          longitude?: number;
          altitude?: number | null;
          speed?: number | null;
          heart_rate?: number | null;
          timestamp?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          target_value: number;
          current_value: number;
          unit: string;
          start_date: string | null;
          target_date: string | null;
          deadline: string | null;
          status: 'active' | 'completed' | 'paused' | 'archived' | 'abandoned';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string;
          target_value?: number;
          current_value?: number;
          unit?: string;
          start_date?: string | null;
          target_date?: string | null;
          deadline?: string | null;
          status?: 'active' | 'completed' | 'paused' | 'archived' | 'abandoned';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          target_value?: number;
          current_value?: number;
          unit?: string;
          start_date?: string | null;
          target_date?: string | null;
          deadline?: string | null;
          status?: 'active' | 'completed' | 'paused' | 'archived' | 'abandoned';
          created_at?: string;
          updated_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          task_id: string | null;
          event_id: string | null;
          habit_id: string | null;
          goal_id: string | null;
          remind_at: string;
          is_completed: boolean;
          enabled: boolean;
          priority: 'low' | 'medium' | 'high';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          task_id?: string | null;
          event_id?: string | null;
          habit_id?: string | null;
          goal_id?: string | null;
          remind_at: string;
          is_completed?: boolean;
          enabled?: boolean;
          priority?: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          task_id?: string | null;
          event_id?: string | null;
          habit_id?: string | null;
          goal_id?: string | null;
          remind_at?: string;
          is_completed?: boolean;
          enabled?: boolean;
          priority?: 'low' | 'medium' | 'high';
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          read: boolean;
          data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          type?: string;
          read?: boolean;
          data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          type?: string;
          read?: boolean;
          data?: Json | null;
          created_at?: string;
        };
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          messages: Json;
          context_type: 'general' | 'schedule_optimization' | 'fitness_coaching' | 'daily_briefing';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          messages?: Json;
          context_type?: 'general' | 'schedule_optimization' | 'fitness_coaching' | 'daily_briefing';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          messages?: Json;
          context_type?: 'general' | 'schedule_optimization' | 'fitness_coaching' | 'daily_briefing';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
