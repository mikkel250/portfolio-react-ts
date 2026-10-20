import { describe, expect, it } from 'vitest';
import {
  buildFallbackChain,
  detectProvider,
  isRetryableError,
} from '../llm-fallback-chain';

describe('detectProvider', () => {
  it('maps model name prefixes to providers', () => {
    expect(detectProvider('gemini-2.5-flash')).toBe('google');
    expect(detectProvider('claude-haiku-4-5-20251001')).toBe('anthropic');
    expect(detectProvider('deepseek-v4-pro')).toBe('deepseek');
    expect(detectProvider('gpt-4o-mini')).toBe('openai');
  });
});

const allProviderKeys = {
  GOOGLE_API_KEY: 'google-key',
  DEEPSEEK_API_KEY: 'test-key',
  ANTHROPIC_API_KEY: 'anthropic-key',
  OPENAI_API_KEY: 'openai-key',
};

describe('buildFallbackChain', () => {
  it('uses primary first then AI_MODEL_FALLBACKS in order', () => {
    const chain = buildFallbackChain('gemini-2.5-flash', {
      ...allProviderKeys,
      AI_MODEL_FALLBACKS: '["deepseek-v4-pro","claude-haiku-4-5-20251001"]',
    });

    expect(chain).toHaveLength(3);
    expect(chain[0]).toMatchObject({ model: 'gemini-2.5-flash', provider: 'google' });
    expect(chain[1]).toMatchObject({ model: 'deepseek-v4-pro', provider: 'deepseek' });
    expect(chain[2]).toMatchObject({
      model: 'claude-haiku-4-5-20251001',
      provider: 'anthropic',
    });
  });

  it('omits DeepSeek when DEEPSEEK_API_KEY is unset', () => {
    const chain = buildFallbackChain('gemini-2.5-flash', {
      GOOGLE_API_KEY: 'google-key',
      ANTHROPIC_API_KEY: 'anthropic-key',
      OPENAI_API_KEY: 'openai-key',
      AI_MODEL_FALLBACKS: '["deepseek-v4-pro","claude-haiku-4-5-20251001"]',
    });

    expect(chain.map((e) => e.provider)).not.toContain('deepseek');
    expect(chain).toHaveLength(2);
  });

  it('includes DeepSeek when DEEPSEEK_API_KEY is set', () => {
    const chain = buildFallbackChain('gemini-2.5-flash', {
      ...allProviderKeys,
      DEEPSEEK_API_KEY: 'sk-test',
    });

    expect(chain.map((e) => e.provider)).toContain('deepseek');
  });

  it('uses DeepSeek then Anthropic defaults when AI_MODEL_FALLBACKS is unset', () => {
    const chain = buildFallbackChain('gemini-2.5-flash', {
      ...allProviderKeys,
      DEEPSEEK_API_KEY: 'sk-test',
    });

    expect(chain.map((e) => e.model)).toEqual([
      'gemini-2.5-flash',
      'deepseek-v4-pro',
      'claude-haiku-4-5-20251001',
    ]);
    expect(chain.map((e) => e.model)).not.toContain('gpt-4o');
  });

  it('throws when no providers have API keys configured', () => {
    expect(() => buildFallbackChain('gemini-2.5-flash', {})).toThrow(
      'No LLM providers configured with valid API keys'
    );
  });
});

describe('isRetryableError', () => {
  it('treats rate limits and quota as retryable', () => {
    expect(isRetryableError({ status: 429 })).toBe(true);
    expect(isRetryableError({ message: 'Quota exceeded for metric' })).toBe(true);
  });

  it('treats provider-scoped auth errors as retryable for fallback', () => {
    expect(isRetryableError({ status: 401 })).toBe(true);
    expect(isRetryableError({ status: 403 })).toBe(true);
  });

  it('aborts on a plain 400 (bad request)', () => {
    expect(isRetryableError({ status: 400, message: 'Invalid JSON payload' })).toBe(false);
  });

  it('advances on Gemini invalid or expired API key reported as 400', () => {
    expect(
      isRetryableError({
        status: 400,
        message: 'API key not valid. Please pass a valid API key.',
      }),
    ).toBe(true);
    expect(isRetryableError({ status: 400, message: 'reason: API_KEY_INVALID' })).toBe(true);
  });

  it('advances on 5xx and network error codes', () => {
    for (const status of [500, 502, 503]) {
      expect(isRetryableError({ status })).toBe(true);
    }
    for (const code of ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT']) {
      expect(isRetryableError({ code })).toBe(true);
    }
  });

  it('defaults unknown and non-object errors to retryable', () => {
    expect(isRetryableError(new Error('something odd'))).toBe(true);
    expect(isRetryableError(null)).toBe(true);
    expect(isRetryableError('boom')).toBe(true);
  });
});
