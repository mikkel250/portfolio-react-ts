import { afterEach, describe, expect, it, vi } from 'vitest';

describe('flushLangSmithTracing', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('awaits in-flight createRun before client.flush and never throws', async () => {
    vi.stubEnv('LANGSMITH_TRACING', 'true');
    vi.stubEnv('LANGSMITH_API_KEY', 'ls-test');

    let resolveCreate: (() => void) | undefined;
    const createRun = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCreate = resolve;
        })
    );
    const flush = vi.fn(async () => undefined);

    vi.doMock('langsmith', () => ({
      Client: vi.fn().mockImplementation(() => ({
        createRun,
        flush,
      })),
    }));

    const { traceLLMCall, flushLangSmithTracing } = await import('../langsmith');

    const tracePromise = traceLLMCall(
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
    );

    const flushPromise = flushLangSmithTracing();
    // flush must wait on createRun — flush() not called yet
    await Promise.resolve();
    expect(flush).not.toHaveBeenCalled();

    resolveCreate?.();
    await tracePromise;
    await expect(flushPromise).resolves.toBeUndefined();
    expect(flush).toHaveBeenCalledOnce();
  });

  it('still flushes after createRun rejects and never throws', async () => {
    vi.stubEnv('LANGSMITH_TRACING', 'true');
    vi.stubEnv('LANGSMITH_API_KEY', 'ls-test');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    let rejectCreate: (error: Error) => void = () => undefined;
    const createRun = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectCreate = reject;
        })
    );
    const flush = vi.fn(async () => undefined);

    vi.doMock('langsmith', () => ({
      Client: vi.fn().mockImplementation(() => ({
        createRun,
        flush,
      })),
    }));

    const { traceLLMCall, flushLangSmithTracing } = await import('../langsmith');

    const tracePromise = traceLLMCall(
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
    );

    const flushPromise = flushLangSmithTracing();
    await Promise.resolve();
    expect(flush).not.toHaveBeenCalled();

    rejectCreate(new Error('createRun failed'));
    await expect(tracePromise).resolves.toBeUndefined();
    await expect(flushPromise).resolves.toBeUndefined();
    expect(flush).toHaveBeenCalledOnce();
  });

  it('resolves when client.flush rejects', async () => {
    vi.stubEnv('LANGSMITH_TRACING', 'true');
    vi.stubEnv('LANGSMITH_API_KEY', 'ls-test');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const createRun = vi.fn(async () => undefined);
    const flush = vi.fn(async () => {
      throw new Error('flush failed');
    });

    vi.doMock('langsmith', () => ({
      Client: vi.fn().mockImplementation(() => ({
        createRun,
        flush,
      })),
    }));

    const { traceLLMCall, flushLangSmithTracing } = await import('../langsmith');

    await traceLLMCall(
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
    );

    await expect(flushLangSmithTracing()).resolves.toBeUndefined();
    expect(flush).toHaveBeenCalledOnce();
  });

  it('skips client.flush when pending traces consume the shared deadline', async () => {
    vi.useFakeTimers();
    vi.stubEnv('LANGSMITH_TRACING', 'true');
    vi.stubEnv('LANGSMITH_API_KEY', 'ls-test');

    const createRun = vi.fn(() => new Promise<void>(() => undefined));
    const flush = vi.fn(async () => undefined);

    vi.doMock('langsmith', () => ({
      Client: vi.fn().mockImplementation(() => ({
        createRun,
        flush,
      })),
    }));

    const { traceLLMCall, flushLangSmithTracing } = await import('../langsmith');

    const tracePromise = traceLLMCall(
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
    );

    const flushPromise = flushLangSmithTracing();
    await vi.advanceTimersByTimeAsync(2_000);
    await flushPromise;
    expect(flush).not.toHaveBeenCalled();
    tracePromise.catch(() => undefined);
    vi.useRealTimers();
  });
});
