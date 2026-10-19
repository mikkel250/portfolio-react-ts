import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const tracingState = vi.hoisted(() => ({ enabled: false }));
const propagateAttributesMock = vi.hoisted(() =>
  vi.fn(async (_attrs: unknown, fn: () => unknown) => fn())
);
const chatMock = vi.hoisted(() =>
  vi.fn(async () => ({
    content: 'analysis',
    usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    model: 'gemini-2.5-pro',
    finishReason: 'stop',
  }))
);

vi.mock('../lib/langfuse', () => ({
  flushLangfuseTracing: vi.fn(async () => undefined),
  isLangfuseTracingEnabled: vi.fn(() => tracingState.enabled),
}));

vi.mock('../lib/langsmith', () => ({
  flushLangSmithTracing: vi.fn(async () => undefined),
}));

vi.mock('../lib/langfuse-prompts', () => ({
  compilePrompt: vi.fn(async () => 'jd prompt'),
}));

vi.mock('../lib/knowledge-base', () => ({
  getAllContext: vi.fn(() => ''),
  extractJobTitle: vi.fn(() => 'Engineer'),
}));

vi.mock('../lib/llm', () => ({
  chat: (...args: unknown[]) => chatMock(...args),
}));

vi.mock('@langfuse/tracing', () => ({
  propagateAttributes: (...args: unknown[]) => propagateAttributesMock(...args),
}));

import { POST } from './route';

function postJd(body: Record<string, unknown>) {
  return POST(
    new NextRequest('http://localhost/api/analyze-jd', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

describe('POST /api/analyze-jd tracing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tracingState.enabled = false;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('propagates sessionId before the generation when tracing is on', async () => {
    tracingState.enabled = true;

    const response = await postJd({
      sessionId: 'jd-session',
      jobDescription: 'Senior Engineer role',
    });

    expect(response.status).toBe(200);
    expect(propagateAttributesMock).toHaveBeenCalledWith(
      { sessionId: 'jd-session', traceName: 'jd_analysis' },
      expect.any(Function)
    );
    expect(propagateAttributesMock.mock.invocationCallOrder[0]).toBeLessThan(
      chatMock.mock.invocationCallOrder[0]
    );
  });

  it('does not propagate attributes when tracing is off', async () => {
    const response = await postJd({
      sessionId: 'jd-session-off',
      jobDescription: 'Senior Engineer role',
    });

    expect(response.status).toBe(200);
    expect(propagateAttributesMock).not.toHaveBeenCalled();
    expect(chatMock).toHaveBeenCalled();
  });
});
