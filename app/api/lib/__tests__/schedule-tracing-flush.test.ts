import { afterEach, describe, expect, it, vi } from 'vitest';

const afterMock = vi.hoisted(() => vi.fn());
const flushLangfuse = vi.hoisted(() => vi.fn(async () => undefined));
const flushLangsmith = vi.hoisted(() => vi.fn(async () => undefined));
const langfuseEnabled = vi.hoisted(() => ({ value: false }));

vi.mock('next/server', () => ({
  after: (task: unknown) => afterMock(task),
}));

vi.mock('../langfuse', () => ({
  flushLangfuseTracing: () => flushLangfuse(),
  isLangfuseTracingEnabled: () => langfuseEnabled.value,
}));

vi.mock('../langsmith', () => ({
  flushLangSmithTracing: () => flushLangsmith(),
}));

import { scheduleTracingFlush } from '../schedule-tracing-flush';

describe('scheduleTracingFlush', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    langfuseEnabled.value = false;
  });

  it('does nothing when both tracers are off', () => {
    scheduleTracingFlush();
    expect(afterMock).not.toHaveBeenCalled();
    expect(flushLangfuse).not.toHaveBeenCalled();
    expect(flushLangsmith).not.toHaveBeenCalled();
  });

  it('hands the flush to after() and returns before it settles', async () => {
    langfuseEnabled.value = true;
    let release: () => void = () => undefined;
    flushLangfuse.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );

    scheduleTracingFlush();

    expect(afterMock).toHaveBeenCalledOnce();
    expect(flushLangfuse).not.toHaveBeenCalled();

    const task = afterMock.mock.calls[0][0] as () => Promise<void>;
    const pending = task();
    expect(flushLangfuse).toHaveBeenCalledOnce();
    release();
    await pending;
    expect(flushLangsmith).toHaveBeenCalledOnce();
  });

  it('still starts the flush when after() has no request scope', async () => {
    vi.stubEnv('LANGSMITH_TRACING', 'true');
    afterMock.mockImplementation(() => {
      throw new Error('`after` was called outside a request scope');
    });
    let release: () => void = () => undefined;
    flushLangfuse.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );

    scheduleTracingFlush();

    expect(flushLangfuse).toHaveBeenCalledOnce();
    expect(flushLangsmith).not.toHaveBeenCalled();
    release();
    await vi.waitFor(() => {
      expect(flushLangsmith).toHaveBeenCalledOnce();
    });
  });
});
