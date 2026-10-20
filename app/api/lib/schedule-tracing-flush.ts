// Schedules Langfuse and LangSmith flushes after the HTTP response is sent.
//
// Next.js 15.5 `after()` (stable since 15.1) runs the callback once the
// route handler finishes. On Vercel, Next passes that promise to the
// platform `waitUntil`, so the serverless invocation stays alive without
// holding the response. Node `runtime = 'nodejs'` route handlers are
// supported; static export is not. `after()` still counts against the
// route's maxDuration, so each flush keeps its own 2s cap.
//
// Unit tests call handlers outside Next's request store, where `after()`
// throws. Only that test runtime starts the flush without awaiting it.
// If `after()` fails in a real runtime, the flush is logged and skipped.
// A detached promise is not passed to `waitUntil`, so the instance can
// freeze before the export finishes.

import { after } from 'next/server';
import { flushLangfuseTracing, isLangfuseTracingEnabled } from './langfuse';
import { flushLangSmithTracing } from './langsmith';

function langsmithTracingEnabled(): boolean {
  return process.env.LANGSMITH_TRACING === 'true';
}

function isTracingTestRuntime(): boolean {
  return process.env.VITEST === 'true' || process.env.NODE_ENV === 'test';
}

async function flushTracing(): Promise<void> {
  const langfuseStarted = Date.now();
  try {
    await flushLangfuseTracing();
  } catch (error) {
    console.error(
      'Langfuse flush failed:',
      error instanceof Error ? error.message : 'non-Error thrown'
    );
  }
  const langfuse_flush_ms = Date.now() - langfuseStarted;

  const langsmithStarted = Date.now();
  try {
    await flushLangSmithTracing();
  } catch (error) {
    console.error(
      'LangSmith flush failed:',
      error instanceof Error ? error.message : 'non-Error thrown'
    );
  }
  const langsmith_flush_ms = Date.now() - langsmithStarted;

  console.log('[tracing] flush_ms', {
    langfuse_flush_ms,
    langsmith_flush_ms,
    langfuse: isLangfuseTracingEnabled(),
    langsmith: langsmithTracingEnabled(),
  });
}

export function scheduleTracingFlush(): void {
  if (!isLangfuseTracingEnabled() && !langsmithTracingEnabled()) {
    return;
  }

  const task = () => flushTracing();
  try {
    after(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const outsideRequestScope = message.includes('outside a request scope');
    if (outsideRequestScope && isTracingTestRuntime()) {
      void task();
      return;
    }
    console.error(
      'tracing flush skipped: after() did not schedule it:',
      message || 'non-Error thrown'
    );
  }
}
