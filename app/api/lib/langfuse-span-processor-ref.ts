/**
 * Cross-bundle handle for the Langfuse OTel span processor.
 *
 * Next.js loads `instrumentation.ts` and API routes in separate module graphs,
 * so a plain module-level export is not always shared. We keep one typed
 * global slot and expose get/set helpers so callers never cast globalThis.
 *
 * @see ARCHITECTURE.md — Cross-Bundle State via globalThis
 */

import type { LangfuseSpanProcessor } from '@langfuse/otel';

const KEY = '__portfolio_langfuse_span_processor__v1';

export function setLangfuseSpanProcessor(
  processor: LangfuseSpanProcessor | null
): void {
  (globalThis as Record<string, unknown>)[KEY] = processor;
}

export function getLangfuseSpanProcessor(): LangfuseSpanProcessor | null {
  return (
    ((globalThis as Record<string, unknown>)[KEY] as LangfuseSpanProcessor) ??
    null
  );
}
