/**
 * Lightweight wall-clock step timer for chat route attribution.
 */

export type ChatTimingsMs = Record<string, number> & { total: number };

/** Time still on the response path after the pipeline clock stopped. */
export function blockingTailMs(pipelineTotalMs: number, handlerMs: number): number {
  return Math.max(0, handlerMs - pipelineTotalMs);
}

/**
 * Wall clock in `total` that is not in a named step.
 * With Langfuse on, this is mostly the generation span awaited inside `chat()`
 * after the provider returns. The post-response flush is not in this number.
 */
export function pipelineGapMs(timings: ChatTimingsMs): number {
  const stepMs = Object.entries(timings)
    .filter(([key]) => key !== 'total')
    .reduce((sum, [, value]) => sum + value, 0);
  return Math.max(0, timings.total - stepMs);
}

export function createStepClock() {
  const startedAt = Date.now();
  let lastAt = startedAt;
  const steps: Record<string, number> = {};

  return {
    lap(name: string) {
      const now = Date.now();
      steps[name] = now - lastAt;
      lastAt = now;
    },
    /** Record an externally measured duration (e.g. LLM provider only, excluding tracing). */
    set(name: string, durationMs: number) {
      steps[name] = Math.max(0, durationMs);
      lastAt = Date.now();
    },
    /** Wall clock from clock start, including work after finish(). */
    elapsed(): number {
      return Date.now() - startedAt;
    },
    finish(): ChatTimingsMs {
      return {
        ...steps,
        total: Date.now() - startedAt,
      };
    },
  };
}
