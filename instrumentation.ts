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

import type { LangfuseSpanProcessor } from '@langfuse/otel';
import {
  getLangfuseSpanProcessor,
  setLangfuseSpanProcessor,
} from './app/api/lib/langfuse-span-processor-ref';

/** Local handle for this instrumentation module graph. */
let langfuseSpanProcessor: LangfuseSpanProcessor | null = null;

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

  const { NodeTracerProvider } = await import('@opentelemetry/sdk-trace-node');
  const { LangfuseSpanProcessor } = await import('@langfuse/otel');
  const { setLangfuseTracerProvider } = await import('@langfuse/tracing');

  // immediate: safer for serverless / short-lived requests.
  // Pass credentials explicitly so the exporter does not depend on a later env load.
  langfuseSpanProcessor = new LangfuseSpanProcessor({
    exportMode: 'immediate',
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
  });

  const tracerProvider = new NodeTracerProvider({
    spanProcessors: [langfuseSpanProcessor],
  });

  // SDK reads this provider even when the OTEL global belongs to another bundle.
  setLangfuseTracerProvider(tracerProvider);
  tracerProvider.register();
  if (!getLangfuseSpanProcessor()) {
    setLangfuseSpanProcessor(langfuseSpanProcessor);
  }
}
