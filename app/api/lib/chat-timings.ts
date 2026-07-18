/**
 * Lightweight wall-clock step timer for chat route attribution.
 */

export type ChatTimingsMs = Record<string, number> & { total: number };

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
    finish(): ChatTimingsMs {
      return {
        ...steps,
        total: Date.now() - startedAt,
      };
    },
  };
}
