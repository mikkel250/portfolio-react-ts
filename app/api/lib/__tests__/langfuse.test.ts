import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  flushLangfuseTracing,
  isLangfuseTracingEnabled,
  traceLLMCall,
} from '../langfuse';

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
  });

  it('no-ops without throwing when tracing is off', async () => {
    vi.stubEnv('LANGFUSE_TRACING', 'false');
    await expect(flushLangfuseTracing()).resolves.toBeUndefined();
  });
});
