/**
 * Next.js instrumentation — registers OpenTelemetry with Langfuse span export.
 * Only starts when LANGFUSE_TRACING=true and Langfuse API keys are set.
 *
 * The span processor is stashed on globalThis so request handlers can
 * forceFlush before serverless exit (required to export OTel spans).
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * @see https://langfuse.com/docs/observability/features/queuing-batching
 */

import type { LangfuseSpanProcessor as LangfuseSpanProcessorType } from '@langfuse/otel';

/** Set when OTel SDK starts; used by flushLangfuseTracing. */
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

  (
    globalThis as { __langfuseSpanProcessor?: LangfuseSpanProcessorType | null }
  ).__langfuseSpanProcessor = langfuseSpanProcessor;
}
