-- Migration: Add status column to activities table
-- Allows tracking active, paused, completed, and cancelled workouts

ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' 
CHECK (status IN ('active', 'paused', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_activities_user_status ON public.activities(user_id, status);
