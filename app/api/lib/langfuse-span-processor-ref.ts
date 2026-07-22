/**
 * Cross-bundle handle for the Langfuse OTel span processor.
 *
 * Next.js loads `instrumentation.ts` and API routes in separate module graphs,
 * so a plain module-level export is not always shared. We keep one typed
 * global slot and expose get/set helpers so callers never cast globalThis.
 */

import type { LangfuseSpanProcessor } from '@langfuse/otel';

const GLOBAL_KEY = '__portfolioLangfuseSpanProcessor' as const;

type LangfuseSpanProcessorGlobal = typeof globalThis & {
  [GLOBAL_KEY]?: LangfuseSpanProcessor | null;
};

function getStore(): LangfuseSpanProcessorGlobal {
  return globalThis as LangfuseSpanProcessorGlobal;
}

export function setLangfuseSpanProcessor(
  processor: LangfuseSpanProcessor | null
): void {
  getStore()[GLOBAL_KEY] = processor;
}

export function getLangfuseSpanProcessor(): LangfuseSpanProcessor | null {
  return getStore()[GLOBAL_KEY] ?? null;
}

/** Test helper — clears the shared slot. */
export function clearLangfuseSpanProcessor(): void {
  delete getStore()[GLOBAL_KEY];
}
