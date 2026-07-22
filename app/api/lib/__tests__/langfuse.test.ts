import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LangfuseSpanProcessor } from '@langfuse/otel';
import { getLangfuseTracerProvider } from '@langfuse/tracing';
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

vi.mock('@langfuse/tracing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@langfuse/tracing')>();
  return {
    ...actual,
    getLangfuseTracerProvider: vi.fn(),
  };
});

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
  it('prefers getDelegate forceFlush when both proxy and delegate are flushable', () => {
    const delegateFlush = vi.fn(async () => undefined);
    const proxyFlush = vi.fn(async () => undefined);
    const delegate = { forceFlush: delegateFlush };
    const proxy = { forceFlush: proxyFlush, getDelegate: () => delegate };

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
    vi.mocked(getLangfuseTracerProvider).mockReset();
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
    expect(getLangfuseTracerProvider).not.toHaveBeenCalled();
  });

  it('flushes via provider getDelegate when no span processor is cached', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');
    clearLangfuseSpanProcessor();

    const delegateFlush = vi.fn(async () => undefined);
    const proxyFlush = vi.fn(async () => undefined);
    vi.mocked(getLangfuseTracerProvider).mockReturnValue({
      forceFlush: proxyFlush,
      getDelegate: () => ({ forceFlush: delegateFlush }),
    } as never);

    await flushLangfuseTracing();
    expect(delegateFlush).toHaveBeenCalledOnce();
    expect(proxyFlush).not.toHaveBeenCalled();
  });

  it('flushes the provider directly when it has forceFlush and no delegate', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');
    clearLangfuseSpanProcessor();

    const providerFlush = vi.fn(async () => undefined);
    vi.mocked(getLangfuseTracerProvider).mockReturnValue({
      forceFlush: providerFlush,
    } as never);

    await flushLangfuseTracing();
    expect(providerFlush).toHaveBeenCalledOnce();
  });

  it('warns and resolves when no flush target exists', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');
    clearLangfuseSpanProcessor();

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(getLangfuseTracerProvider).mockReturnValue({} as never);

    await expect(flushLangfuseTracing()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      'Langfuse OTel flush skipped: no span processor or provider forceFlush'
    );
  });
});
