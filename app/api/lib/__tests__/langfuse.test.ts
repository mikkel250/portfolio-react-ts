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
  ensureLangfuseTracing,
  resetLangfuseTracingInitStateForTests,
} from '../langfuse';
import {
  getLangfuseSpanProcessor,
  setLangfuseSpanProcessor,
} from '../langfuse-span-processor-ref';

const startActiveObservationMock = vi.fn();
const setLangfuseTracerProviderMock = vi.fn();
const tracerProviderRegister = vi.fn();
let langfuseProcessorCtorCount = 0;
let langfuseProcessorShouldThrow = false;

vi.mock('@langfuse/tracing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@langfuse/tracing')>();
  return {
    ...actual,
    getLangfuseTracerProvider: vi.fn(),
    setLangfuseTracerProvider: (...args: unknown[]) =>
      setLangfuseTracerProviderMock(...args),
    startActiveObservation: (...args: unknown[]) =>
      startActiveObservationMock(...args),
  };
});

vi.mock('@opentelemetry/sdk-trace-node', () => ({
  NodeTracerProvider: class NodeTracerProvider {
    register = tracerProviderRegister;
  },
}));

vi.mock('@langfuse/otel', () => ({
  LangfuseSpanProcessor: class LangfuseSpanProcessor {
    constructor() {
      langfuseProcessorCtorCount += 1;
      if (langfuseProcessorShouldThrow) {
        throw new Error('exporter init failed');
      }
    }
  },
}));

function clearLangfuseInitState(): void {
  resetLangfuseTracingInitStateForTests();
  setLangfuseSpanProcessor(null);
  langfuseProcessorCtorCount = 0;
  langfuseProcessorShouldThrow = false;
  tracerProviderRegister.mockClear();
  setLangfuseTracerProviderMock.mockClear();
}

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

describe('ensureLangfuseTracing', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    clearLangfuseInitState();
  });

  it('shares one in-flight initialization across concurrent callers', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');

    const results = await Promise.all([
      ensureLangfuseTracing(),
      ensureLangfuseTracing(),
    ]);

    expect(results).toEqual([true, true]);
    expect(langfuseProcessorCtorCount).toBe(1);
    expect(tracerProviderRegister).toHaveBeenCalledOnce();
    expect(setLangfuseTracerProviderMock).toHaveBeenCalledOnce();
  });

  it('reuses a span processor already published by instrumentation', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');

    const existingProcessor = {
      forceFlush: vi.fn(),
    } as unknown as LangfuseSpanProcessor;
    setLangfuseSpanProcessor(existingProcessor);

    await expect(ensureLangfuseTracing()).resolves.toBe(true);
    await expect(ensureLangfuseTracing()).resolves.toBe(true);

    expect(getLangfuseSpanProcessor()).toBe(existingProcessor);
    expect(langfuseProcessorCtorCount).toBe(0);
    expect(tracerProviderRegister).not.toHaveBeenCalled();
    expect(setLangfuseTracerProviderMock).not.toHaveBeenCalled();
  });

  it('returns false when initialization fails and lets a later call retry', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk');
    langfuseProcessorShouldThrow = true;
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      Promise.all([ensureLangfuseTracing(), ensureLangfuseTracing()])
    ).resolves.toEqual([false, false]);
    expect(langfuseProcessorCtorCount).toBe(1);
    expect(tracerProviderRegister).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalledOnce();

    langfuseProcessorShouldThrow = false;
    await expect(ensureLangfuseTracing()).resolves.toBe(true);
    expect(langfuseProcessorCtorCount).toBe(2);
    errorLog.mockRestore();
  });
});

describe('traceLLMCall', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    startActiveObservationMock.mockReset();
    clearLangfuseInitState();
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
        input: [
          { role: 'system', content: 'system' },
          { role: 'user', content: 'hi' },
        ],
        output: [{ role: 'assistant', content: 'ok' }],
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
