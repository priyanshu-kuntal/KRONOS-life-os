-- ==============================================================================
-- KRONOS PHASE 4B: SERVER-AUTHORITATIVE PENDING ACTIONS TABLE & RLS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.pending_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    parameters JSONB NOT NULL,
    action_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    executed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance and safety
CREATE INDEX IF NOT EXISTS idx_pending_actions_user_exp ON public.pending_actions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_actions_lookup ON public.pending_actions(id, user_id, executed);

-- Enable Row Level Security
ALTER TABLE public.pending_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only select and update their own pending actions
CREATE POLICY "Users can view own pending actions"
    ON public.pending_actions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending actions"
    ON public.pending_actions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending actions"
    ON public.pending_actions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
