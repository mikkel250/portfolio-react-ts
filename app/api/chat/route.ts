// ---------------------------------------------------------------------------
// Main Chat API Endpoint — POST /api/chat
// ---------------------------------------------------------------------------
// This is the primary orchestration endpoint. It coordinates the entire
// AI assistant pipeline:
//
// Request Flow (in order):
//   1. Request validation (messages array, sessionId)
//   2. Rate limiting check (per-IP + per-session, hourly + burst)
//   3. Server-side input filtering (defense-in-depth, catches what client missed)
//   4. Knowledge base retrieval (keyword-based RAG from markdown files)
//   5. System prompt assembly (LangFuse → hardcoded fallback)
//   6. LLM call with multi-provider fallback chain
//   7. Response formatting (content + usage + rate limit info)
//
// Key Design Decisions:
//   - Runtime: 'nodejs' (required for fs module in KB, gRPC in OpenTelemetry)
//   - All requests are rate-limited; filtered queries skip LLM cost only
//   - Failed LLM calls automatically fall back through provider chain
//   - Tracing: LangSmith stays fire-and-forget; Langfuse is awaited + flushed
//     so serverless exits do not drop spans (see LANGFUSE_TRACING=true)
// ---------------------------------------------------------------------------

/* eslint-disable import/first */
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, resolveClientIp } from '../lib/rate-limit';
import { getRelevantContext } from '../lib/knowledge-base';
import { buildChatSystemPrompt } from '../lib/prompts';
import { chat, ChatMessage } from '../lib/llm';
import { filterInput } from '@/lib/input-filter';
import { createStepClock } from '../lib/chat-timings';
import {
  flushLangfuseTracing,
  isLangfuseTracingEnabled,
} from '../lib/langfuse';
import { startActiveObservation } from '@langfuse/tracing';
/* eslint-disable import/first */

const MAX_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 32_768;

/** Shape of the JSON body expected from the client */
interface ChatRequest {
  messages: ChatMessage[];
  sessionId: string;
}

/**
 * POST /api/chat — Main chat endpoint.
 *
 * Receives the full conversation history and a session ID from the client,
 * then orchestrates the complete AI assistant pipeline.
 *
 * Error handling strategy:
 *   - 400: Invalid request (missing messages, bad role, etc.)
 *   - 429: Rate limited (hourly or burst)
 *   - 503: AI service error (provider issues)
 *   - 500: Unexpected internal errors
 */
export async function POST(request: NextRequest) {
  try {
    // STEP 1: Parse and validate the request body
    const body: ChatRequest = await request.json();
    const { messages, sessionId } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty.' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required.' },
        { status: 400 }
      );
    }

    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { error: `Messages array must not exceed ${MAX_MESSAGES} entries.` },
        { status: 400 }
      );
    }

    for (const message of messages) {
      if (
        typeof message?.content !== 'string' ||
        message.content.length > MAX_MESSAGE_CHARS
      ) {
        return NextResponse.json(
          { error: `Each message must be a string of at most ${MAX_MESSAGE_CHARS} characters.` },
          { status: 400 }
        );
      }
    }

    // Get the latest user message (the one they just sent)
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from a user' },
        { status: 400 }
      );
    }

    const query = latestMessage.content;
    const ipAddress = resolveClientIp(request.headers);

    // STEP 2: Rate limiting — per-IP + per-session before filter/LLM work
    const rateLimit = checkRateLimit(sessionId, ipAddress);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: rateLimit.message || 'Rate Limit exceeded',
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime
        },
        { status: 429 }
      );
    }

    // STEP 3: Server-side input filtering (defense-in-depth).
    const clock = createStepClock();
    try {
      const conversationHistory = messages.slice(0, -1).map(m => m.content);
      const filterResult = filterInput(query, conversationHistory);
      clock.lap('filter');

      if (!filterResult.shouldCallAPI) {
        console.log(`[Filter] Blocked query (${filterResult.reason}), length: ${query.length}, sessionId: ${sessionId}`);
        const timings_ms = clock.finish();
        console.log('[chat] timings_ms', timings_ms);

        return NextResponse.json({
          content: filterResult.response || 'Invalid input',
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
          model: 'filtered',
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
          ...(process.env.NODE_ENV === 'development' ? { timings_ms } : {}),
        });
      }

      // STEP 4–6: KB → prompt → LLM, with optional parent Langfuse observation.
      const runPipeline = async () => {
        const context = getRelevantContext(query);
        clock.lap('knowledgeBase');

        const systemPrompt = await buildChatSystemPrompt(context, {
          calendlyLink: process.env.NEXT_PUBLIC_CALENDLY_LINK,
        });
        clock.lap('prompt');

        const llmResponse = await chat(messages, systemPrompt, {
          ...(process.env.AI_MODEL ? { model: process.env.AI_MODEL } : {}),
          langfusePrompt: { name: 'portfolio-chat-system' },
        });
        if (typeof llmResponse.providerDurationMs === 'number') {
          clock.set('llm', llmResponse.providerDurationMs);
        } else {
          clock.lap('llm');
        }

        const timings_ms = clock.finish();
        console.log('[chat] timings_ms', timings_ms);

        return { llmResponse, timings_ms };
      };

      const { llmResponse, timings_ms } = isLangfuseTracingEnabled()
        ? await startActiveObservation(
            'chat_request',
            async (span) => {
              const result = await runPipeline();
              span.update({
                input: { sessionId, messagePreview: query.slice(0, 200) },
                output: {
                  model: result.llmResponse.model,
                  usage: result.llmResponse.usage,
                },
                metadata: { timings_ms: result.timings_ms, sessionId },
              });
              return result;
            }
          )
        : await runPipeline();

      // STEP 7: Return successful response.
      return NextResponse.json({
        content: llmResponse.content,
        usage: llmResponse.usage,
        model: llmResponse.model,
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
        traceUrl: `https://smith.langchain.com/projects/${process.env.LANGSMITH_PROJECT_NAME}`,
        ...(process.env.NODE_ENV === 'development' ? { timings_ms } : {}),
      });
    } catch (pipelineError: unknown) {
      const timings_ms = clock.finish();
      console.log('[chat] timings_ms (error)', timings_ms);
      throw Object.assign(
        pipelineError instanceof Error
          ? pipelineError
          : new Error(String(pipelineError)),
        { timings_ms }
      );
    } finally {
      if (isLangfuseTracingEnabled()) {
        try {
          await flushLangfuseTracing();
        } catch (flushError) {
          console.error('Langfuse flush failed:', flushError);
        }
      }
    }

  } catch (error: any) {
    console.error('Chat API Error:', error);
    const timings_ms = error?.timings_ms as Record<string, number> | undefined;
    const devTimings =
      process.env.NODE_ENV === 'development' && timings_ms
        ? { timings_ms }
        : {};

    // Specific error types → meaningful HTTP status codes
    if (
      error.message?.includes('OpenAI') ||
      error.message?.includes('All LLM providers failed')
    ) {
      return NextResponse.json(
        { error: 'AI service error. Please try again.', ...devTimings },
        { status: 503 }
      );
    }

    if (error.message?.includes('Rate limit')) {
      return NextResponse.json(
        { error: error.message, ...devTimings },
        { status: 429 }
      );
    }

    // Generic catch-all for unexpected errors
    return NextResponse.json(
      { error: 'Internal server error, please try again later.', ...devTimings },
      { status: 500 }
    );
  }
}

// Only POST is supported — reject all other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed, use POST.' },
    { status: 405 }
  );
}