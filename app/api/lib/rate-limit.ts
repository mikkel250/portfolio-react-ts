// ---------------------------------------------------------------------------
// Rate Limiter — In-Memory Per-Session Message Tracking
// ---------------------------------------------------------------------------
// Tracks message count per session ID and enforces limits to control
// LLM API costs and prevent abuse.
//
// Architecture: In-memory Map (no external DB/Redis)
//   - Deliberate MVP trade-off: cold starts reset limits on new deployment
//   - Acceptable for validation phase with generous limits (15 msgs/hr)
//   - Can upgrade to Vercel KV or Redis when persistent limits are needed
//
// Two tiers of protection:
//   1. HOUR LIMIT: Max messages per session per rolling hour window
//   2. BURST DETECTION: Max messages in rapid succession (bot detection)
//
// Env vars:
//   RATE_LIMIT_MAX=15 (default: 15 messages per hour)
//   RATE_LIMIT_WINDOW=3600 (default: 3600 seconds = 1 hour)
// ---------------------------------------------------------------------------

// In-memory session store (serverless: resets on cold starts)
const sessionStore = new Map<string, SessionData>();

// Rate limiting configuration
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '15');
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '3600'); // 1 hour in seconds
const BURST_LIMIT = 3;           // Max messages...
const BURST_WINDOW = 1000;       // ...within 1 second (1000ms)

/** Single session's rate limit data */
interface SessionData {
  count: number;              // Total messages in current window
  firstMessage: number;       // Timestamp of first message (window start)
  lastMessage: number;        // Timestamp of most recent message
  recentMessages: number[];   // Last 10 message timestamps (for burst detection)
}

/** Returned by checkRateLimit — whether the message is allowed */
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime?: number;         // Unix timestamp when window resets
  message?: string;           // Human-readable reason when blocked
}

/**
 * isBurstLimitExceeded: Bot detection — checks if messages are arriving
 * too fast (more than BURST_LIMIT within BURST_WINDOW ms).
 *
 * Example: If BURST_LIMIT=3 and BURST_WINDOW=1000ms, more than 3
 * messages in 1 second triggers a block. This catches scripted/bot
 * behavior while allowing normal human typing speed.
 */
function isBurstLimitExceeded(recentMessages: number[], now: number): boolean {
  // Count messages that arrived within the burst window
  const messagesInWindow = recentMessages.filter(timestamp => (now - timestamp) < BURST_WINDOW);

  // If too many messages too fast, likely a bot
  return messagesInWindow.length >= BURST_LIMIT;
}

/**
 * checkRateLimit: Main entry point — called on every chat API request.
 *
 * Flow:
 *   1. New session? → Create session, allow (1 message used)
 *   2. Window expired? → Reset session, allow (1 message used)
 *   3. Burst detected? → Block (bot protection)
 *   4. Limit exceeded? → Block with Calendly redirect message
 *   5. Otherwise → Allow, increment count, return remaining
 *
 * Design notes:
 *   - Tracks timestamps of last 10 messages for burst detection
 *   - Older timestamps are discarded to prevent memory bloat
 *   - Block messages include Calendly link so blocked users can still reach out
 */
export function checkRateLimit(sessionId: string, ipAddress: string): RateLimitResult {
  const now = Date.now();
  const session = sessionStore.get(sessionId);

  // if no session exists, create a new one
  if (!session) {
    const newSession: SessionData = {
      count: 1,
      firstMessage: now,
      lastMessage: now,
      recentMessages: [now]
    };

    sessionStore.set(sessionId, newSession);

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetTime: now + (RATE_LIMIT_WINDOW * 1000)
    };
  }

  // check if window has expired
  const windowExpired = (now - session.firstMessage) > (RATE_LIMIT_WINDOW * 1000);  // more than 1hr in milliseconds

  if (windowExpired) {
    // reset the session
    const resetSession: SessionData = {
      count: 1,
      firstMessage: now,
      lastMessage: now,
      recentMessages: [now]
    };

    sessionStore.set(sessionId, resetSession);

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetTime: now + (RATE_LIMIT_WINDOW * 1000)
    }
  }

  if (isBurstLimitExceeded(session.recentMessages || [], now)) {
    return {
      allowed: false,
      remaining: 0,
      message: 'This session has been flagged by bot detection! Too many messages sent too quickly, slow down and try again.'
    }
  }

  // increment message count
  session.count++;
  session.lastMessage = now;

  // track this message timestamp for burst detection
  session.recentMessages = session.recentMessages || [];
  session.recentMessages.push(now);

  // keep only 10 timestamps to prevent memory bloat
  if (session.recentMessages.length > 10) {
    session.recentMessages = session.recentMessages.slice(-10);
  }

  sessionStore.set(sessionId, session);

  // check if limit exceeded
  if (session.count > RATE_LIMIT_MAX) {
    const resetTime = session.firstMessage + (RATE_LIMIT_WINDOW * 1000);

    return {
      allowed: false,
      remaining: 0,
      resetTime,
      message: `Message limit reached (${RATE_LIMIT_MAX} messages per hour). Please try again in ${Math.ceil((resetTime - now) / 60000)} minutes, or you can speak with ${process.env.CANDIDATE_FIRSTNAME} directly by booking an appointment: ${process.env.NEXT_PUBLIC_CALENDLY_LINK || process.env.ADMIN_EMAIL}.`
    }
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - session.count,
    resetTime: session.firstMessage + (RATE_LIMIT_WINDOW * 1000)
  };
}

export function getRateLimitStatus(sessionId: string): RateLimitResult {
  const now = Date.now();
  const session = sessionStore.get(sessionId);

  if (!session) {
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX,
      resetTime: now + (RATE_LIMIT_WINDOW * 1000)
    };
  }

  // check if window has expired
  const windowExpired = (now - session.firstMessage) > (RATE_LIMIT_WINDOW * 1000);

  if (windowExpired) {
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX,
      resetTime: now + (RATE_LIMIT_WINDOW * 1000)
    };
  }

  const remaining = Math.max(0, RATE_LIMIT_MAX - session.count);
  const resetTime = session.firstMessage + (RATE_LIMIT_WINDOW * 1000);

  return {
    allowed: session.count < RATE_LIMIT_MAX,
    remaining,
    resetTime
  };
}

// reset limit for specific session (admin function)
export function resetRateLimit(sessionId: string): void {
  sessionStore.delete(sessionId);
}

// get rate limit configuration
export function getRateLimitConfig() {
  return {
    maxMessages: RATE_LIMIT_MAX,
    windowSeconds: RATE_LIMIT_WINDOW,
    windowMinutes: Math.ceil(RATE_LIMIT_WINDOW / 60)
  };
}

export function cleanupExpiredSessions(): number {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW * 1000;
  let cleanedCount = 0;

  for (const [sessionId, session] of sessionStore.entries()) {
    if ((now - session.lastMessage) > windowMs) {
      sessionStore.delete(sessionId);
      cleanedCount++;
    }
  }

  return cleanedCount;
}

// get session statistics (for monitoring/debugging)
export function getSessionStats() {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW * 1000;

  let activeSessions = 0;
  let expiredSessions = 0;
  let totalMessages = 0;

  for (const session of sessionStore.values()) {
    totalMessages += session.count;

    if ((now - session.lastMessage) <= windowMs) {
      activeSessions++;
    } else {
      expiredSessions++;
    }
  }

  return {
    totalSessions: sessionStore.size,
    activeSessions,
    expiredSessions,
    totalMessages,
    rateLimitConfig: getRateLimitConfig()
  };
}