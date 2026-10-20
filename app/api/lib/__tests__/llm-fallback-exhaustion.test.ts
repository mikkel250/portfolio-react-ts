import { afterEach, describe, expect, it, vi } from 'vitest';

const generateContent = vi.fn();
const openaiCreate = vi.fn();
const deepseekCreate = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class GoogleGenAI {
    models = { generateContent };
  },
}));

vi.mock('openai', () => ({
  default: class OpenAI {
    chat: {
      completions: {
        create: typeof openaiCreate;
      };
    };
    constructor(config?: { baseURL?: string }) {
      this.chat = {
        completions: {
          create: config?.baseURL?.includes('deepseek')
            ? deepseekCreate
            : openaiCreate,
        },
      };
    }
  },
}));

vi.mock('../langsmith', () => ({
  traceLLMCall: vi.fn().mockResolvedValue(undefined),
  traceableChat: vi.fn(),
}));

vi.mock('../langfuse', () => ({
  traceLLMCall: vi.fn().mockResolvedValue(undefined),
}));

describe('chat() fallback exhaustion', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    generateContent.mockReset();
    openaiCreate.mockReset();
    deepseekCreate.mockReset();
  });

  it('throws when every configured provider fails with a retryable error', async () => {
    vi.stubEnv('GOOGLE_API_KEY', 'test-google-key');
    vi.stubEnv('DEEPSEEK_API_KEY', 'test-deepseek-key');
    vi.stubEnv('AI_MODEL', 'gemini-2.5-flash');
    vi.stubEnv('AI_MODEL_FALLBACKS', '["deepseek-v4-pro"]');

    const rateLimit = Object.assign(new Error('rate limit'), { status: 429 });
    generateContent.mockRejectedValue(rateLimit);
    deepseekCreate.mockRejectedValue(rateLimit);

    const { chat } = await import('../llm');

    await expect(
      chat([{ role: 'user', content: 'Hello' }], 'Server system prompt', {
        model: 'gemini-2.5-flash',
      })
    ).rejects.toThrow(/All LLM providers failed/);

    expect(generateContent).toHaveBeenCalledOnce();
    expect(deepseekCreate).toHaveBeenCalledOnce();
    expect(openaiCreate).not.toHaveBeenCalled();
  });
});
