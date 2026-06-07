// ---------------------------------------------------------------------------
// JD Analysis API Endpoint — POST /api/analyze-jd
// ---------------------------------------------------------------------------
// Specialized endpoint for analyzing a job description and returning a
// comprehensive candidate match analysis. Unlike the general chat endpoint,
// this always loads ALL knowledge base context (not selective) and uses
// a specialized JD analysis system prompt designed for structured matching.
//
// The JD analysis prompt (jd-prompt.ts) defines a strict output contract:
//   - Extract hiring context & role type
//   - Normalize 6-12 requirements into testable statements
//   - Map candidate experience to each requirement with scores (0-1)
//   - Compute weighted overall match (Must-Have=2x, Nice-to-Have=1x)
//   - Provide growth opportunities, recommendation, and next steps
//
// Flow (same overall structure as /api/chat but specialized):
//   1. Validate JD text and session ID
//   2. Rate limiting check
//   3. Extract job title from JD (regex matching)
//   4. Load ALL KB context (comprehensive matching needs everything)
//   5. Build specialized JD analysis prompt with context + job title
//   6. LLM call (same multi-provider fallback as chat)
//   7. Return analysis, job title, usage, and rate limit info
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '../lib/rate-limit';
import { getAllContext, extractJobTitle } from '../lib/knowledge-base';
import { compilePrompt } from '../lib/langfuse-prompts';
import { chat } from '../lib/llm';

/** Shape of the JSON body expected from the client for JD analysis */
interface JDAnalysisRequest {
  jobDescription: string;
  sessionId: string;
}

/**
 * POST /api/analyze-jd — Job description analysis endpoint.
 *
 * Receives a raw job description text and a session ID, then produces
 * a comprehensive, structured match analysis between the candidate's
 * background and the JD requirements.
 *
 * Key differences from /api/chat:
 *   - Loads ALL KB context (not selective — needs everything for matching)
 *   - Uses specialized JD_ANALYSIS_SYSTEM_PROMPT (scoring, output contract)
 *   - Returns { analysis, jobTitle, usage, model, remaining } shape
 *   - Responds to GET with method-not-allowed (same as chat)
 */
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
    // Normalize x-forwarded-for by taking the first entry (original client IP)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : request.headers.get('x-real-ip') || 'unknown';

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

    // STEP 4: Load ALL knowledge base context.
    // Unlike the chat endpoint which loads selectively, JD analysis needs
    // the full candidate background for comprehensive requirement matching.
    const fullContext = getAllContext();

    // STEP 5: Build the specialized JD analysis system prompt.
    // Uses LangFuse prompt management with hardcoded fallback.
    // Injects {CONTEXT} (all KB files) and {JOB_TITLE} (extracted title).
    const systemPrompt = await compilePrompt('portfolio-jd-analysis', {
      context: fullContext,
      job_title: jobTitle || 'Unknown',
    });

    // STEP 6: Format the user message — wrap the JD text in an instruction
    const messages = [
      {
        role: 'user' as const,
        content: `Please analyze this job description and provide a comprehensive match analysis:\n\n${jobDescription}`
      }
    ];

    // STEP 7: Call the LLM (same multi-provider fallback as chat).
    // Default model for JD analysis is gemini-2.5-pro unless overridden.
    // Traces to LangFuse under the 'portfolio-jd-analysis' prompt name
    // for prompt-version-level analytics.
    const llmResponse = await chat(messages, systemPrompt, {
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
