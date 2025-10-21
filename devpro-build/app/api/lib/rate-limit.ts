// tracks message count per session ID and enforces limits to control costs and/or prevent abuse

// in-memory session store
const sessionStore = new Map<string, SessionData>();

// Rate limiting configuration
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '25');
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '3600'); // 1 hour in seconds
const BURST_LIMIT = 3;           // Max messages...
const BURST_WINDOW = 1000;       // ...within 1 second (1000ms)

interface SessionData {
  count: number;
  firstMessage: number; // timestamp of first message in session
  lastMessage: number; // timestamp of last message in session
  recentMessages: number[];
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime?: number;
  message?: string;
}

function isBurstLimitExceeded(recentMessages: number[], now: number): boolean {
  // detect more than the allowed number of messages within a given time window (bot detection/blocking), e.g. 3 msgs in < 1sec
  const messagesInWindow = recentMessages.filter(timestamp => (now - timestamp) < BURST_WINDOW);

  // if too fast, likely a bot
  return messagesInWindow.length >= BURST_LIMIT;
}

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