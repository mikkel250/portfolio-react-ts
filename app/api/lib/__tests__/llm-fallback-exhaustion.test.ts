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

    const provider429 = Object.assign(new Error('rate limit'), { status: 429 });
    generateContent.mockRejectedValue(provider429);
    deepseekCreate.mockRejectedValue(provider429);

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

  it('aborts on a plain 400 and does not call the fallback', async () => {
    vi.stubEnv('GOOGLE_API_KEY', 'test-google-key');
    vi.stubEnv('DEEPSEEK_API_KEY', 'test-deepseek-key');
    vi.stubEnv('AI_MODEL', 'gemini-2.5-flash');
    vi.stubEnv('AI_MODEL_FALLBACKS', '["deepseek-v4-pro"]');

    generateContent.mockRejectedValue(
      Object.assign(new Error('Invalid JSON payload'), { status: 400 })
    );

    const { chat } = await import('../llm');

    await expect(
      chat([{ role: 'user', content: 'Hello' }], 'Server system prompt', {
        model: 'gemini-2.5-flash',
      })
    ).rejects.toMatchObject({
      status: 400,
      message: 'Invalid JSON payload',
    });

    expect(generateContent).toHaveBeenCalledOnce();
    expect(deepseekCreate).not.toHaveBeenCalled();
    expect(openaiCreate).not.toHaveBeenCalled();
  });

  it('exhausts the chain when a Gemini API-key 400 is retryable and the fallback fails', async () => {
    vi.stubEnv('GOOGLE_API_KEY', 'test-google-key');
    vi.stubEnv('DEEPSEEK_API_KEY', 'test-deepseek-key');
    vi.stubEnv('AI_MODEL', 'gemini-2.5-flash');
    vi.stubEnv('AI_MODEL_FALLBACKS', '["deepseek-v4-pro"]');

    generateContent.mockRejectedValue(
      Object.assign(new Error('API key not valid. Please pass a valid API key.'), {
        status: 400,
      })
    );
    deepseekCreate.mockRejectedValue(Object.assign(new Error('rate limit'), { status: 429 }));

    const { chat } = await import('../llm');

    await expect(
      chat([{ role: 'user', content: 'Hello' }], 'Server system prompt', {
        model: 'gemini-2.5-flash',
      })
    ).rejects.toThrow('All LLM providers failed. Last error: rate limit');

    expect(generateContent).toHaveBeenCalledOnce();
    expect(deepseekCreate).toHaveBeenCalledOnce();
    expect(openaiCreate).not.toHaveBeenCalled();
  });
});
