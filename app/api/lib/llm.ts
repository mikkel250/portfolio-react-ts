// ---------------------------------------------------------------------------
// LLM Abstraction Layer — Multi-Provider Chat Interface
// ---------------------------------------------------------------------------
// This is the CORE of the AI system. It provides a unified interface
// (`chat()`) for calling any supported LLM provider with automatic
// fallback, dual tracing, and cost tracking.
//
// Supported providers:
//   - Google Gemini  (via @google/genai)       — Primary (free tier)
//   - OpenAI GPT     (via openai SDK)           — Fallback
//   - Anthropic Claude (via @anthropic-ai/sdk)  — Fallback
//   - DeepSeek       (via OpenAI-compatible API)— Fallback
//
// Architecture:
//   chat(messages, systemPrompt, options)
//     ├── buildFallbackChain(primaryModel)
//     ├── for each provider in chain:
//     │   ├── callProvider() → callGoogle/callOpenAI/callAnthropic/callDeepseek
//     │   ├── traceLLMCall() → LangSmith (fire-and-forget) + Langfuse (await + flush)
//     │   ├── on success: logUsage(), return ChatResponse
//     │   └── on failure: if isRetryableError → continue, else throw
//     └── all providers failed → throw
//
// Key design decisions:
//   - Lazy client initialization (avoids build-time errors)
//   - Unified ChatResponse type across all providers
//   - Provider-specific adapters handle API differences internally
//   - Dual tracing (LangSmith + LangFuse) for observability redundancy
//   - Langfuse spans are awaited/flushed so serverless exits do not drop them
//   - Cost tracking per call for monitoring spend
// ---------------------------------------------------------------------------

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { traceLLMCall, traceableChat } from './langsmith';
import { traceLLMCall as traceLLMCallLangFuse } from './langfuse';
import {
  buildFallbackChain,
  isRetryableError,
  type Provider,
} from './llm-fallback-chain';

// Configuration helper
function getLLMConfig() {
  // Parse max tokens from env (supports different values for different models)
  const maxTokens = process.env.AI_MAX_TOKENS 
    ? parseInt(process.env.AI_MAX_TOKENS, 10) 
    : 8192; // Default for Flash and most models
  
  // Temperature from env (defaults to lower for reduced hallucinations)
  const temperature = process.env.AI_TEMPERATURE 
    ? parseFloat(process.env.AI_TEMPERATURE) 
    : 0.3; // Lowered default to reduce hallucinations in Gemini Pro
  
  return { maxTokens, temperature };
}

// Export config helper for use in routes
export const LLM_CONFIG = getLLMConfig();

// Types for our chat interface
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string | null;
  /** Wall time for the provider call only (excludes tracing). */
  providerDurationMs?: number;
}

/** DeepSeek V4 thinking dial — API supports high|max; disabled turns thinking off. */
export type DeepseekReasoningEffort = 'max' | 'high' | 'disabled';

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  /** Optional Langfuse prompt info to link in traces */
  langfusePrompt?: { name: string; version?: number } | null;
  /** Override DEEPSEEK_REASONING_EFFORT for this call */
  deepseekReasoningEffort?: DeepseekReasoningEffort;
}

/**
 * Resolve DeepSeek thinking effort from env/options.
 * Invalid values fall back to `high` (V4 thinking floor).
 */
export function resolveDeepseekReasoningEffort(
  raw: string | undefined = process.env.DEEPSEEK_REASONING_EFFORT
): DeepseekReasoningEffort {
  const value = (raw ?? 'high').trim().toLowerCase();
  if (value === 'max' || value === 'high' || value === 'disabled') {
    return value;
  }
  console.warn(
    `Invalid DEEPSEEK_REASONING_EFFORT="${raw ?? ''}", defaulting to high`
  );
  return 'high';
}

// Lazy initialization of clients to avoid errors during build time
let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;
let google: GoogleGenAI | null = null;
let deepseek: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

