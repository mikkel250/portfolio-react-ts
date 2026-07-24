// ---------------------------------------------------------------------------
// LangSmith — LLM Observability & Tracing
// ---------------------------------------------------------------------------
// LangSmith (by LangChain) provides production tracing for LLM calls.
// Every chat API call is traced with full inputs (messages, system prompt),
// outputs (response, tokens, model), and metadata (duration, temperature).
//
// Tracing is fire-and-forget — it NEVER blocks or slows down the actual
// LLM response. If tracing fails, the user still gets their answer.
//
// Toggle: LANGSMITH_TRACING=true in .env.local
//
// Why dual tracing (LangSmith + LangFuse)?
//   - LangSmith: mature, great debugging UI, widely used in LangChain ecosystem
//   - LangFuse: OpenTelemetry-native, lower latency, evaluation support
//   - Together: observability redundancy. If one is down, the other still works.
// ---------------------------------------------------------------------------

import { Client } from 'langsmith';
import { ChatMessage, ChatResponse } from './llm';

/** Lazy singleton — client is reused across requests within a warm function */
let client: Client | null = null;

/** In-flight createRun promises — awaited by flush before client.flush(). */
const pendingTraces = new Set<Promise<unknown>>();

/** Cap flush wait so serverless responses are never held indefinitely. */
const FLUSH_TIMEOUT_MS = 2_000;

/**
 * initLangSmith: Creates or returns the LangSmith client.
 *
 * Uses lazy initialization to avoid creating clients when tracing is disabled
 * or at build time. Returns null if LANGSMITH_API_KEY is not configured.
 */
export function initLangSmith(): Client | null {
  if (!client && process.env.LANGSMITH_API_KEY) {
    client = new Client({
      apiKey: process.env.LANGSMITH_API_KEY,
      apiUrl: process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com',
      workspaceId: process.env.LANGSMITH_WORKSPACE_ID,
    });
  }
  return client;
}

function trackPendingTrace(work: Promise<unknown>): Promise<unknown> {
  pendingTraces.add(work);
  void work.finally(() => {
    pendingTraces.delete(work);
  });
  return work;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(undefined), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Flush pending LangSmith traces before a serverless function exits.
 * Awaits in-flight createRun work first, then client.flush() with a deadline.
 * No-op when client is not initialized. Never throws to callers.
 */
export async function flushLangSmithTracing(): Promise<void> {
  try {
    if (pendingTraces.size > 0) {
      await Promise.allSettled([...pendingTraces]);
    }
    if (client && typeof client.flush === 'function') {
      await withTimeout(Promise.resolve(client.flush()), FLUSH_TIMEOUT_MS);
    }
  } catch (error) {
    console.error(
      'LangSmith flush failed:',
      error instanceof Error ? error.message : 'non-Error thrown'
    );
  }
}

/**
 * traceLLMCall: Submits a trace to LangSmith for each LLM call.
 *
 * Captures the complete context of every LLM interaction:
 *   - Inputs: provider, model, messages array, system prompt, options
 *   - Outputs: response content, token usage
 *   - Metadata: duration, temperature, max_tokens, provider, model
 *   - Tags: llm, provider name, model name (for filtering in LangSmith UI)
 *
 * This is called asynchronously (fire-and-forget) in the chat() function.
 * If it fails, the error is logged but the user response is unaffected.
 *
 * Also traces FAILED calls — so we can see in the LangSmith UI which
 * providers failed and why, helping debug fallback chain behavior.
 */
export async function traceLLMCall(
  provider: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  response: ChatResponse,
  startTime: number,
  options: any = {}
): Promise<void> {
  const work = (async () => {
    try {
      // Gate: Only trace when LANGSMITH_TRACING is explicitly 'true'
      if (!process.env.LANGSMITH_TRACING || process.env.LANGSMITH_TRACING !== 'true') {
        return;
      }

      const langsmithClient = initLangSmith();
      if (!langsmithClient) {
        return;
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Build the trace payload
      const traceData = {
        name: `llm_call_${provider}_${model}`,
        project_name: process.env.LANGSMITH_PROJECT_NAME,
        run_type: 'chain',
        inputs: {
          provider,
          model,
          messages,
          system_prompt: systemPrompt,
          options,
        },
        outputs: {
          content: response.content,
          usage: response.usage,
        },
        metadata: {
          provider,
          model,
          duration_ms: duration,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
        },
        tags: ['llm', provider, model],
      };

      // Submit trace to LangSmith (blocking await, but called in fire-and-forget context)
      await langsmithClient.createRun(traceData);
    } catch (error) {
      // CRITICAL: Never throw from tracing — let the request go through
      console.error(
        'LangSmith trace failed:',
        error instanceof Error ? error.message : 'non-Error thrown'
      );
    }
  })();

  trackPendingTrace(work);
  await work;
}

// wrapper for the LLM chat function
export async function traceableChat(
  originalChat: Function,
  messages: ChatMessage[],
  systemPrompt: string,
  options: any = {},
  provider: string = 'unknown',
  model: string = 'unknown'
): Promise<ChatResponse> {
  const startTime = Date.now();
  const response = await originalChat(messages, systemPrompt, options);

  // trace the call async (no await to avoid slowing down the actual response)
  traceLLMCall(provider, model, messages, systemPrompt, response, startTime, options)
  .catch(err => console.error('Tracing Error:', err));

  return response;
}
