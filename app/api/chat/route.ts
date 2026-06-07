// ---------------------------------------------------------------------------
// Main Chat API Endpoint — POST /api/chat
// ---------------------------------------------------------------------------
// This is the primary orchestration endpoint. It coordinates the entire
// AI assistant pipeline:
//
// Request Flow (in order):
//   1. Request validation (messages array, sessionId)
//   2. Rate limiting check (per-session, per-hour + burst detection)
//   3. Server-side input filtering (defense-in-depth, catches what client missed)
//   4. Knowledge base retrieval (keyword-based RAG from markdown files)
//   5. System prompt assembly (LangFuse → hardcoded fallback)
//   6. LLM call with multi-provider fallback chain
//   7. Response formatting (content + usage + rate limit info)
//
// Key Design Decisions:
//   - Runtime: 'nodejs' (required for fs module in KB, gRPC in OpenTelemetry)
//   - Filtered queries don't count against rate limits (saves costs)
//   - Failed LLM calls automatically fall back through provider chain
//   - Tracing (LangSmith + LangFuse) is fire-and-forget
// ---------------------------------------------------------------------------

import { FilterResult } from './../../../lib/input-filter';
/* eslint-disable import/first */
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '../lib/rate-limit';
import { getRelevantContext, extractJobTitle } from '../lib/knowledge-base';
import { buildChatSystemPrompt } from '../lib/prompts';
import { chat, ChatMessage } from '../lib/llm';
import { filterInput } from '@/lib/input-filter';
/* eslint-disable import/first */

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

    // Get client IP for rate limiting (from Vercel edge headers)
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // STEP 2: Rate limiting — check hourly quota + burst detection
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

    // Get the latest user message (the one they just sent)
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from a user' },
        { status: 400 }
      );
    }

    const query = latestMessage.content;

    // STEP 3: Server-side input filtering (defense-in-depth).
    // The client also filters, but server-side catches edge cases and
    // prevents direct API abuse. Filtered queries get canned responses
    // without hitting the LLM, saving costs.
    const conversationHistory = messages.map(m => m.content);
    const filterResult = filterInput(query, conversationHistory);

    if (!filterResult.shouldCallAPI) {
      console.log(`[Filter] Blocked query (${filterResult.reason}): ${query.substring(0, 50)}...`);

      // Return canned response — no LLM tokens used, no rate limit counted
      return NextResponse.json({
        content: filterResult.response || 'Invalid input',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        model: 'filtered',
        remaining: null, // Filtered queries don't count against rate limit
      });
    }

    // STEP 4: Knowledge base retrieval (keyword-based RAG).
    // Loads relevant markdown files based on query topic classification.
    const context = getRelevantContext(query);

    // extract job title if present -- leaving here if we want to implement
    // later to better tailor LLM responses, but not used RN
    // const jobTitle = extractJobTitle(query);

    // STEP 5: Build the system prompt with injected KB context.
    // Tries LangFuse (runtime-updatable) first, falls back to hardcoded prompt.
    const systemPrompt = await buildChatSystemPrompt(context, {
      calendlyLink: process.env.NEXT_PUBLIC_CALENDLY_LINK,
    });

    // STEP 6: Call the LLM with multi-provider fallback chain.
    // The chat() function in lib/llm.ts handles provider selection,
    // fallback logic, and dual tracing (LangSmith + LangFuse).
    // Model from AI_MODEL env var, temperature/tokens from AI_TEMPERATURE/AI_MAX_TOKENS.
    const llmResponse = await chat(messages, systemPrompt, {
      ...(process.env.AI_MODEL ? { model: process.env.AI_MODEL } : {}),
      langfusePrompt: { name: 'portfolio-chat-system' },
    });

    // STEP 7: Return successful response.
    // Includes: LLM response, token usage, model used (helps verify which
    // model handled the request — useful for debugging fallback behavior),
    // rate limit info, and a link to LangSmith traces.
    return NextResponse.json({
      content: llmResponse.content,
      usage: llmResponse.usage,
      model: llmResponse.model,
      remaining: rateLimit.remaining,
      resetTime: rateLimit.resetTime,
      traceUrl: `https://smith.langchain.com/projects/${process.env.LANGSMITH_PROJECT_NAME}`
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);

    // Specific error types → meaningful HTTP status codes
    if (error.message?.includes('OpenAI')) {
      return NextResponse.json(
        { error: 'AI service error. Please try again.' },
        { status: 503 }
      );
    }

    if (error.message?.includes('Rate limit')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    // Generic catch-all for unexpected errors
    return NextResponse.json(
      { error: 'Internal server error, please try again later.' },
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