function getAnthropic(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

function getGoogle(): GoogleGenAI {
  if (!google) {
    google = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY || ''
    });
  }
  return google;
}

function getDeepSeek(): OpenAI {
  if (!deepseek) {
    deepseek = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }
  return deepseek;
}

async function callOpenAI(
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  // Default options from env or fallback values
  const { maxTokens: defaultMaxTokens, temperature: defaultTemperature } = getLLMConfig();
  const {
    temperature = defaultTemperature,
    maxTokens = defaultMaxTokens,
    model = process.env.AI_MODEL || 'gpt-4o-mini',
  } = options;

  // Format messages - handle both user strings and full message objects
  const formattedMessages: ChatMessage[] = messages.map((msg) => {
    if (typeof msg === 'string') {
      return { role: 'user', content: msg };
    }
    if ('role' in msg && 'content' in msg) {
      return msg as ChatMessage;
    }
    // Assume it's a message with just content
    return { role: 'user', content: (msg as any).content || String(msg) };
  });

  // Build full message array with system prompt first
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...formattedMessages,
  ];

  // Call OpenAI API
  const response = await getOpenAI().chat.completions.create({
    model,
    messages: fullMessages,
    temperature,
    max_tokens: maxTokens,
  });

  // Extract response
  const choice = response.choices[0];
  if (!choice || !choice.message) {
    throw new Error('No response from OpenAI');
  }

  // Return structured response
  return {
    content: choice.message.content || '',
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    model: response.model,
    finishReason: choice.finish_reason,
  };
}

async function callDeepseek(
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const { maxTokens: defaultMaxTokens, temperature: defaultTemperature } = getLLMConfig();
  const {
    temperature = defaultTemperature,
    maxTokens = defaultMaxTokens,
    model = 'deepseek-v4-pro',
  } = options;

  const formattedMessages: ChatMessage[] = messages.map((msg) => {
    if (typeof msg === 'string') {
      return { role: 'user', content: msg };
    }
    if ('role' in msg && 'content' in msg) {
      return msg as ChatMessage;
    }
    return { role: 'user', content: (msg as any).content || String(msg) };
  });

  // DeepSeek rejects reasoning_content on prior assistant turns; send role + content only.
  const fullMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...formattedMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  // DeepSeek V4 thinking dial: DEEPSEEK_REASONING_EFFORT = max | high | disabled.
  // Ladder for latency: max → high → disabled. Non-V4 models may reject these fields.
  // [SIDE-EFFECT] Calls DeepSeek chat completions API; failure triggers fallback in chat().
  const effort =
    options.deepseekReasoningEffort ?? resolveDeepseekReasoningEffort();
  const thinkingParams =
    effort === 'disabled'
      ? { extra_body: { thinking: { type: 'disabled' as const } } }
      : {
          reasoning_effort: effort,
          extra_body: { thinking: { type: 'enabled' as const } },
        };

  const response = await getDeepSeek().chat.completions.create({
    model,
    messages: fullMessages,
    temperature,
    max_tokens: maxTokens,
    ...thinkingParams,
  } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);

  const choice = response.choices[0];
  if (!choice || !choice.message) {
    throw new Error('No response from DeepSeek');
  }

  const message = choice.message as OpenAI.Chat.Completions.ChatCompletionMessage & {
    reasoning_content?: string | null;
  };

  return {
    content: message.content || '',
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    model: response.model,
    finishReason: choice.finish_reason,
  };
}

