/**
 * Next.js instrumentation — registers OpenTelemetry with Langfuse span export.
 * Only starts when LANGFUSE_TRACING=true and Langfuse API keys are set.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

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

  const sdk = new NodeSDK({
    spanProcessors: [new LangfuseSpanProcessor()],
  });

  sdk.start();
}
