# KRONOS Phase 4B — Final Hardening & Production Verification

## Overview

Phase 4B establishes a production-grade, hardened AI architecture connecting the React Native client to a server-authoritative Supabase Edge Function (`kronos-ai`), interfacing directly with Gemini 2.5 Flash / OpenAI models with strict user isolation, parameter immutability, replay-resistant destructive actions, and expanded tool declarations.

---

## 1. Server-Authoritative Pending Action Confirmations

### Security Model
Client boolean bypasses (`isConfirmed: true`) are strictly rejected with HTTP 400. All destructive mutations (`delete_task`, `delete_event`) follow a two-phase commit protocol managed in `public.pending_actions`:

1. **Staging**: When an LLM tool call invokes a destructive tool, the server does not mutate the database. Instead, it generates a cryptographically secure UUID (`pending_action_id`), stores the exact parameters, tool name, user ID (`auth.uid()`), and a 5-minute expiration timestamp (`expires_at`), then returns `requiresConfirmation: true` and the `pendingActionId` to the client.
2. **Execution**: The client displays a confirmation modal with the staged action details. Upon user confirmation, the client sends only `{ pendingActionId }`. The server validates:
   - Request user matches `pending_actions.user_id` (enforced via JWT / RLS).
   - Action has not expired (`expires_at > now()`).
   - Action has not already been executed (`executed = false`).
3. **Invalidation**: Upon successful execution of the server-stored parameters, the server marks `executed = true`, preventing replay attacks. Any tampered parameters sent by the client are disregarded.

### Database Schema (`public.pending_actions`)
```sql
CREATE TABLE IF NOT EXISTS public.pending_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    action_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    executed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pending_actions_user_id ON public.pending_actions(user_id);
CREATE INDEX idx_pending_actions_lookup ON public.pending_actions(id, user_id, executed);
```

---

## 2. Expanded Server Tool Declarations

`SERVER_KRONOS_TOOL_DECLARATIONS` in `supabase/functions/kronos-ai/llmProvider.ts` provides the LLM with dynamic state inspection and mutation capabilities:

- **Mutation Tools**:
  - `create_task`, `complete_task`, `update_task`, `delete_task`
  - `create_habit`, `log_habit`
  - `create_goal`, `update_goal_progress`
  - `create_event`, `update_event`, `delete_event`
  - `create_reminder`
- **Dynamic Read Tools**:
  - `list_tasks`: Inspect current active tasks by status/priority.
  - `list_habits`: Retrieve active habits and streak tracking.
  - `list_goals`: Query current active objectives and milestones.
  - `find_free_time`: Locate unscheduled calendar intervals.
  - `get_fitness_trends`: Analyze recent workouts, mileage, and calorie telemetry.

Every tool executes strictly scoped to `auth.uid()`.

---

## 3. Rescheduling & Goal Progress Handlers

### `update_event`
Supports natural rescheduling commands (e.g. *"Move my workout to 7 PM"*).
- Resolves event by title/context or explicit `eventId`.
- Validates user ownership against `auth.uid()`.
- Computes start/end times preserving duration.
- Updates database row and emits confirmation.

### `update_goal_progress`
Supports progress logging and target attainment.
- Resolves user's active goal.
- Updates metric value (supports absolute values and deltas).
- Automatically marks status as `completed` if target metric is reached.
- Rejects cross-user or nonexistent goal updates safely.

---

## 4. Verification Suite

14 automated verification tests cover:
- Pending action generation and user-isolation
- Replay prevention and 5-minute TTL enforcement
- Parameter tampering resistance
- Rejection of client boolean overrides
- Safe event rescheduling and goal progress tracking
- 100% parity between server declarations and executor handlers
