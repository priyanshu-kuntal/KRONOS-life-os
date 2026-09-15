-- ==============================================================================
-- KRONOS PHASE 4: AI MISSION CONTROL - CONVERSATIONS INDEX MIGRATION
-- ==============================================================================

-- Create index on public.ai_conversations for high performance retrieval by user and recency
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user 
ON public.ai_conversations(user_id, updated_at DESC);
