export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '../lib/rate-limit';
import { getAllContext, extractJobTitle } from '../lib/knowledge-base';
import { compilePrompt } from '../lib/langfuse-prompts';
import { chat } from '../lib/llm';

// JD analysis endpoint - special endpoint for analyzing JDs and returning a match
interface JDAnalysisRequest {
  jobDescription: string;
  sessionId: string;
}

export async function POST(request: NextRequest) {
  try {
    // parse request body
    const body: JDAnalysisRequest = await request.json();
    const { jobDescription, sessionId } = body;

    // validate request
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
      return NextResponse.json(
        { error: 'JD is required and must be a non-empty string.' },
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

    // extract job title if present
    const jobTitle = extractJobTitle(jobDescription);

    // load ALL KB context for comprehensive matching
    const fullContext = getAllContext();

    // build a specialized system prompt with full context
    const basePrompt = await compilePrompt('portfolio-jd-analysis', {
      context: fullContext,
      job_title: jobTitle || 'Unknown',
    });

    const finalSystemPrompt = basePrompt;

    // create message with JD
    const messages = [
      {
        role: 'user' as const,
        content: `Please analyze this job description and provide a comprehensive match analysis:\n\n${jobDescription}`
      }
    ];

    // call the LLM with specialized JD analysis prompt
    // Temperature and maxTokens come from environment variables (AI_TEMPERATURE, AI_MAX_TOKENS)
    const llmResponse = await chat(messages, finalSystemPrompt, {
      model: process.env.AI_MODEL || 'gemini-2.5-pro',
      langfusePrompt: { name: 'portfolio-jd-analysis' },
    });

    // return successful response
    return NextResponse.json({
      analysis: llmResponse.content,
      jobTitle: jobTitle || null,
      usage: llmResponse.usage,
      model: llmResponse.model,
      remaining: rateLimit.remaining,
      resetTime: rateLimit.resetTime
    });

  } catch (error: any) {
    console.error('JD Analysis API error:', error);

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

    // Generic error
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
