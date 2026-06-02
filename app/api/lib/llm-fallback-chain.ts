export type Provider = 'openai' | 'anthropic' | 'google' | 'deepseek';

export interface FallbackChainEntry {
  provider: Provider;
  model: string;
  reason: string;
}

export function detectProvider(model: string): Provider {
  const modelToLower = model.toLowerCase();

  if (modelToLower.includes('claude')) {
    return 'anthropic';
  }

  if (modelToLower.includes('gemini')) {
    return 'google';
  }

  if (modelToLower.includes('deepseek')) {
    return 'deepseek';
  }

  return 'openai';
}

export function buildFallbackChain(
  primaryModel: string,
  env: NodeJS.ProcessEnv = process.env
): FallbackChainEntry[] {
  const fallbackChain: FallbackChainEntry[] = [];

  const primaryProvider = detectProvider(primaryModel);
  fallbackChain.push({
    provider: primaryProvider,
    model: primaryModel,
    reason: 'Primary model',
  });

  try {
    const fallbackModelsJson = env.AI_MODEL_FALLBACKS;
    if (fallbackModelsJson) {
      const fallbackModels = JSON.parse(fallbackModelsJson);
      if (Array.isArray(fallbackModels)) {
        fallbackModels.forEach((model, index) => {
          if (typeof model === 'string' && model.trim()) {
            const provider = detectProvider(model);
            fallbackChain.push({
              provider,
              model: model.trim(),
              reason: `Fallback ${index + 1}`,
            });
          }
        });
        console.log(`Loaded ${fallbackModels.length} fallback models from AI_MODEL_FALLBACKS`);
      } else {
        console.log('AI_MODEL_FALLBACKS is not a valid JSON array');
      }
    }
  } catch (error) {
    console.log('Failed to parse AI_MODEL_FALLBACKS JSON:', error);
  }

  if (fallbackChain.length === 1) {
    console.log('No fallback models configured in AI_MODEL_FALLBACKS. Using default fallbacks.');
    fallbackChain.push(
      { provider: 'deepseek', model: 'deepseek-v4-pro', reason: 'Default fallback 1 (DeepSeek)' },
      { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', reason: 'Default fallback 2' }
    );
  }

  return fallbackChain.filter((entry) => {
    if (entry.provider === 'deepseek' && !env.DEEPSEEK_API_KEY?.trim()) {
      return false;
    }
    return true;
  });
}

export function isRetryableError(error: unknown): boolean {
  const err = error as { status?: number; message?: string; code?: string };

  if (err.status === 429) {
    return true;
  }

  if (err.message?.includes('quota') || err.message?.includes('Quota')) {
    return true;
  }

  if (err.message?.includes('rate limit') || err.message?.includes('Rate limit')) {
    return true;
  }

  if (err.status === 500 || err.status === 503 || err.status === 502) {
    return true;
  }

  if (err.message?.includes('MAX_TOKENS') || err.message?.includes('RESOURCE_EXHAUSTED')) {
    return true;
  }

  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return true;
  }

  if (err.status === 401) {
    return false;
  }

  if (err.status === 400) {
    return false;
  }

  if (err.status === 403) {
    return false;
  }

  return true;
}
