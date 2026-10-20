import { afterEach, describe, expect, it, vi } from 'vitest';
import { blockingTailMs, createStepClock, pipelineGapMs } from '../chat-timings';
import { resolveDeepseekReasoningEffort } from '../llm';
import { detectProvider } from '../llm-fallback-chain';

describe('createStepClock', () => {
  it('records laps and a total at least the sum of steps', async () => {
    const clock = createStepClock();
    await new Promise((r) => setTimeout(r, 5));
    clock.lap('filter');
    await new Promise((r) => setTimeout(r, 5));
    clock.lap('llm');
    const timings = clock.finish();

    expect(timings.filter).toBeGreaterThanOrEqual(0);
    expect(timings.llm).toBeGreaterThanOrEqual(0);
    expect(timings.total).toBeGreaterThanOrEqual(timings.filter + timings.llm);
  });

  it('set records an explicit duration', () => {
    const clock = createStepClock();
    clock.set('llm', 1234);
    const timings = clock.finish();
    expect(timings.llm).toBe(1234);
  });

  it('elapsed keeps growing after finish and blockingTailMs is the gap', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-19T00:00:00.000Z'));
    const clock = createStepClock();
    vi.advanceTimersByTime(1_000);
    clock.lap('llm');
    const timings = clock.finish();
    vi.advanceTimersByTime(40);
    expect(timings.total).toBe(1_000);
    expect(clock.elapsed()).toBe(1_040);
    expect(blockingTailMs(timings.total, clock.elapsed())).toBe(40);
    expect(blockingTailMs(1_000, 900)).toBe(0);
    expect(pipelineGapMs({ filter: 10, llm: 100, total: 150 })).toBe(40);
    expect(pipelineGapMs({ llm: 100, total: 100 })).toBe(0);
    vi.useRealTimers();
  });

  it('supports filter-only path without llm lap', () => {
    const clock = createStepClock();
    clock.lap('filter');
    const timings = clock.finish();
    expect(timings.filter).toBeGreaterThanOrEqual(0);
    expect(timings.llm).toBeUndefined();
    expect(timings.total).toBeGreaterThanOrEqual(timings.filter);
  });
});

describe('resolveDeepseekReasoningEffort', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts max, high, and disabled', () => {
    expect(resolveDeepseekReasoningEffort('max')).toBe('max');
    expect(resolveDeepseekReasoningEffort('HIGH')).toBe('high');
    expect(resolveDeepseekReasoningEffort('disabled')).toBe('disabled');
  });

  it('defaults invalid values to high', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveDeepseekReasoningEffort('low')).toBe('high');
    expect(warn).toHaveBeenCalled();
  });
});

describe('detectProvider flash', () => {
  it('maps deepseek-v4-flash to deepseek', () => {
    expect(detectProvider('deepseek-v4-flash')).toBe('deepseek');
  });
});
