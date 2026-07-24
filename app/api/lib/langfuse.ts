// ---------------------------------------------------------------------------
// LangFuse — LLM Observability & Prompt Management Client
// ---------------------------------------------------------------------------
// LangFuse provides OpenTelemetry-native tracing for LLM calls and
// a prompt management system that allows runtime prompt iteration.
//
// This file handles TRACING — submitting traces for each LLM call.
// For PROMPT MANAGEMENT (runtime-updatable prompts), see langfuse-prompts.ts.
//
// Dual tracing with LangSmith gives observability redundancy.
// If one observability system is down, the other still works.
//
// Tracing is fire-and-forget — NEVER blocks the actual LLM response.
//
// Toggle: LANGFUSE_TRACING=true in .env.local
// Requires: LANGFUSE_PUBLIC_KEY + LANGFUSE_SECRET_KEY
// ---------------------------------------------------------------------------

import { LangfuseClient } from '@langfuse/client';
import {
  startActiveObservation,
  type LangfuseGeneration,
} from '@langfuse/tracing';
import { ChatMessage, ChatOptions, ChatResponse } from './llm';
import { getLangfuseSpanProcessor } from './langfuse-span-processor-ref';

/** Lazy singleton — reused across requests within a warm serverless function */
let langfuseClient: LangfuseClient | null = null;

/** True when LANGFUSE_TRACING is exactly "true" and both API keys are set. */
export function isLangfuseTracingEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): boolean {
  return (
    env.LANGFUSE_TRACING === 'true' &&
    !!env.LANGFUSE_PUBLIC_KEY?.trim() &&
    !!env.LANGFUSE_SECRET_KEY?.trim()
  );
}

/**
 * initLangFuse: Creates or returns the LangFuse client.
 *
 * Lazy initialization avoids creating clients at build time or when
 * tracing is disabled. Returns null if credentials are not configured.
 */
export function initLangFuse(): LangfuseClient | null {
  if (
    !langfuseClient &&
    process.env.LANGFUSE_PUBLIC_KEY &&
    process.env.LANGFUSE_SECRET_KEY
  ) {
    langfuseClient = new LangfuseClient({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
    });
  }
  return langfuseClient;
}

type FlushableOtelProvider = {
  forceFlush?: () => Promise<void>;
  getDelegate?: () => FlushableOtelProvider;
};

/**
 * Prefer an SDK provider behind ProxyTracerProvider.getDelegate(); otherwise
 * use the provider itself when it implements forceFlush.
 *
 * Recursively unwraps ProxyTracerProvider chains so nested proxies
 * (proxy → proxy → real) eventually reach a flushable delegate. When a
 * provider exposes both getDelegate and forceFlush, try the delegate first
 * and fall back to the provider itself if the delegate is missing or not
 * flushable.
 */
function resolveOtelFlushTarget(
  provider: FlushableOtelProvider | null | undefined
): FlushableOtelProvider | null {
  if (!provider) return null;

  if (typeof provider.getDelegate === 'function') {
    const fromDelegate = resolveOtelFlushTarget(provider.getDelegate());
    if (fromDelegate) return fromDelegate;
  }

  if (typeof provider.forceFlush === 'function') {
    return provider;
  }

  return null;
}

/**
 * Flush pending Langfuse / OTel spans before a serverless function exits.
 * No-op when tracing is disabled. Never throws to callers.
 *
 * Prefer LangfuseSpanProcessor.forceFlush. If missing, unwrap the OTel
 * ProxyTracerProvider via getDelegate() so the underlying SDK provider
 * (which implements forceFlush) can be flushed.
 */
export async function flushLangfuseTracing(): Promise<void> {
  if (!isLangfuseTracingEnabled()) {
    return;
  }

  try {
    const processor = getLangfuseSpanProcessor();

    if (processor && typeof processor.forceFlush === 'function') {
      await processor.forceFlush();
    } else {
      const { getLangfuseTracerProvider } = await import('@langfuse/tracing');
      const flushTarget = resolveOtelFlushTarget(
        getLangfuseTracerProvider() as FlushableOtelProvider
      );
      if (flushTarget?.forceFlush) {
        await flushTarget.forceFlush();
      } else {
        console.warn(
          'Langfuse OTel flush skipped: no span processor or provider forceFlush'
        );
      }
    }
  } catch (error) {
    console.error(
      'Langfuse OTel forceFlush failed:',
      error instanceof Error ? error.message : 'non-Error thrown'
    );
  }

  try {
    const client = initLangFuse();
    if (client && typeof client.flush === 'function') {
      await client.flush();
    }
  } catch (error) {
    console.error(
      'Langfuse client flush failed:',
      error instanceof Error ? error.message : 'non-Error thrown'
    );
  }
}

/**
 * traceLLMCall: Submits a trace to LangFuse for each LLM call.
 *
 * Creates an OpenTelemetry-compatible "generation" span with:
 *   - Input: provider, model, messages, system prompt, options
 *   - Output: response content, token usage
 *   - Metadata: duration, temperature, max_tokens, prompt info
 *   - Model parameters: temperature, maxTokens
 *   - Usage details: prompt/completion/total tokens
 *
 * Uses LangFuse's startActiveObservation which creates an
 * OpenTelemetry span context. Fire-and-forget: never blocks the
 * actual LLM response.
 *
 * Unlike LangSmith, LangFuse traces support linking to managed prompts
 * via the langfusePrompt parameter, enabling prompt-version-level analytics.
 */
export async function traceLLMCall(
  provider: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  response: ChatResponse,
  startTime: number,
  options: ChatOptions | Record<string, unknown> = {},
  langfusePrompt?: { name: string; version?: number } | null
): Promise<void> {
  try {
    if (!isLangfuseTracingEnabled()) {
      return;
    }

    initLangFuse();

    const durationMs = Date.now() - startTime;
    const modelParameters: Record<string, string | number> = {};
    const opts = options as ChatOptions & Record<string, unknown>;
    if (typeof opts.temperature === 'number') {
      modelParameters.temperature = opts.temperature;
    }
    if (typeof opts.maxTokens === 'number') {
      modelParameters.maxTokens = opts.maxTokens;
    }

    await startActiveObservation(
      `llm_call_${provider}_${model}`,
      async (generation: LangfuseGeneration) => {
        generation.update({
          input: {
            provider,
            model,
            messages,
            system_prompt: systemPrompt,
            options,
          },
          output: {
            content: response.content,
            usage: response.usage,
          },
          metadata: {
            provider,
            model,
            duration_ms: durationMs,
            temperature: opts.temperature,
            max_tokens: opts.maxTokens,
            ...(langfusePrompt ? { prompt_name: langfusePrompt.name, prompt_version: langfusePrompt.version } : {}),
          },
          model,
          ...(Object.keys(modelParameters).length > 0
            ? { modelParameters }
            : {}),
          usageDetails: {
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
          },
        });
      },
      { asType: 'generation' }
    );
  } catch (error) {
    console.error('Langfuse trace failed:', error);
  }
}

export async function traceableChat(
  originalChat: Function,
  messages: ChatMessage[],
  systemPrompt: string,
  options: ChatOptions | Record<string, unknown> = {},
  provider = 'unknown',
  model = 'unknown'
): Promise<ChatResponse> {
  const startTime = Date.now();
  const response = await originalChat(messages, systemPrompt, options);

  traceLLMCall(
    provider,
    model,
    messages,
    systemPrompt,
    response,
    startTime,
    options
  ).catch((err) => console.error('Langfuse tracing error:', err));

  return response;
}
