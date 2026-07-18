// ---------------------------------------------------------------------------
// Input Filter — Client-Side & Server-Side Query Validation
// ---------------------------------------------------------------------------
// Filters user input BEFORE it hits the LLM API to save costs and
// prevent abuse. Filtered queries get instant canned responses instead
// of expensive LLM calls, and don't count against rate limits.
//
// Router (in order):
//   1. Spam mash — repeated chars / keyboard
//   2. Role-share / long pastes → LLM
//   3. FAQ-shaped asks → allowlisted canned replies
//   4. Generic greetings
//   5. Meaningful short follow-up after '?' → LLM
//   6. Too-short fallback / otherwise → LLM
//
// Design notes:
//   - Role-share / JD pastes never get FAQ canned replies (even if keywords
//     like "salary range" or "full-time" appear in employer copy)
//   - FAQ short-circuits only fire for clear ask-shaped messages (not blurbs)
//   - Moved here from knowledge-base.ts to avoid 'fs' import issues on client
// ---------------------------------------------------------------------------

export interface FilterResult {
  shouldCallAPI: boolean;
  response?: string;
  reason?: string;
}

export interface JobFilterResult {
  shouldProceed: boolean;
  response?: string;
  reason?: string;
}

/** Messages longer than this are treated as role-share / paste (LLM path). */
const ROLE_SHARE_LENGTH = 200;

function isJobDescriptionQuery(query: string): boolean {
  const obviousJD = [
    /responsibilities:/i,
    /requirements:/i,
    /qualifications:/i,
    /required skills/i,
    /must have:/i,
    /preferred skills/i,
    /years of experience/i,
    /bonus points/i,
    /preferred qualifications/i,
    /nice to have/i,
    /minimum qualifications:/i,
    /you'll be working on/i,
    /about the role/i,
    /experience with the following technologies/i,
    /\bJD\b/i,
    /job description/i,
    /\bopportunity\b/i,
  ];

  const matchCount = obviousJD.filter((pattern) => pattern.test(query)).length;

  return query.length > 150 && matchCount >= 2;
}

/**
 * Hard veto for FAQ short-circuits: long pastes and role-share / JD-shaped text.
 * Product rule: role-share wins even when a terms question is embedded.
 */
function isRoleShareOrLongPaste(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length > ROLE_SHARE_LENGTH) return true;
  if (isJobDescriptionQuery(query)) return true;
  if (/this is for a role/i.test(trimmed) && trimmed.length > 100) return true;
  const newlines = (trimmed.match(/\n/g) || []).length;
  if (trimmed.length > 120 && newlines >= 3) return true;
  return false;
}

/** True when the message looks like a question / ask, not employer copy. */
function looksLikeFaqAsk(query: string): boolean {
  const trimmed = query.trim();
  // Leading interrogative — not any embedded "?" (employer "Any questions?")
  if (
    /^(what|where|when|who|how|does|do|is|are|can|could|would|will|should)\b/i.test(
      trimmed,
    )
  ) {
    return true;
  }
  // Directed FAQ phrases that sometimes omit a leading interrogative
  if (/\b(salary|compensation|pay)\s+expectation\b/i.test(trimmed)) return true;
  if (
    /\b(visa|work)\s+sponsorship\b/i.test(trimmed) &&
    /\b(he|his|her|mikkel|need|require|does)\b/i.test(trimmed)
  ) {
    return true;
  }
  // Bare short arrangement asks (e.g. "C2C?")
  if (/^(w2|w-2|c2c|1099)\s*\??$/i.test(trimmed)) return true;
  return false;
}

/**
 * FAQ canned replies only for non-role-share messages that look like asks.
 * Short employer blurbs (auth/location/C2C copy) must not reach FAQ matchers.
 */
function isShortCircuitEligible(query: string): boolean {
  return !isRoleShareOrLongPaste(query) && looksLikeFaqAsk(query);
}

function checkWorkAuthorizationQuery(query: string): JobFilterResult {
  const authPatterns = [
    /work authorization/i,
    /authorized.*work/i,
    /eligible to work/i,
    /us citizen/i,
    /visa sponsorship/i,
    /sponsor.*visa/i,
    /need.*sponsorship/i,
    /require.*sponsorship/i,
    /require.*visa/i,
    /does he (need|require).*visa/i,
    /does he (need|require).*sponsor/i,
  ];

  const hasAuthPattern = authPatterns.some((pattern) => pattern.test(query));

  if (hasAuthPattern) {
    return {
      shouldProceed: false,
      response:
        'Mikkel is authorized to work in the United States and does not require visa sponsorship.',
      reason: 'work_authorization',
    };
  }

  return { shouldProceed: true };
}

