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
  setLangfuseTracerProvider,
  startActiveObservation,
  type LangfuseGeneration,
} from '@langfuse/tracing';
import { ChatMessage, ChatOptions, ChatResponse } from './llm';
import {
  getLangfuseSpanProcessor,
  setLangfuseSpanProcessor,
} from './langfuse-span-processor-ref';

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

let langfuseExportReady = false;
let langfuseInitPromise: Promise<boolean> | undefined;

/** Test-only. Clears the module-local ready flag and in-flight init promise. */
export function resetLangfuseTracingInitStateForTests(): void {
  langfuseExportReady = false;
  langfuseInitPromise = undefined;
}

/**
 * Make Langfuse span export available in this module.
 *
 * Instrumentation and route handlers do not share module state.
 * Instrumentation publishes its processor on the shared span-processor slot
 * and registers that provider with `setLangfuseTracerProvider` (globalThis,
 * which is what the SDK reads). When that processor is already present, mark
 * this module ready and return. A second `NodeTracerProvider.register()` would
 * replace the global provider.
 *
 * With no published processor, create one provider and publish it. Callers in
 * this module share one in-flight promise. The ready flag and that promise
 * stay module-local. A failed init clears the promise so a later call can
 * retry. Returns false when tracing is disabled or initialization fails.
 * Failures are logged and do not throw.
 */
export async function ensureLangfuseTracing(): Promise<boolean> {
  if (!isLangfuseTracingEnabled()) return false;
  if (langfuseExportReady) return true;

  if (!langfuseInitPromise) {
    langfuseInitPromise = initializeLangfuseTracing();
  }

  return langfuseInitPromise;
}

async function initializeLangfuseTracing(): Promise<boolean> {
  try {
    if (getLangfuseSpanProcessor()) {
      langfuseExportReady = true;
      return true;
    }

    const { NodeTracerProvider } = await import('@opentelemetry/sdk-trace-node');
    const { LangfuseSpanProcessor } = await import('@langfuse/otel');

    const processor = new LangfuseSpanProcessor({
      exportMode: 'immediate',
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
    });
    const provider = new NodeTracerProvider({
      spanProcessors: [processor],
    });
    setLangfuseTracerProvider(provider);
    provider.register();
    setLangfuseSpanProcessor(processor);
    langfuseExportReady = true;

    let host = process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com';
    try {
      host = new URL(host).host;
    } catch {
      host = 'invalid-base-url';
    }
    console.info(`[langfuse] tracing export ready (${host})`);
    return true;
  } catch (error) {
    console.error(
      'Langfuse tracing init failed; continuing without tracing:',
      error instanceof Error ? error.message : 'non-Error thrown'
    );
    return false;
  } finally {
    if (!langfuseExportReady) {
      langfuseInitPromise = undefined;
    }
  }
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
 * and fall back to the provider itself if the delegate is missing, throws,
 * or is not flushable. A seen-set stops self-referential or cyclic delegates
 * from recursing until the stack overflows.
 */
function resolveOtelFlushTarget(
  provider: FlushableOtelProvider | null | undefined,
  seen: Set<FlushableOtelProvider> = new Set()
): FlushableOtelProvider | null {
  if (!provider || seen.has(provider)) return null;
  seen.add(provider);

  if (typeof provider.getDelegate === 'function') {
    let delegate: FlushableOtelProvider | null | undefined;
    try {
      delegate = provider.getDelegate();
    } catch {
      delegate = undefined;
    }
    const fromDelegate = resolveOtelFlushTarget(delegate, seen);
    if (fromDelegate) return fromDelegate;
  }

  if (typeof provider.forceFlush === 'function') {
    return provider;
  }

  return null;
}

/**
 * Shared deadline for the OTel forceFlush and the Langfuse client flush.
 * Same cap as LangSmith (`FLUSH_TIMEOUT_MS` in langsmith.ts). Each phase
 * gets only the time still left; the total wait is capped here.
 */
const FLUSH_TIMEOUT_MS = 2_000;

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

function remainingMs(deadline: number): number {
  return Math.max(0, deadline - Date.now());
}

/**
 * Flush pending Langfuse / OTel spans before a serverless function exits.
 * No-op when tracing is disabled. Never throws to callers.
 *
 * Prefer LangfuseSpanProcessor.forceFlush. If missing, unwrap the OTel
 * ProxyTracerProvider via getDelegate() so the underlying SDK provider
 * (which implements forceFlush) can be flushed.
 *
 * One 2s deadline covers forceFlush and client.flush. client.flush is
 * skipped when that deadline has already passed.
 */
export async function flushLangfuseTracing(): Promise<void> {
  if (!isLangfuseTracingEnabled()) {
    return;
  }

  const deadline = Date.now() + FLUSH_TIMEOUT_MS;

  try {
    const processor = getLangfuseSpanProcessor();

    if (processor && typeof processor.forceFlush === 'function') {
      const pendingBudget = remainingMs(deadline);
      if (pendingBudget > 0) {
        await withTimeout(Promise.resolve(processor.forceFlush()), pendingBudget);
      }
    } else {
      const { getLangfuseTracerProvider } = await import('@langfuse/tracing');
      const flushTarget = resolveOtelFlushTarget(
        getLangfuseTracerProvider() as FlushableOtelProvider
      );
      if (flushTarget?.forceFlush) {
        const pendingBudget = remainingMs(deadline);
        if (pendingBudget > 0) {
          await withTimeout(Promise.resolve(flushTarget.forceFlush()), pendingBudget);
        }
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
      const flushBudget = remainingMs(deadline);
      if (flushBudget > 0) {
        await withTimeout(Promise.resolve(client.flush()), flushBudget);
      }
    }
  } catch (error) {
    console.error(
      'Langfuse client flush failed:',
      error instanceof Error ? error.message : 'non-Error thrown'
    );
  }
}

/**
 * traceLLMCall: Submits a generation to Langfuse for each LLM call.
 *
 * Input and output are OpenAI-style messages so the Sessions view can
 * replay a multi-turn chat. Prior turns are repeated on each generation.
 * Provider, timing, and prompt version stay in metadata. Token counts use
 * Langfuse usage types (`input` / `output` / `total`).
 *
 * Callers that already opened `propagateAttributes({ sessionId })` inherit
 * that session on this generation. Awaited so the generation nests under
 * the active parent span.
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

    if (!(await ensureLangfuseTracing())) {
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

    const conversation: ChatMessage[] = [
      ...(systemPrompt
        ? [{ role: 'system' as const, content: systemPrompt }]
        : []),
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    await startActiveObservation(
      `llm_call_${provider}_${model}`,
      async (generation: LangfuseGeneration) => {
        generation.update({
          input: conversation,
          output: [{ role: 'assistant' as const, content: response.content }],
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
          // Langfuse cost + dashboards expect usage types `input` / `output` (not OpenAI names).
          usageDetails: {
            input: response.usage.promptTokens,
            output: response.usage.completionTokens,
            total: response.usage.totalTokens,
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
