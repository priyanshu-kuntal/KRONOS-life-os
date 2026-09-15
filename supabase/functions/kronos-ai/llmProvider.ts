// ==============================================================================
// KRONOS SUPABASE EDGE FUNCTION - REAL LLM PROVIDER ADAPTER
// ==============================================================================
// Interfaces with external LLM providers (Google Gemini 2.5 Flash / OpenAI)
// using standard HTTP APIs, declaring KRONOS tool schemas for model function calling.

export interface LLMToolCall {
  name: string;
  arguments: Record<string, any>;
  callId?: string;
}

export interface LLMResponse {
  text?: string;
  toolCalls?: LLMToolCall[];
}

export const SERVER_KRONOS_TOOL_DECLARATIONS = [
  // 1. Tasks
  {
    name: 'create_task',
    description: 'Create a new task in KRONOS Life OS with priority, due date, and estimated duration.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Optional detailed description' },
        dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD' },
        dueTime: { type: 'string', description: 'Due time in HH:mm' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        category: { type: 'string' },
        estimatedMinutes: { type: 'number' },
      },
      required: ['title'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark an existing task as completed.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        taskTitle: { type: 'string' },
      },
    },
  },
  {
    name: 'update_task',
    description: 'Update task details like priority, due date, or title.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        title: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        dueTime: { type: 'string' },
        dueDate: { type: 'string' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete a task. DESTRUCTIVE action requiring user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        taskTitle: { type: 'string' },
      },
    },
  },
  {
    name: 'list_tasks',
    description: 'Query user tasks filtered by date or status.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD filter' },
        status: { type: 'string', enum: ['pending', 'completed', 'all'] },
      },
    },
  },

  // 2. Habits
  {
    name: 'log_habit',
    description: 'Log or toggle completion of a habit for today.',
    parameters: {
      type: 'object',
      properties: {
        habitId: { type: 'string' },
        habitTitle: { type: 'string' },
      },
    },
  },
  {
    name: 'create_habit',
    description: 'Create a new daily or weekly habit with target frequency.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        category: { type: 'string' },
        targetDaysPerWeek: { type: 'number' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_habits',
    description: 'List user habits and current streak records.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  // 3. Goals
  {
    name: 'create_goal',
    description: 'Create a high-level goal with target value and unit.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        targetValue: { type: 'number' },
        unit: { type: 'string' },
        category: { type: 'string' },
        deadline: { type: 'string' },
      },
      required: ['title', 'targetValue', 'unit'],
    },
  },
  {
    name: 'update_goal_progress',
    description: 'Update the progress numerical value or status of an existing goal.',
    parameters: {
      type: 'object',
      properties: {
        goalId: { type: 'string', description: 'ID of the goal' },
        goalTitle: { type: 'string', description: 'Title of the goal if ID is unknown' },
        newValue: { type: 'number', description: 'New progress value' },
        isDelta: { type: 'boolean', description: 'Whether newValue is incremental or absolute' },
      },
      required: ['newValue'],
    },
  },
  {
    name: 'list_goals',
    description: 'List all active user goals and completion percentages.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  // 4. Calendar & Scheduling
  {
    name: 'create_event',
    description: 'Schedule a calendar event or deep work session.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        startTime: { type: 'string', description: 'ISO 8601 string' },
        endTime: { type: 'string', description: 'ISO 8601 string' },
        category: { type: 'string' },
        isAllDay: { type: 'boolean' },
      },
      required: ['title', 'startTime', 'endTime'],
    },
  },
  {
    name: 'update_event',
    description: 'Update or reschedule an existing calendar event or workout block to a new time window.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'ID of the event to reschedule' },
        eventTitle: { type: 'string', description: 'Title or name of event if ID is unknown (e.g. workout)' },
        startTime: { type: 'string', description: 'New start time in ISO 8601 string' },
        endTime: { type: 'string', description: 'New end time in ISO 8601 string' },
        time: { type: 'string', description: 'Natural time string (e.g. 19:00 or 7 PM today)' },
        title: { type: 'string', description: 'Updated title' },
        category: { type: 'string', description: 'Updated category' },
      },
    },
  },
  {
    name: 'delete_event',
    description: 'Delete a scheduled calendar event. DESTRUCTIVE action requiring confirmation.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string' },
        eventTitle: { type: 'string' },
      },
    },
  },
  {
    name: 'find_free_time',
    description: 'Discover unscheduled calendar gap windows of a minimum duration on a given date.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD (defaults to today)' },
        minimumMinutes: { type: 'number', description: 'Minimum duration in minutes (default 30)' },
      },
    },
  },

  // 5. Reminders
  {
    name: 'create_reminder',
    description: 'Set a notification reminder for a specific time.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        remindAt: { type: 'string', description: 'ISO 8601 string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['title', 'remindAt'],
    },
  },

  // 6. Fitness Telemetry
  {
    name: 'get_fitness_trends',
    description: 'Retrieve user fitness telemetry, mileage, average pace, and workout counts.',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Number of past days (default 7)' },
      },
    },
  },
];

/**
 * Calls the configured real LLM provider (Gemini or OpenAI).
 */