function checkSalaryQuery(query: string): JobFilterResult {
  // Ask-shaped only — avoid employer copy like "salary range for this role is $X"
  const salaryQuestionPatterns = [
    /\bwhat's?\s+(his|her|your|mikkel'?s?)\s+(salary|compensation|pay|rate)\b/i,
    /\bwhat\s+is\s+(his|her|your|mikkel'?s?)\s+(salary|compensation|pay|rate)\b/i,
    /\bsalary expectation/i,
    /\bcompensation expectation/i,
    /\bpay expectation/i,
    /\b(his|her|your|mikkel'?s?)\s+salary expectation/i,
    /\bhow much\s+(does|would|is)\s+(he|she|mikkel|your)\b/i,
    /\bwhat('s|\s+are|\s+is)\s+(his|her|your|mikkel'?s?)?\s*(salary|compensation)\s+(expectation|range|req)/i,
    /\bwhat\s+(compensation|salary)\s+range\s+(are\s+you|is\s+he|is\s+mikkel)\b/i,
    /\b(compensation|salary)\s+range\s+(are\s+you|is\s+he)\s+looking\s+for\b/i,
  ];

  const isSalaryQuestion = salaryQuestionPatterns.some((pattern) =>
    pattern.test(query),
  );

  if (isSalaryQuestion) {
    return {
      shouldProceed: false,
      response:
        "Mikkel would be happy to discuss compensation expectations once there's a conversation about the role and opportunity. His absolute minimum expectation is that the pay is equivalent to a living wage for someone living and paying rent in downtown San Francisco. Please feel free to reach out if you'd like to learn more about his background and experience!",
      reason: 'salary_query',
    };
  }

  return { shouldProceed: true };
}

function looksLikeRoleOpening(query: string): boolean {
  if (isJobDescriptionQuery(query)) return true;
  const openingPatterns = [
    /\b(hiring|looking for|seeking)\s+(a|an|someone)\b/i,
    /\b(hiring|looking for|seeking)\b.{0,80}\b(role|position|job|opening)\b/i,
    /\b(job description|about the role|this is for a role)\b/i,
    /\b(open role|open position|job opening)\b/i,
    /\b(role|position|job)\s+(opening|available)\b/i,
  ];
  return openingPatterns.some((pattern) => pattern.test(query));
}

function hasSoftwareEngineeringSignals(query: string): boolean {
  // Whitelist — omit bare "technical" (matches "technical instructor/writer")
  const softwareEngineeringIndicators = [
    /\b(engineer|developer|programmer|software|frontend|backend|full.?stack|fullstack)\b/i,
    /\b(sdk|api|react|typescript|javascript|node\.?js|python|java|golang|rust)\b/i,
    /\b(coding|programming|devops|sre|mlops)\b/i,
    /\b(tech stack|architecture|system design|infrastructure)\b/i,
  ];
  return softwareEngineeringIndicators.some((pattern) => pattern.test(query));
}

/**
 * Decline only clear non-SE *role openings*. Default allow (LLM) otherwise.
 * Whitelist SE signals instead of enumerating every non-SE occupation.
 */
function checkRoleMatch(query: string): JobFilterResult {
  if (!looksLikeRoleOpening(query)) {
    return { shouldProceed: true };
  }

  if (hasSoftwareEngineeringSignals(query)) {
    return { shouldProceed: true };
  }

  return {
    shouldProceed: false,
    response:
      "Thank you for reaching out. This position doesn't align with Mikkel's background as a software engineer, as he's focused on opportunities in software development. He would have to decline this one. Thanks for thinking of him!",
    reason: 'role_mismatch',
  };
}

function checkLocationQuery(query: string): FilterResult {
  const locationPatterns = [
    /\bwhere\b.{0,160}?\b(he|mikkel)\b.{0,160}?\b(located|living|lives\s+in|live\s+in|live)\b/i,
    /\bwhere\s+(is|does)\s+(he|mikkel)\b/i,
    /\bwhere\b.{0,80}?\b(is|does)\s+mikkel\b/i,
    /\bwhere\b.{0,120}?\b(is|does)\s+(he|mikkel)\b.{0,120}?\blive\b/i,
    /\b(his|mikkel'?s?)\s+location\b/i,
    /\bwhere\s+is\s+he\s+based\b/i,
    /\bis\s+he\s+based\s+in\b/i,
    /\b(lives?|living)\s+in\b/i,
    /\bfrom\s+(where|what\s+city)\b/i,
  ];

  const hasLocationPattern = locationPatterns.some((pattern) =>
    pattern.test(query),
  );

  if (hasLocationPattern) {
    return {
      shouldCallAPI: false,
      response:
        'Mikkel is located in San Francisco, CA. His recent roles at SFMOMA and Intrinsic (Alphabet/Google) were hybrid rolesbased in San Francisco Bay Area, and he also has extensive experience working effectively in fully remote environments for companies like Jefferson Health. He is also open to fully onsite roles, with preference for geographical proximity to downtown San Francisco.',
      reason: 'location_query',
    };
  }

  return { shouldCallAPI: true };
}

function checkWorkArrangementQuery(query: string): FilterResult {
  // Ask-shaped only — bare W2/C2C/1099/full-time in short employer blurbs must not match
  const workArrangementPatterns = [
    /\bcan\s+he\s+(do|work)\b.{0,80}?\b(w2|c2c|contract|1099)\b/i,
    /\b(is\s+he|are\s+you)\s+open\s+to\s+(a\s+)?(w2|c2c|contract|1099)\b/i,
    /\b(work|available)\s+on\s+(a\s+)?(w2|c2c|contract)\b/i,
    /\b(w2|c2c|contract|1099)\s+arrangement\b/i,
    /\b(employment|work)\s+arrangement\b/i,
    /\b(do|does)\s+(he|you)\s+(do|accept|work)\s+(w2|c2c|1099)\b/i,
    /\b(w2|c2c|1099)\s*\?/i,
    /\bsole\s+proprietorship\b/i,
    /\bbilling\s+directly\b/i,
    /\bis\s+(it|this|the\s+role)\s+full[\s-]*time\b/i,
    /\bfull[\s-]*time\s*\?/i,
    /\bcorp.?to.?corp\b/i,
  ];

  const hasWorkArrangementPattern = workArrangementPatterns.some((pattern) =>
    pattern.test(query),
  );

  if (hasWorkArrangementPattern) {
    return {
      shouldCallAPI: false,
      response:
        'Mikkel is flexible with work arrangements and has experience with multiple employment setups:\n\n**Full-time/Salary**: He is open to full-time salaried positions and has experience in both traditional employment and contract roles.\n\n**Contract**: He can work in all three types of contract arrangements:\n- **W2 Contract**: Standard W2 contractor arrangements\n- **1099**: Independent contractor (1099) arrangements\n- **C2C (Corp-to-Corp)**: Yes, he can work on a C2C basis.\n\nArrangements other than W2 would involve a 25% higher rate since he is paying all taxes, benefits, and unpaid time off on that income, this is the minimum increase to account for that difference.\n\nNote: While he can work in all three contract types, if C2C is a hard requirement, he would need to discuss the details of this arrangement directly with the client.\n\nHis background includes successful long and short-term contracts at major organizations like Intrinsic (Alphabet/Google) for 5 months and Jefferson Health, where an initial 4-month contract was extended to 1 year and 2 months due to outstanding performance.',
      reason: 'work_arrangement_query',
    };
  }

  return { shouldCallAPI: true };
}

/**
 * Job FAQ checks for eligible (short, non-role-share) messages only.
 * Callers must gate with isShortCircuitEligible.
 */
export function filterJobCriteria(query: string): JobFilterResult {
  const authResult = checkWorkAuthorizationQuery(query);
  if (!authResult.shouldProceed) {
    return authResult;
  }

  const salaryResult = checkSalaryQuery(query);
  if (!salaryResult.shouldProceed) {
    return salaryResult;
  }

  const roleResult = checkRoleMatch(query);
  if (!roleResult.shouldProceed) {
    return roleResult;
  }

  return { shouldProceed: true };
}

/** Repeated-char / keyboard-mash only — checked before follow-up exceptions. */
function checkSpamMash(trimmed: string): FilterResult | null {
  if (trimmed.length <= 200 && /([a-zA-Z])\1{3,}/.test(trimmed)) {
    return {
      shouldCallAPI: false,
      response: 'This seems like an invalid input, please ask a complete question.',
      reason: 'repeated_chars',
    };
  }

  if (trimmed.length <= 200) {
    const keyboardPatterns = [
      /asdfg/i,
      /qwerty/i,
      /zxcvb/i,
      /mnbvc/i,
      /poiuyt/i,
      /lkjhgf/i,
    ];

    if (keyboardPatterns.some((pattern) => pattern.test(trimmed))) {
      return {
        shouldCallAPI: false,
        response:
          'Invalid input detected, please ask a complete question or try formulating it again.',
        reason: 'keyboard_mash',
      };
    }
  }

  return null;
}

/** Generic too-short fallback — skipped when FAQ matchers already handled the input. */
function checkTooShort(trimmed: string): FilterResult | null {
  if (trimmed.length <= 10) {
    return {
      shouldCallAPI: false,
      response:
        "Sorry, I don't understand the question or message. Please try to formulate a complete and valid question or message (ideally a full sentence) and I'll be happy to provide you with a complete answer!",
      reason: 'too_short',
    };
  }
  return null;
}

function checkGenericQuery(trimmed: string): FilterResult | null {
  // Continuations ("tell me more", "continue") are not generic bios — let them
  // reach follow-up / LLM after a prior turn.
  const genericPatterns = [
    /^(tell me about|about mikkel|about him)$/i,
    // Bare greetings and greetings with trailing punctuation
    /^(hi|hello|hey|yo|howdy|greetings)([\s,!.]+)?$/i,
    /^(what's up|whats up|sup)([\s,!.]*)?$/i,
    /^(what about you|about you|you\?)([\s,!.]*)?$/i,
    /^(more info|more information)([\s,!.]*)?$/i,
  ];

  if (genericPatterns.some((pattern) => pattern.test(trimmed))) {
    return {
      shouldCallAPI: false,
      response: `Mikkel is a software engineer with ~6 years of experience, including TypeScript, React, Node.js, ASP.NET, and Shopify expertise. 

What specific area would you like to explore?
- Ask about his **experience** at specific companies
- Ask about his **projects** and accomplishments  
- Ask about **skills** in particular technologies
- Or **paste a full job description** for detailed match analysis`,
      reason: 'generic_query',
    };
  }

  return null;
}

/**
 * filterInput: Main entry point for input filtering.
 *
 * Called from ChatInterface.tsx (client-side, before API call) and
 * from app/api/chat/route.ts (server-side, as defense-in-depth).
 *
 * Pipeline:
 *   1. Spam mash (repeated chars / keyboard) — before follow-up exceptions
 *   2. Role-share / long paste → LLM (no FAQ canned)
 *   3. FAQ-shaped asks → allowlisted canned replies (may be short)
 *   4. Generic greetings (before follow-up)
 *   5. Meaningful short follow-up after a '?' → LLM
 *   6. Too-short fallback for remaining short noise
 *   7. Default → LLM
 */
export function filterInput(
  query: string,
  conversationHistory: string[],
): FilterResult {
  const trimmed = query.trim();

  const mash = checkSpamMash(trimmed);
  if (mash) {
    return mash;
  }

  if (isRoleShareOrLongPaste(query)) {
    return { shouldCallAPI: true, reason: 'role_share_or_long_paste' };
  }

  if (isShortCircuitEligible(query)) {
    const jobFilterResult = filterJobCriteria(query);
    if (!jobFilterResult.shouldProceed) {
      return {
        shouldCallAPI: false,
        response: jobFilterResult.response,
        reason: jobFilterResult.reason,
      };
    }

    const locationResult = checkLocationQuery(query);
    if (!locationResult.shouldCallAPI) {
      return locationResult;
    }

    const workArrangementResult = checkWorkArrangementQuery(query);
    if (!workArrangementResult.shouldCallAPI) {
      return workArrangementResult;
    }
  }

  // Greetings before follow-up so bare "hi" after a prior '?' stays canned
  const generic = checkGenericQuery(trimmed);
  if (generic) {
    return generic;
  }

  // Short substantive replies after a '?' (e.g. "React") — after FAQ/greetings
  if (conversationHistory && conversationHistory.length > 0) {
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    if (
      lastMessage.includes('?') &&
      trimmed.length > 0 &&
      trimmed.length <= 10
    ) {
      return {
        shouldCallAPI: true,
        reason: 'valid_follow_up',
      };
    }
  }

  const tooShort = checkTooShort(trimmed);
  if (tooShort) {
    return tooShort;
  }

  return { shouldCallAPI: true };
}
