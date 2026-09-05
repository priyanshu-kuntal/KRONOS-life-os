// ==============================================================================
// KRONOS SUPABASE EDGE FUNCTION - AI MISSION CONTROL
// ==============================================================================
// Target Production Architecture:
// React Native -> useAiStore -> Supabase Edge Function -> Authenticated User ->
// Server-side Context -> Real LLM -> Tool Calling -> Server-side Tool Executor ->
// Supabase -> Final AI Response -> React Native

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { buildServerContext } from './contextBuilder.ts';
import { callLLMProvider } from './llmProvider.ts';
import { executeServerTool, ToolExecutionResponse } from './toolExecutor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Validate Authentication via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Authorization header is required.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    // Create client scoped with user's JWT so RLS is automatically active
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired session token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // 3. Parse Request Body
    const body = await req.json();
    const {
      message = '',
      conversationHistory = [],
      isConfirmed = false,
      pendingAction = null,
    } = body;

    // 4. Handle Confirmed Destructive Actions
    if (isConfirmed && pendingAction) {
      const toolRes = await executeServerTool(
        supabase,
        userId,
        pendingAction.toolName,
        pendingAction.parameters,
        true
      );

      return new Response(
        JSON.stringify({
          message: toolRes.message,
          toolCalls: [toolRes],
          requiresConfirmation: false,
          data: toolRes.data,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Build Authoritative Server-side KRONOS Context
    const { snapshot, promptString } = await buildServerContext(supabase, userId);

    const systemPrompt = `You are KRONOS AI Mission Control, the executive life-operating-system intelligence.
You have direct, real-time access to the user's authoritative data and database tools.

CRITICAL INSTRUCTIONS:
1. Always base all statements on the provided AUTHENTICATED USER SNAPSHOT. Never fabricate or hallucinate.
2. Whenever the user intends to add, schedule, log, update, or delete an item, call the appropriate tool.
3. Destructive actions (deleting tasks or events) will halt for user confirmation before database deletion.
4. Keep natural language responses concise, executive, and inspiring.

${promptString}`;

    // 6. Invoke Real LLM with Tool Calling Declarations
    const initialLlmRes = await callLLMProvider({
      systemPrompt,
      userMessage: message,
      conversationHistory,
    });

    // 7. Handle Tool Calls
    if (initialLlmRes.toolCalls && initialLlmRes.toolCalls.length > 0) {
      const toolResults: ToolExecutionResponse[] = [];
      const toolResultsForLLM: Array<{ toolName: string; result: any }> = [];

      for (const call of initialLlmRes.toolCalls) {
        const result = await executeServerTool(
          supabase,
          userId,
          call.name,
          call.arguments,
          isConfirmed
        );

        toolResults.push(result);
        toolResultsForLLM.push({ toolName: call.name, result });

        // If tool requires user confirmation, halt and return immediately
        if (result.requiresConfirmation && result.pendingAction) {
          return new Response(
            JSON.stringify({
              message: result.message,
              toolCalls: toolResults,
              requiresConfirmation: true,
              pendingAction: result.pendingAction,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // 8. Feed tool results back to LLM for final natural-language response
      let finalLlmRes: any;
      try {
        finalLlmRes = await callLLMProvider({
          systemPrompt,
          userMessage: message,
          conversationHistory,
          toolResults: toolResultsForLLM,
        });
      } catch {
        finalLlmRes = { text: toolResults[0]?.message || 'Action executed successfully.' };
      }

      const finalMessage = finalLlmRes.text || toolResults[0]?.message || 'Mission Control updated.';

      // Persist conversation to ai_conversations table
      await persistAiConversation(supabase, userId, message, finalMessage, toolResults);

      return new Response(
        JSON.stringify({
          message: finalMessage,
          toolCalls: toolResults,
          requiresConfirmation: false,
          data: toolResults.map((r) => r.data).filter(Boolean),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Standard Natural Language Response (No Tool Calls)
    const assistantMessage = initialLlmRes.text || 'Mission Control received your command.';

    // Persist conversation
    await persistAiConversation(supabase, userId, message, assistantMessage, []);

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        toolCalls: [],
        requiresConfirmation: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || 'Internal error in KRONOS AI Mission Control',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Persists chat exchange to public.ai_conversations
 */
async function persistAiConversation(
  supabase: any,
  userId: string,
  userMessage: string,
  assistantMessage: string,
  toolCalls: any[]
) {
  try {
    const today = new Date().toISOString();
    await supabase.from('ai_conversations').insert({
      user_id: userId,
      title: userMessage.slice(0, 60),
      summary: assistantMessage.slice(0, 120),
      messages: [
        { id: `u_${Date.now()}`, role: 'user', content: userMessage, timestamp: today },
        { id: `a_${Date.now()}`, role: 'assistant', content: assistantMessage, timestamp: today, toolCalls },
      ],
      updated_at: today,
    });
  } catch {
    // Non-blocking log
  }
}
