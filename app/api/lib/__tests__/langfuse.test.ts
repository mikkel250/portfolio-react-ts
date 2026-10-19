import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LangfuseSpanProcessor } from '@langfuse/otel';
import { getLangfuseTracerProvider } from '@langfuse/tracing';

const clientFlush = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('@langfuse/client', () => ({
  LangfuseClient: class LangfuseClient {
    flush = clientFlush;
  },
}));
import {
  flushLangfuseTracing,
  isLangfuseTracingEnabled,
  traceLLMCall,
} from '../langfuse';
import { setLangfuseSpanProcessor } from '../langfuse-span-processor-ref';

const startActiveObservationMock = vi.fn();

vi.mock('@langfuse/tracing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@langfuse/tracing')>();
  return {
    ...actual,
    getLangfuseTracerProvider: vi.fn(),
    startActiveObservation: (...args: unknown[]) =>
      startActiveObservationMock(...args),
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

describe('traceLLMCall', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    startActiveObservationMock.mockReset();
  });

  it('sends Langfuse usage types input/output when tracing is enabled', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');

    const update = vi.fn();
    startActiveObservationMock.mockImplementation(
      async (_name: string, fn: (g: { update: typeof update }) => unknown) => {
        await fn({ update });
      }
    );

    await traceLLMCall(
      'deepseek',
      'deepseek-v4-pro',
      [{ role: 'user', content: 'hi' }],
      'system',
      {
        content: 'ok',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        model: 'deepseek-v4-pro',
        finishReason: 'stop',
      },
      Date.now() - 10
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        usageDetails: { input: 100, output: 50, total: 150 },
      })
    );
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
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    setLangfuseSpanProcessor(null);
    vi.mocked(getLangfuseTracerProvider).mockReset();
    clientFlush.mockReset();
    clientFlush.mockImplementation(async () => undefined);
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
    setLangfuseSpanProcessor(null);

    const delegateFlush = vi.fn(async () => undefined);
    const proxyFlush = vi.fn(async () => undefined);
    vi.mocked(getLangfuseTracerProvider).mockReturnValue({
      forceFlush: proxyFlush,
      getDelegate: () => ({ forceFlush: delegateFlush }),
    } as unknown as ReturnType<typeof getLangfuseTracerProvider>);

    await flushLangfuseTracing();
    expect(delegateFlush).toHaveBeenCalledOnce();
    expect(proxyFlush).not.toHaveBeenCalled();
  });

  it('falls back to provider forceFlush when getDelegate returns a non-flushable value', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');
    setLangfuseSpanProcessor(null);

    const proxyFlush = vi.fn(async () => undefined);
    vi.mocked(getLangfuseTracerProvider).mockReturnValue({
      forceFlush: proxyFlush,
      getDelegate: () => ({}),
    } as unknown as ReturnType<typeof getLangfuseTracerProvider>);

    await flushLangfuseTracing();
    expect(proxyFlush).toHaveBeenCalledOnce();
  });

  it('recursively unwraps a 2-deep proxy chain', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');
    setLangfuseSpanProcessor(null);

    const realFlush = vi.fn(async () => undefined);
    vi.mocked(getLangfuseTracerProvider).mockReturnValue({
      getDelegate: () => ({
        getDelegate: () => ({ forceFlush: realFlush }),
      }),
    } as unknown as ReturnType<typeof getLangfuseTracerProvider>);

    await flushLangfuseTracing();
    expect(realFlush).toHaveBeenCalledOnce();
  });

  it('flushes the provider directly when it has forceFlush and no delegate', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');
    setLangfuseSpanProcessor(null);

    const providerFlush = vi.fn(async () => undefined);
    vi.mocked(getLangfuseTracerProvider).mockReturnValue({
      forceFlush: providerFlush,
    } as unknown as ReturnType<typeof getLangfuseTracerProvider>);

    await flushLangfuseTracing();
    expect(providerFlush).toHaveBeenCalledOnce();
  });

  it('flushes a self-referential provider once and resolves', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');
    setLangfuseSpanProcessor(null);

    const realFlush = vi.fn(async () => undefined);
    const provider: { forceFlush: () => Promise<void>; getDelegate: () => unknown } = {
      forceFlush: realFlush,
      getDelegate: () => provider,
    };
    vi.mocked(getLangfuseTracerProvider).mockReturnValue(
      provider as unknown as ReturnType<typeof getLangfuseTracerProvider>
    );

    await expect(flushLangfuseTracing()).resolves.toBeUndefined();
    expect(realFlush).toHaveBeenCalledOnce();
  });

  it('resolves when getDelegate throws and still flushes the provider', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');
    setLangfuseSpanProcessor(null);

    const providerFlush = vi.fn(async () => undefined);
    vi.mocked(getLangfuseTracerProvider).mockReturnValue({
      forceFlush: providerFlush,
      getDelegate: () => {
        throw new Error('cyclic delegate');
      },
    } as unknown as ReturnType<typeof getLangfuseTracerProvider>);

    await expect(flushLangfuseTracing()).resolves.toBeUndefined();
    expect(providerFlush).toHaveBeenCalledOnce();
  });

  it('warns and resolves when no flush target exists', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');
    setLangfuseSpanProcessor(null);

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(getLangfuseTracerProvider).mockReturnValue(
      {} as unknown as ReturnType<typeof getLangfuseTracerProvider>
    );

    await expect(flushLangfuseTracing()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      'Langfuse OTel flush skipped: no span processor or provider forceFlush'
    );
  });

  it('skips client.flush when forceFlush consumes the shared 2s deadline', async () => {
    vi.useFakeTimers();
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');

    setLangfuseSpanProcessor({
      forceFlush: () => new Promise(() => undefined),
    } as unknown as LangfuseSpanProcessor);

    const flushPromise = flushLangfuseTracing();
    await vi.advanceTimersByTimeAsync(2_000);
    await flushPromise;
    expect(clientFlush).not.toHaveBeenCalled();
  });

  it('resolves when client.flush exceeds the time left on the deadline', async () => {
    vi.useFakeTimers();
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');
    clientFlush.mockImplementation(() => new Promise(() => undefined));

    setLangfuseSpanProcessor({
      forceFlush: async () => undefined,
    } as unknown as LangfuseSpanProcessor);

    const flushPromise = flushLangfuseTracing();
    await vi.advanceTimersByTimeAsync(2_000);
    await expect(flushPromise).resolves.toBeUndefined();
    expect(clientFlush).toHaveBeenCalledOnce();
  });
});
