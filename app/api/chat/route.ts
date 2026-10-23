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
//   - Tracing: chat schedules Langfuse and LangSmith flushes with
//     next/server `after()` so they run after the response is sent.
//     Each flush is capped at about 2s and must not fail the response.
//     Langfuse runs only when LANGFUSE_TRACING=true. LangSmith runs
//     only when LANGSMITH_TRACING=true. With both flags off, no flush
//     is scheduled.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, resolveClientIp } from '../lib/rate-limit';
import { getRelevantContext } from '../lib/knowledge-base';
import { buildChatSystemPrompt } from '../lib/prompts';
import { normalizeConversationTurns } from '../lib/conversation-turns';
import { chat, ChatMessage } from '../lib/llm';
import { filterInput } from '@/lib/input-filter';
import {
  blockingTailMs,
  createStepClock,
  pipelineGapMs,
  type ChatTimingsMs,
} from '../lib/chat-timings';
import { ensureLangfuseTracing, isLangfuseTracingEnabled } from '../lib/langfuse';
import { scheduleTracingFlush } from '../lib/schedule-tracing-flush';
import { propagateAttributes, startActiveObservation } from '@langfuse/tracing';

const MAX_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 32_768;
const ALLOWED_MESSAGE_ROLES = new Set(['user', 'assistant']);

/**
 * Pipeline clock vs handler wall clock.
 * blocking_tail_ms is time after the pipeline clock stopped (span update).
 * pipeline_gap_ms is time inside the clock that no step recorded (Langfuse
 * generation await inside chat()). The flush is in `[tracing] flush_ms`,
 * not in either number. Compare a request with the flags on and off.
 */
function reportHandlerLatency(
  clock: ReturnType<typeof createStepClock>,
  timings_ms: ChatTimingsMs
): ChatTimingsMs {
  const handler_ms = clock.elapsed();
  const blocking_tail_ms = blockingTailMs(timings_ms.total, handler_ms);
  const pipeline_gap_ms = pipelineGapMs(timings_ms);
  const reported: ChatTimingsMs = {
    ...timings_ms,
    pipeline_gap_ms,
    handler_ms,
    blocking_tail_ms,
  };
  console.log('[chat] latency', {
    ...reported,
    langfuse: isLangfuseTracingEnabled(),
    langsmith: process.env.LANGSMITH_TRACING === 'true',
  });
  return reported;
}

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
      if (!ALLOWED_MESSAGE_ROLES.has(message.role)) {
        return NextResponse.json(
          { error: `Invalid message role: ${message.role}` },
          { status: 400 }
        );
      }

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

    // Gemini and Claude reject a leading assistant turn (the UI welcome
    // message) and consecutive same-role turns. Merge those into an
    // alternating user/assistant transcript before the provider call.
    const conversation = normalizeConversationTurns(messages);
    if (conversation.length === 0 || conversation[conversation.length - 1].role !== 'user') {
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
        const pipelineTimings = clock.finish();
        const content = filterResult.response || 'Invalid input';

        // Filtered replies are still turns in the browser session. Record them
        // on the same Langfuse session as LLM turns so the replay is complete.
        // Stop the pipeline clock first, then report latency after the span,
        // matching the success path so blocking_tail_ms includes this wait.
        if (isLangfuseTracingEnabled()) {
          try {
            if (await ensureLangfuseTracing()) {
              await propagateAttributes(
                { sessionId, traceName: 'chat_filtered' },
                () =>
                  startActiveObservation('chat_filtered', async (span) => {
                    span.update({
                      input: [{ role: 'user', content: query }],
                      output: [{ role: 'assistant', content }],
                      metadata: {
                        sessionId,
                        ...(filterResult.reason
                          ? { filterReason: filterResult.reason }
                          : {}),
                      },
                    });
                  })
              );
            }
          } catch (error) {
            console.error(
              'Langfuse filtered-turn trace failed:',
              error instanceof Error ? error.message : 'non-Error thrown'
            );
          }
        }

        const timings_ms = reportHandlerLatency(clock, pipelineTimings);

        return NextResponse.json({
          content,
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

        const llmResponse = await chat(conversation, systemPrompt, {
          ...(process.env.AI_MODEL ? { model: process.env.AI_MODEL } : {}),
          langfusePrompt: { name: 'portfolio-chat-system' },
        });
        if (typeof llmResponse.providerDurationMs === 'number') {
          clock.set('llm', llmResponse.providerDurationMs);
        } else {
          clock.lap('llm');
        }

        return { llmResponse, timings_ms: clock.finish() };
      };

      let tracingReady = false;
      if (isLangfuseTracingEnabled()) {
        try {
          tracingReady = await ensureLangfuseTracing();
        } catch (error) {
          console.error(
            'Langfuse tracing init failed; continuing without tracing:',
            error instanceof Error ? error.message : 'non-Error thrown'
          );
        }
      }

      // Open the propagation scope before the root span so the root and the
      // nested generation both carry sessionId for session grouping and cost.
      const pipeline = tracingReady
        ? await propagateAttributes(
            { sessionId, traceName: 'chat_request' },
            () =>
              startActiveObservation(
                'chat_request',
                async (span) => {
                  const result = await runPipeline();
                  span.update({
                    input: [{ role: 'user', content: query }],
                    output: [
                      { role: 'assistant', content: result.llmResponse.content },
                    ],
                    metadata: { timings_ms: result.timings_ms, sessionId },
                  });
                  return result;
                }
              )
          )
        : await runPipeline();
      const { llmResponse, timings_ms: pipelineTimings } = pipeline;
      const timings_ms = reportHandlerLatency(clock, pipelineTimings);

      // STEP 7: Return successful response.
      return NextResponse.json({
        content: llmResponse.content,
        usage: llmResponse.usage,
        model: llmResponse.model,
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
        ...(process.env.NODE_ENV === 'development' ? { timings_ms } : {}),
      });
    } catch (pipelineError: unknown) {
      const timings_ms = reportHandlerLatency(clock, clock.finish());
      throw Object.assign(
        pipelineError instanceof Error
          ? pipelineError
          : new Error(String(pipelineError)),
        { timings_ms }
      );
    } finally {
      scheduleTracingFlush();
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