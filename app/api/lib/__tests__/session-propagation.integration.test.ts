import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { context, trace } from '@opentelemetry/api';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { setLangfuseTracerProvider } from '@langfuse/tracing';
import { NextRequest } from 'next/server';
import { setLangfuseSpanProcessor } from '../langfuse-span-processor-ref';
import { initLangFuse } from '../langfuse';

vi.mock('../rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({
    allowed: true,
    remaining: 9,
    resetTime: Date.now() + 3_600_000,
  })),
  resolveClientIp: vi.fn(() => '203.0.113.50'),
}));

vi.mock('../knowledge-base', () => ({
  getRelevantContext: vi.fn(() => ''),
}));

vi.mock('../langfuse-prompts', () => ({
  compilePrompt: vi.fn(async () => 'test system prompt'),
}));

vi.mock('@google/genai', () => {
  class GoogleGenAI {
    models = {
      generateContent: async () => ({
        text: 'mocked generation',
        usage: { promptTokens: 11, completionTokens: 7, totalTokens: 18 },
        finishReason: 'STOP',
      }),
    };
  }
  return { GoogleGenAI };
});

import { POST as postChat } from '../../chat/route';

const SESSION_ID_ATTR = 'session.id';
const TRACE_NAME_ATTR = 'langfuse.trace.name';
const OBSERVATION_TYPE_ATTR = 'langfuse.observation.type';
const OBSERVATION_INPUT_ATTR = 'langfuse.observation.input';
const OBSERVATION_OUTPUT_ATTR = 'langfuse.observation.output';

function parsedAttr(span: { attributes: Record<string, unknown> }, key: string) {
  const raw = span.attributes[key];
  if (typeof raw !== 'string') return raw;
  return JSON.parse(raw);
}

const exporter = new InMemorySpanExporter();
let provider: NodeTracerProvider | undefined;

function post(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('sessionId on exported Langfuse spans', () => {
  beforeAll(() => {
    vi.stubEnv('LANGFUSE_TRACING', 'true');
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', 'pk-test');
    vi.stubEnv('LANGFUSE_SECRET_KEY', 'sk-test');
    vi.stubEnv('LANGFUSE_BASE_URL', 'http://127.0.0.1:9');
    vi.stubEnv('LANGFUSE_MEDIA_UPLOAD_ENABLED', 'false');
    vi.stubEnv('LANGSMITH_TRACING', 'false');
    vi.stubEnv('LANGSMITH_API_KEY', '');
    vi.stubEnv('AI_MODEL', 'gemini-2.5-flash');
    vi.stubEnv('AI_MODEL_FALLBACKS', '[]');
    vi.stubEnv('GOOGLE_API_KEY', 'gk-test');
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('DEEPSEEK_API_KEY', '');

    const processor = new LangfuseSpanProcessor({
      exporter,
      exportMode: 'immediate',
      publicKey: 'pk-test',
      secretKey: 'sk-test',
      baseUrl: 'http://127.0.0.1:9',
      shouldExportSpan: () => true,
      mediaUploadEnabled: false,
    });
    provider = new NodeTracerProvider({ spanProcessors: [processor] });
    provider.register();
    setLangfuseTracerProvider(provider);
    setLangfuseSpanProcessor(processor);
  });

  beforeEach(() => {
    exporter.reset();
  });

  afterAll(async () => {
    setLangfuseTracerProvider(null);
    setLangfuseSpanProcessor(null);
    const client = initLangFuse();
    if (client && typeof client.shutdown === 'function') {
      await client.shutdown();
    }
    await provider?.shutdown();
    trace.disable();
    context.disable();
    vi.unstubAllEnvs();
  });

  it('stamps session.id on the chat root span and the nested generation', async () => {
    const sessionId = 'session-span-chat';
    const response = await postChat(
      post('http://localhost/api/chat', {
        sessionId,
        messages: [
          {
            role: 'user',
            content: 'Tell me about Mikkel React experience in production systems.',
          },
        ],
      })
    );

    expect(response.status, await response.clone().text()).toBe(200);

    const spans = exporter.getFinishedSpans();
    const root = spans.find((span) => span.name === 'chat_request');
    const generation = spans.find(
      (span) =>
        span.attributes[OBSERVATION_TYPE_ATTR] === 'generation' &&
        span.name.startsWith('llm_call_')
    );

    expect(root).toBeDefined();
    expect(generation).toBeDefined();
    expect(root?.attributes[SESSION_ID_ATTR]).toBe(sessionId);
    expect(generation?.attributes[SESSION_ID_ATTR]).toBe(sessionId);
    expect(root?.attributes[TRACE_NAME_ATTR]).toBe('chat_request');
    expect(generation?.attributes[TRACE_NAME_ATTR]).toBe('chat_request');
    expect(generation?.parentSpanContext?.spanId).toBe(root?.spanContext().spanId);
    expect(parsedAttr(root!, OBSERVATION_INPUT_ATTR)).toEqual([
      {
        role: 'user',
        content: 'Tell me about Mikkel React experience in production systems.',
      },
    ]);
    expect(parsedAttr(root!, OBSERVATION_OUTPUT_ATTR)).toEqual([
      { role: 'assistant', content: 'mocked generation' },
    ]);
    const generationInput = parsedAttr(generation!, OBSERVATION_INPUT_ATTR);
    expect(Array.isArray(generationInput)).toBe(true);
    expect(generationInput.at(-1)).toEqual({
      role: 'user',
      content: 'Tell me about Mikkel React experience in production systems.',
    });
    expect(parsedAttr(generation!, OBSERVATION_OUTPUT_ATTR)).toEqual([
      { role: 'assistant', content: 'mocked generation' },
    ]);
  });
});