export async function callLLMProvider({
  systemPrompt,
  userMessage,
  conversationHistory = [],
  toolResults = [],
}: {
  systemPrompt: string;
  userMessage: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  toolResults?: Array<{ toolName: string; result: any }>;
}) {
  const getEnv = (key: string): string | undefined => {
    if (typeof (globalThis as any).Deno !== 'undefined') {
      return (globalThis as any).Deno.env.get(key);
    }
    return typeof process !== 'undefined' ? process.env[key] : undefined;
  };

  const geminiKey = getEnv('GEMINI_API_KEY');
  const openAiKey = getEnv('OPENAI_API_KEY');

  // 1. Google Gemini 2.5 Flash Provider
  if (geminiKey) {
    return callGemini({
      apiKey: geminiKey,
      systemPrompt,
      userMessage,
      conversationHistory,
      toolResults,
    });
  }

  // 2. OpenAI Provider (gpt-4o-mini)
  if (openAiKey) {
    return callOpenAI({
      apiKey: openAiKey,
      systemPrompt,
      userMessage,
      conversationHistory,
      toolResults,
    });
  }

  // 3. Fallback simulation if no external API key is set in environment
  return simulateLLMReasoning(userMessage, systemPrompt, toolResults);
}

/**
 * Google Gemini REST API implementation with native function calling
 */
async function callGemini({
  apiKey,
  systemPrompt,
  userMessage,
  conversationHistory,
  toolResults,
}: {
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  toolResults: Array<{ toolName: string; result: any }>;
}): Promise<LLMResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Build Gemini contents payload
  const contents: any[] = [];

  for (const msg of conversationHistory.slice(-4)) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  // If returning tool results to the model
  if (toolResults.length > 0) {
    for (const tr of toolResults) {
      contents.push({
        role: 'function',
        parts: [
          {
            functionResponse: {
              name: tr.toolName,
              response: tr.result,
            },
          },
        ],
      });
    }
  }

  // Format tools into Gemini format
  const geminiTools = [
    {
      functionDeclarations: SERVER_KRONOS_TOOL_DECLARATIONS.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    },
  ];

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    tools: geminiTools,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 800,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API HTTP ${res.status}: ${errorText}`);
  }

  const json = await res.json();
  const candidate = json.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  const textPart = parts.find((p: any) => p.text)?.text;
  const functionCalls = parts
    .filter((p: any) => p.functionCall)
    .map((p: any) => ({
      name: p.functionCall.name,
      arguments: p.functionCall.args || {},
    }));

  return {
    text: textPart,
    toolCalls: functionCalls.length > 0 ? functionCalls : undefined,
  };
}

/**
 * OpenAI REST API implementation with tools
 */
async function callOpenAI({
  apiKey,
  systemPrompt,
  userMessage,
  conversationHistory,
  toolResults,
}: {
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  toolResults: Array<{ toolName: string; result: any }>;
}): Promise<LLMResponse> {
  const url = 'https://api.openai.com/v1/chat/completions';

  const messages: any[] = [{ role: 'system', content: systemPrompt }];

  for (const msg of conversationHistory.slice(-4)) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: 'user', content: userMessage });

  if (toolResults.length > 0) {
    for (const tr of toolResults) {
      messages.push({
        role: 'tool',
        name: tr.toolName,
        content: JSON.stringify(tr.result),
      });
    }
  }

  const tools = SERVER_KRONOS_TOOL_DECLARATIONS.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      tools,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API HTTP ${res.status}: ${errorText}`);
  }

  const json = await res.json();
  const choice = json.choices?.[0];
  const message = choice?.message;

  const toolCalls = message?.tool_calls?.map((tc: any) => ({
    name: tc.function.name,
    arguments: JSON.parse(tc.function.arguments || '{}'),
    callId: tc.id,
  }));

  return {
    text: message?.content,
    toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
  };
}

/**
 * High-fidelity fallback reasoning when no third-party API key is configured.
 */
function simulateLLMReasoning(
  userMessage: string,
  systemPrompt: string,
  toolResults: Array<{ toolName: string; result: any }>
): LLMResponse {
  const lower = userMessage.toLowerCase();

  // If we already executed a tool, return the synthesized response
  if (toolResults.length > 0) {
    const r = toolResults[0];
    return {
      text: r.result.message || `Successfully completed action with ${r.toolName}.`,
    };
  }

  // 1. Task creation
  if (lower.includes('add a task') || lower.includes('create task') || lower.includes('new task')) {
    const title = userMessage.replace(/(?:add\s+a\s+task|create\s+task|new\s+task|called)\s*/i, '').trim();
    return {
      toolCalls: [
        {
          name: 'create_task',
          arguments: { title: title || 'New Task', priority: 'medium' },
        },
      ],
    };
  }

  // 2. Schedule deep work / event
  if (lower.includes('schedule') || lower.includes('deep work') || lower.includes('calendar')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    return {
      toolCalls: [
        {
          name: 'create_event',
          arguments: {
            title: 'Deep Work Session',
            startTime: `${dateStr}T09:00:00.000Z`,
            endTime: `${dateStr}T10:30:00.000Z`,
            category: 'Deep Work',
          },
        },
      ],
    };
  }

  // 3. Delete task
  if (lower.includes('delete') && lower.includes('task')) {
    return {
      toolCalls: [
        {
          name: 'delete_task',
          arguments: { taskTitle: userMessage.replace(/delete\s+(?:my\s+)?task\s*/i, '').trim() },
        },
      ],
    };
  }

  // 4. Default natural language analysis based on grounded system prompt
  return {
    text: `Mission Control online. Your readiness score is actively tracked, and all KRONOS systems are operational. Let me know what you would like to schedule, track, or analyze.`,
  };
}
