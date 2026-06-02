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

describe('buildFallbackChain', () => {
  it('uses primary first then AI_MODEL_FALLBACKS in order', () => {
    const chain = buildFallbackChain('gemini-2.5-flash', {
      AI_MODEL_FALLBACKS: '["deepseek-v4-pro","claude-haiku-4-5-20251001"]',
      DEEPSEEK_API_KEY: 'test-key',
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
      AI_MODEL_FALLBACKS: '["deepseek-v4-pro","claude-haiku-4-5-20251001"]',
    });

    expect(chain.map((e) => e.provider)).not.toContain('deepseek');
    expect(chain).toHaveLength(2);
  });

  it('includes DeepSeek when DEEPSEEK_API_KEY is set', () => {
    const chain = buildFallbackChain('gemini-2.5-flash', {
      DEEPSEEK_API_KEY: 'sk-test',
    });

    expect(chain.map((e) => e.provider)).toContain('deepseek');
  });

  it('uses DeepSeek then Anthropic defaults when AI_MODEL_FALLBACKS is unset', () => {
    const chain = buildFallbackChain('gemini-2.5-flash', {
      DEEPSEEK_API_KEY: 'sk-test',
    });

    expect(chain.map((e) => e.model)).toEqual([
      'gemini-2.5-flash',
      'deepseek-v4-pro',
      'claude-haiku-4-5-20251001',
    ]);
    expect(chain.map((e) => e.model)).not.toContain('gpt-4o');
  });
});

describe('isRetryableError', () => {
  it('treats rate limits and quota as retryable', () => {
    expect(isRetryableError({ status: 429 })).toBe(true);
    expect(isRetryableError({ message: 'Quota exceeded for metric' })).toBe(true);
  });

  it('treats auth errors as non-retryable', () => {
    expect(isRetryableError({ status: 401 })).toBe(false);
  });
});