async function callAnthropic(
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions
): Promise<ChatResponse> {
  const { maxTokens: defaultMaxTokens, temperature: defaultTemperature } = getLLMConfig();
  const { temperature = defaultTemperature, maxTokens = defaultMaxTokens, model = 'claude-haiku-4-5-20251001' } = options;

  // format messages
  const formattedMessages: ChatMessage[] = messages.map((msg) => {
    if (typeof msg === 'string') {
      return { role: 'user', content: msg };
    }

    if ('role' in msg && 'content' in msg) {
      return msg as ChatMessage;
    }

    return { role: 'user', content: (msg as any).content || String(msg) };
  });

  // NOTE: Claude doesn't support 'system' role in messages!
  // filter to remove system messages (defensively)
  const claudeMessages = formattedMessages
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role as 'user' | 'assistant', // Claude only accepts these two options
      content: msg.content,
    }));

  // call Anthropic API
  const response = await getAnthropic().messages.create({
    model,
    system: systemPrompt,
    messages: claudeMessages,
    temperature,
    max_tokens: maxTokens,
  });

  // extract response (anthropic returns content as an array)
  const textContent = response.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude!');
  }

  // normalize to my standard ChatResponse format
  return {
    content: textContent.text,
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
    model: response.model,
    finishReason: response.stop_reason,
  };
}

