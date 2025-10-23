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

    // filter input before hitting API to prevent garbage and spam
    const filterResult = filterInput(query);

    if (!filterResult.shouldCallAPI) {
      // return canned response instead of calling API
      console.log(`[Filter] Blocked query (${filterResult.reason}): ${query.substring(0, 50)}...`);

      return NextResponse.json({
        content: filterResult.response || 'Invalid input',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        model: 'filtered',
        remaining: null, // don't count filtered results against rate limit
      });
    }

    // retrieve relevant KB context
    const context = getRelevantContext(query);

    // extract job title if present -- leaving here if we want to implement later to better tailor LLM responses, but not used RN
    // const jobTitle = extractJobTitle(query);

    // build system prompt with context and optional job title
    const systemPrompt = buildChatSystemPrompt(context, {
      calendlyLink: process.env.NEXT_PUBLIC_CALENDLY_LINK,
    });

    //=======
    // Enhanced environment debugging
    console.log('🔧 Environment Debug:');
    console.log('🔧 process.env.AI_MODEL:', process.env.AI_MODEL);
    console.log('🔧 process.env.NODE_ENV:', process.env.NODE_ENV);
    console.log('🔧 process.env.RATE_LIMIT_MAX:', process.env.RATE_LIMIT_MAX);
    console.log('🔧 process.cwd():', process.cwd());

    // Check if the file exists
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env.local');
    console.log('🔧 .env.local path:', envPath);
    console.log('🔧 .env.local exists:', fs.existsSync(envPath));

    // Try to read the file directly
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      console.log('🔧 .env.local content preview:', envContent.substring(0, 200));
      console.log('🔧 Contains AI_MODEL:', envContent.includes('AI_MODEL'));
    } catch (error) {
      console.log('🔧 Error reading .env.local:', error.message);
    }
    //=========
    // call LLM with conversation history
    const llmResponse = await chat(messages, systemPrompt, {
      temperature: 0.7,
      maxTokens: 1000,
      model: process.env.AI_MODEL || 'gpt-4o-mini', // Easy model switching via env var
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