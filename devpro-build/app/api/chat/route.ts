export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '../lib/rate-limit';
import { getRelevantContext, extractJobTitle } from '../lib/knowledge-base';
import { buildSystemPrompt } from '../lib/prompts';
import { chat, ChatMessage } from '../lib/llm';

console.log('Chat route Loaded!');
/*
Main Chat API Endpoint

Orchestrates the full AI assistant flow:
1. Rate limiting
2. Knowledge retrieval
3. Prompt building
4. LLM call
5. Response formatting
*/

interface ChatRequest {
  messages: ChatMessage[];
  sessionId: string;
}

export async function POST(request: NextRequest) {
  try {
    // parse request body
    const body: ChatRequest = await request.json();
    const { messages, sessionId } = body

    // validate request
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

    // get IP address for rate limiting
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // check rate limit
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

    // get the latest user message
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from a user' },
        { status: 400 }
      );
    }

    const query = latestMessage.content;

    // retrieve relevant KB context
    const context = getRelevantContext(query);

    // extract job title if present
    const jobTitle = extractJobTitle(query);

    // build system prompt with context and optional job title
    const systemPrompt = buildSystemPrompt(query, context, {
      jobTitle: jobTitle || undefined,
      calendlyLink: process.env.NEXT_PUBLIC_CALENDLY_LINK,
      recruiterName: undefined // placeholder in case we want to add later
    });

    // call LLM with conversation history
    const llmResponse = await chat(messages, systemPrompt, {
      temperature: 0.7,
      maxTokens: 1000,
      model: 'gpt-4o-mini'
    });

    // return successful response
    return NextResponse.json({
      content: llmResponse.content,
      usage: llmResponse.usage,
      model: llmResponse.model,
      remaining: rateLimit.remaining,
      resetTime: rateLimit.resetTime
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);

    // handle specific error types
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

    // generic error
    return NextResponse.json(
      { error: 'Internal server error, please try again later.' },
      { status: 500 }
    );
  }
}

// handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed, use POST.' },
    { status: 405 }
  );
}