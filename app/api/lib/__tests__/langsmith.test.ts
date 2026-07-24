import { afterEach, describe, expect, it, vi } from 'vitest';

describe('flushLangSmithTracing', () => {
  afterEach(() => {
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
});
