/**
 * Next.js instrumentation — registers OpenTelemetry with Langfuse span export.
 * Only starts when LANGFUSE_TRACING=true and Langfuse API keys are set.
 *
 * Registers the processor via typed get/set helpers so API routes can
 * forceFlush before serverless exit without importing this file.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * @see https://langfuse.com/docs/observability/features/queuing-batching
 */

import type { LangfuseSpanProcessor as LangfuseSpanProcessorType } from '@langfuse/otel';
import { setLangfuseSpanProcessor } from './app/api/lib/langfuse-span-processor-ref';

/** Local handle for this instrumentation module graph. */
export let langfuseSpanProcessor: LangfuseSpanProcessorType | null = null;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    return;
  }

  const tracingEnabled = process.env.LANGFUSE_TRACING === 'true';
  const hasKeys =
    !!process.env.LANGFUSE_PUBLIC_KEY?.trim() &&
    !!process.env.LANGFUSE_SECRET_KEY?.trim();

  if (!tracingEnabled || !hasKeys) {
    return;
  }

  const { NodeSDK } = await import('@opentelemetry/sdk-node');
  const { LangfuseSpanProcessor } = await import('@langfuse/otel');

  // immediate: safer for serverless / short-lived requests
  langfuseSpanProcessor = new LangfuseSpanProcessor({
    exportMode: 'immediate',
  });

  const sdk = new NodeSDK({
    spanProcessors: [langfuseSpanProcessor],
  });

  sdk.start();
  setLangfuseSpanProcessor(langfuseSpanProcessor);
}
