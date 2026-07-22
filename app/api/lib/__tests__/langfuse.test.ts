import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LangfuseSpanProcessor } from '@langfuse/otel';
import {
  flushLangfuseTracing,
  isLangfuseTracingEnabled,
  resolveOtelFlushTarget,
  traceLLMCall,
} from '../langfuse';
import {
  clearLangfuseSpanProcessor,
  setLangfuseSpanProcessor,
} from '../langfuse-span-processor-ref';

describe('isLangfuseTracingEnabled', () => {
  it('requires LANGFUSE_TRACING exactly true and both keys', () => {
    expect(
      isLangfuseTracingEnabled({
        LANGFUSE_TRACING: 'true',
        LANGFUSE_PUBLIC_KEY: 'pk',
        LANGFUSE_SECRET_KEY: 'sk',
      })
    ).toBe(true);

    expect(
      isLangfuseTracingEnabled({
        LANGFUSE_TRACING: '1',
        LANGFUSE_PUBLIC_KEY: 'pk',
        LANGFUSE_SECRET_KEY: 'sk',
      })
    ).toBe(false);

    expect(
      isLangfuseTracingEnabled({
        LANGFUSE_TRACING: 'true',
        LANGFUSE_PUBLIC_KEY: 'pk',
      })
    ).toBe(false);
  });
});

describe('resolveOtelFlushTarget', () => {
  it('unwraps ProxyTracerProvider-style getDelegate with forceFlush', () => {
    const forceFlush = vi.fn(async () => undefined);
    const delegate = { forceFlush };
    const proxy = { getDelegate: () => delegate };

    expect(resolveOtelFlushTarget(proxy)).toBe(delegate);
  });

  it('uses the provider itself when it implements forceFlush', () => {
    const forceFlush = vi.fn(async () => undefined);
    const provider = { forceFlush };

    expect(resolveOtelFlushTarget(provider)).toBe(provider);
  });

  it('returns null when neither provider nor delegate can flush', () => {
    expect(resolveOtelFlushTarget({ getDelegate: () => ({}) })).toBeNull();
    expect(resolveOtelFlushTarget({})).toBeNull();
    expect(resolveOtelFlushTarget(null)).toBeNull();
  });
});

describe('traceLLMCall', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('no-ops when tracing is disabled', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'false');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');

    await expect(
      traceLLMCall(
        'deepseek',
        'deepseek-v4-pro',
        [{ role: 'user', content: 'hi' }],
        'system',
        {
          content: 'ok',
          usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          model: 'deepseek-v4-pro',
          finishReason: 'stop',
        },
        Date.now() - 10
      )
    ).resolves.toBeUndefined();
  });
});

describe('flushLangfuseTracing', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearLangfuseSpanProcessor();
  });

  it('no-ops without throwing when tracing is off', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'false');
    await expect(flushLangfuseTracing()).resolves.toBeUndefined();
  });

  it('prefers cached span processor over tracer provider', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');

    const processorFlush = vi.fn(async () => undefined);
    setLangfuseSpanProcessor({
      forceFlush: processorFlush,
    } as unknown as LangfuseSpanProcessor);

    await flushLangfuseTracing();
    expect(processorFlush).toHaveBeenCalledOnce();
  });
});
