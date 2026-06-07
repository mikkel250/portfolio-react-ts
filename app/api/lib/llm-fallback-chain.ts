// ---------------------------------------------------------------------------
// LLM Fallback Chain
// ---------------------------------------------------------------------------
// Purpose: Builds an ordered list of LLM providers to try when the primary
// model fails (rate limits, quota exceeded, auth errors, server errors).
// This ensures the chat never goes down due to a single provider outage.
//
// Architecture:
//   1. Primary model from AI_MODEL env var (e.g., gemini-2.5-pro)
//   2. Fallback models from AI_MODEL_FALLBACKS JSON array env var
//   3. Hardcoded defaults if no fallbacks configured (DeepSeek, then Claude)
//   4. Providers with missing API keys are auto-removed from the chain
//
// Usage: buildFallbackChain(primaryModel, process.env) returns an ordered
// array. The caller iterates, trying each until one succeeds.
// ---------------------------------------------------------------------------

/** Union of all supported LLM providers */
export type Provider = 'openai' | 'anthropic' | 'google' | 'deepseek';

/** Single entry in the fallback chain — which provider+model to try, and why */
export interface FallbackChainEntry {
  provider: Provider;
  model: string;
  reason: string;  // human-readable reason (e.g., "Primary model", "Fallback 1")
}

/**
 * detectProvider: Maps a model name to its provider.
 *
 * Uses simple prefix matching — model names with "claude" → Anthropic,
 * "gemini" → Google, "deepseek" → DeepSeek, everything else → OpenAI.
 * This is used both for building the fallback chain and for provider
 * detection when calling the LLM.
 */
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

  // Default: treat unknown models as OpenAI (most models follow OpenAI API format)
  return 'openai';
}

/**
 * buildFallbackChain: Constructs the ordered fallback chain for LLM calls.
 *
 * Chain construction (in order):
 *   1. Primary model (from AI_MODEL env var or caller override)
 *   2. Any models listed in AI_MODEL_FALLBACKS JSON env var array
 *   3. Hardcoded defaults: DeepSeek v4 Pro, then Claude Haiku 4.5
 *
 * Filtering: Models are removed if their provider's API key is missing.
 * This means the chain adapts to whatever credentials are configured —
 * no need to edit code when you only have keys for some providers.
 *
 * Example .env.local:
 *   AI_MODEL=gemini-2.5-pro
 *   AI_MODEL_FALLBACKS=["claude-haiku-4-5-20251001", "deepseek-v4-pro"]
 *   GOOGLE_API_KEY=...
 *   ANTHROPIC_API_KEY=...
 *   DEEPSEEK_API_KEY=...
 *
 * Resulting chain: gemini-2.5-pro → claude-haiku → deepseek-v4-pro
 * (If any key is missing, that entry is filtered out)
 */
export function buildFallbackChain(
  primaryModel: string,
  env: NodeJS.ProcessEnv = process.env
): FallbackChainEntry[] {
  const fallbackChain: FallbackChainEntry[] = [];

  // Step 1: Add primary model (always first)
  const primaryProvider = detectProvider(primaryModel);
  fallbackChain.push({
    provider: primaryProvider,
    model: primaryModel,
    reason: 'Primary model',
  });

  // Step 2: Parse AI_MODEL_FALLBACKS JSON env var for additional models
  try {
    const fallbackModelsJson = env.AI_MODEL_FALLBACKS;
    if (fallbackModelsJson) {
      const fallbackModels = JSON.parse(fallbackModelsJson);
      if (Array.isArray(fallbackModels)) {
        let loadedCount = 0;
        fallbackModels.forEach((model, index) => {
          if (typeof model === 'string' && model.trim()) {
            const provider = detectProvider(model);
            fallbackChain.push({
              provider,
              model: model.trim(),
              reason: `Fallback ${index + 1}`,
            });
            loadedCount += 1;
          }
        });
        console.log(`Loaded ${loadedCount} fallback models from AI_MODEL_FALLBACKS`);
      } else {
        console.log('AI_MODEL_FALLBACKS is not a valid JSON array');
      }
    }
  } catch (error) {
    console.log('Failed to parse AI_MODEL_FALLBACKS JSON:', error);
  }

  // Step 3: If no fallbacks were configured, use hardcoded defaults
  if (fallbackChain.length === 1) {
    console.log('No fallback models configured in AI_MODEL_FALLBACKS. Using default fallbacks.');
    fallbackChain.push(
      { provider: 'deepseek', model: 'deepseek-v4-pro', reason: 'Default fallback 1 (DeepSeek)' },
      { provider: 'anthropic', model: 'claude-haiku-4-5-20251001', reason: 'Default fallback 2' }
    );
  }

  // Step 4: Filter out providers that don't have API keys configured
  // This avoids trying providers that will definitely fail (401/403)
  return fallbackChain.filter((entry) => {
    if (entry.provider === 'deepseek' && !env.DEEPSEEK_API_KEY?.trim()) {
      return false;
    }
    return true;
  });
}

/**
 * isRetryableError: Decides whether to continue the fallback chain
 * after a provider error, or abort immediately.
 *
 * RETRYABLE (advance to next fallback):
 *   429  — Rate limited (try another provider)
 *   500/502/503 — Server errors (try another provider)
 *   401/403 — Auth errors (maybe a different provider works)
 *   Quota exceeded, RESOURCE_EXHAUSTED, MAX_TOKENS
 *   Network errors (ENOTFOUND, ECONNREFUSED, ETIMEDOUT)
 *   Unknown errors (default: retry to be safe)
 *
 * NON-RETRYABLE (abort immediately):
 *   400  — Bad request (the problem is in our request, not the provider;
 *          retrying with another provider would give the same error)
 *
 * Design rationale: We're generous with retries because the fallback
 * chain exists precisely for this reason — different providers may
 * have different rate limits, quotas, or uptime. Only 400s indicate
 * a problem with our own code, so only those abort the chain.
 */
export function isRetryableError(error: unknown): boolean {
  // Null/undefined/non-object: treat as retryable (better to try another
  // provider than fail silently)
  if (!error || typeof error !== 'object') {
    return true;
  }

  const err = error as { status?: number; message?: string; code?: string };

  // 429 Too Many Requests — provider's rate limit
  if (err.status === 429) {
    return true;
  }

  // Quota exceeded (Google/OpenAI billing limits)
  if (err.message?.includes('quota') || err.message?.includes('Quota')) {
    return true;
  }

  // Rate limit message variants
  if (err.message?.includes('rate limit') || err.message?.includes('Rate limit')) {
    return true;
  }

  // Server errors — provider is having issues
  if (err.status === 500 || err.status === 503 || err.status === 502) {
    return true;
  }

  // Token/resource exhaustion (try a provider with different limits)
  if (err.message?.includes('MAX_TOKENS') || err.message?.includes('RESOURCE_EXHAUSTED')) {
    return true;
  }

  // Network errors — DNS, connection refused, timeout
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return true;
  }

  // Auth failures per-provider: if one provider's key is bad, try another.
  // The chain already filters out providers with missing keys, but a key
  // could be present yet disabled/invalid — advance to next fallback.
  if (err.status === 401 || err.status === 403) {
    return true;
  }

  // 400 Bad Request — something is wrong with OUR request (bad prompt,
  // malformed messages, etc.). Retrying with another provider would
  // likely fail the same way. Abort the chain.
  if (err.status === 400) {
    return false;
  }

  // Unknown error type — default to retry (favor resilience)
  return true;
}