async function callGoogle(
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions
): Promise<ChatResponse> {
  // Use lower temperature for Gemini Pro to reduce hallucinations
  const { maxTokens: defaultMaxTokens, temperature: defaultTemperature } = getLLMConfig();
  const { temperature = defaultTemperature, maxTokens = defaultMaxTokens, model = 'gemini-2.5-pro' } = options;

  // format messages
  const formattedMessages: ChatMessage[] = messages.map((msg) => {
    if (typeof msg === 'string') {
      return { role: 'user', content: msg };
    }

    if ('role' in msg && 'content' in msg) {
      return msg as ChatMessage;
    }

    return { role: 'user', content: (msg as any).content || String(msg) };
  });

  // Build conversation history for context awareness
  // Include system prompt at the start for better grounding
  let fullPrompt = `${systemPrompt}\n\n---\n\nConversation History:\n`;
  
  // Add conversation history (exclude the last message which is the current query)
  for (let i = 0; i < formattedMessages.length - 1; i++) {
    const msg = formattedMessages[i];
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    fullPrompt += `${role}: ${msg.content}\n\n`;
  }
  
  // Add current user message
  fullPrompt += `User: ${formattedMessages[formattedMessages.length - 1]?.content || ''}`;

  // Call the @google/genai API
  const response = await getGoogle().models.generateContent({
    model: model,
    contents: fullPrompt,
    config: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  // Extract response - @google/genai returns text directly
  const content = response.text;
  if (!content) {
    console.log('Response structure:', JSON.stringify(response, null, 2));
    throw new Error('No text content in response from Google');
  }

  // @google/genai might not have usage stats in the same structure
  // Default to 0 if not available
  const usage = (response as any).usage || {};
  
  // normalize to standard ChatResponse format
  return {
    content,
    usage: {
      promptTokens: usage.promptTokens || 0,
      completionTokens: usage.completionTokens || 0,
      totalTokens: usage.totalTokens || (usage.promptTokens || 0) + (usage.completionTokens || 0),
    },
    model: model,
    finishReason: (response as any).finishReason || null,
  };
};

// Intelligent fallback system with configurable environment variables
export async function chat(
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const primaryModel = options.model || process.env.AI_MODEL || 'gemini-2.5-flash';
  
  // Build fallback chain from environment variables
  const fallbackChain = buildFallbackChain(primaryModel);
  
  console.log(`Fallback chain: ${fallbackChain.map(f => `${f.model} (${f.provider})`).join(' → ')}`);

  let lastError: any = null;

  for (let i = 0; i < fallbackChain.length; i++) {
    const { provider, model, reason } = fallbackChain[i];
    let startTime = Date.now(); // Declare outside try block so it's available in catch
    
    try {
      console.log(`Attempting ${provider} (${model}) - ${reason}`);
      
      // Call provider
      const response = await callProvider(provider, messages, systemPrompt, { ...options, model });
      
      // Trace successful call. Await Langfuse generation so it nests under an
      // active parent span; do not flush here — the route flushes once at the end
      // so providerDurationMs excludes observability I/O.
      const providerDurationMs = Date.now() - startTime;
      traceLLMCall(provider, model, messages as ChatMessage[], systemPrompt, response, startTime, options)
        .catch(err => console.error('Tracing error (LangSmith):', err));
      try {
        await traceLLMCallLangFuse(
          provider,
          model,
          messages as ChatMessage[],
          systemPrompt,
          response,
          startTime,
          options,
          (options as any).langfusePrompt
        );
      } catch (err) {
        console.error('Tracing error (Langfuse):', err);
      }
      
      // Log usage for monitoring
      logUsage(provider, model, response.usage.totalTokens);
      
      if (i > 0) {
        console.log(`Fallback successful: ${provider} (${model})`);
      }
      
      return { ...response, providerDurationMs };
      
    } catch (error: any) {
      lastError = error;
      console.log(`${provider} failed:`, error.message);
      
      // Trace the failure (fire and forget)
      traceLLMCall(provider, model, messages as ChatMessage[], systemPrompt, {
        content: `Error: ${error.message}`,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        model,
        finishReason: null,
      }, startTime, options)
        .catch(err => console.error('Tracing error (LangSmith):', err));
      traceLLMCallLangFuse(
        provider,
        model,
        messages as ChatMessage[],
        systemPrompt,
        {
          content: `Error: ${error.message}`,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          model,
          finishReason: null,
        },
        startTime,
        options,
        (options as any).langfusePrompt
      )
        .catch(err => console.error('Tracing error (Langfuse):', err));
      
      // Check if this is a retryable error
      if (isRetryableError(error)) {
        console.log(`Retrying with next provider...`);
        continue;
      } else {
        // Non-retryable error (e.g., bad request), don't try other providers
        throw error;
      }
    }
  }

  // If we get here, all providers failed
  console.error('🚨 All providers failed');
  throw new Error(`All LLM providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Helper function to call the appropriate provider
async function callProvider(
  provider: Provider,
  messages: Omit<ChatMessage, 'role'>[] | ChatMessage[],
  systemPrompt: string,
  options: ChatOptions
): Promise<ChatResponse> {
  switch (provider) {
    case 'openai':
      return await callOpenAI(messages, systemPrompt, options);
    case 'anthropic':
      return await callAnthropic(messages, systemPrompt, options);
    case 'google':
      return await callGoogle(messages, systemPrompt, options);
    case 'deepseek':
      return await callDeepseek(messages, systemPrompt, options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Cost tracking and usage monitoring
export interface UsageStats {
  provider: string;
  model: string;
  tokens: number;
  cost: number;
  timestamp: Date;
}

// Simple cost tracking (approximate costs per 1K tokens)
const COST_PER_1K_TOKENS = {
  'gemini-2.5-flash': 0.0, // Free tier
  'gemini-2.5-pro': 0.0, // Free tier (100 requests/day)
  'claude-haiku-4-5-20251001': 0.00025, // $0.25 per 1M tokens
  'gpt-4o': 0.005, // $5 per 1M tokens
  'gpt-4o-mini': 0.00015, // $0.15 per 1M tokens
  'deepseek-v4-pro': 0.00014, // approximate; see DeepSeek pricing
  'deepseek-v4-flash': 0.00005, // approximate; Flash is cheaper/faster than Pro
  'deepseek-chat': 0.00014,
};

function calculateCost(model: string, tokens: number): number {
  const costPer1K = (COST_PER_1K_TOKENS as Record<string, number>)[model] || 0.001; // Default fallback
  return (tokens / 1000) * costPer1K;
}

// Log usage for monitoring
function logUsage(provider: string, model: string, tokens: number): void {
  const cost = calculateCost(model, tokens);
  console.log(`💰 Usage: ${provider} (${model}) - ${tokens} tokens - $${cost.toFixed(4)}`);
}

// Testing function to check the OpenAI connection
export async function testConnection(): Promise<boolean> {
  try {
    await getOpenAI().models.list();
    return true;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}