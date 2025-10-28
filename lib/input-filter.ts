// Input validation and filtering to prevent BS being sent to the AI
// Client-safe job filtering functions (without fs imports)

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

// Client-safe job filtering functions (moved from knowledge-base.ts to avoid fs imports)
function isJobDescriptionQuery(query: string): boolean {
  // Simplified JD detection - only the most obvious indicators
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
    /JD/i,
    /job description/i,
    /opportunity/i,
  ];
  
  const matchCount = obviousJD.filter(pattern => pattern.test(query)).length;
  
  // Require at least 2 JD indicators to reduce false positives from casual outreach
  return query.length > 150 && matchCount >= 2;
}

function isJobRelatedQuery(query: string): boolean {
  const jobRelatedKeywords = [
    /job|position|role|opportunity|hiring|recruiting/i,
    /salary|compensation|pay|rate|range/i,
    /location|remote|hybrid|onsite|office/i,
    /work authorization|visa|citizen|sponsor|sponsorship/i,
    /relocation|relocate/i
  ];
  
  return jobRelatedKeywords.some(pattern => pattern.test(query));
}

function checkWorkAuthorizationQuery(query: string): JobFilterResult {
  // Check for various work authorization related patterns
  const authPatterns = [
    /work authorization/i,
    /authorized.*work/i,
    /authorized.*the/i,
    /eligible to work/i,
    /us citizen/i,
    /\bauthorized\b/i,
    /visa sponsorship/i,
    /sponsor.*visa/i,
    /need.*sponsorship/i,
    /require.*sponsorship/i,
    /require.*visa/i
  ];
  
  if (authPatterns.some(pattern => pattern.test(query))) {
    return {
      shouldProceed: false,
      response: "Yes, Mikkel is authorized to work in the United States and does not require visa sponsorship.",
      reason: "work_authorization"
    };
  }
  
  return { shouldProceed: true };
}

function checkSalaryQuery(query: string): JobFilterResult {
  // Only catch explicit salary/compensation questions, not job descriptions
  const salaryQuestionPatterns = [
    /\bwhat's?\s+(your|your salary|your compensation|your pay|your rate)\b/i,
    /\bhow much\b/i,
    /\bsalary expectation/i,
    /\bcompensation expectation/i,
    /\bpay expectation/i,
    /\bsalary range/i,
    /\bcompensation range/i,
    /\bwhat.*salary/i,
    /\bwhat.*compensation/i,
    /\bwhat.*pay/i
  ];
  
  // Only trigger for questions, not for job descriptions that might mention these terms
  const isSalaryQuestion = salaryQuestionPatterns.some(pattern => pattern.test(query));
  
  if (isSalaryQuestion && query.length < 200) { // Avoid matching job descriptions
    return {
      shouldProceed: false,
      response: "Mikkel would be happy to discuss compensation expectations once there's a conversation about the role and opportunity. His absolute minimum expectation is that the pay is equivalent to a living wage for someone living and paying rent in downtown San Francisco. Please feel free to reach out if you'd like to learn more about his background and experience!",
      reason: "salary_query"
    };
  }
  
  return { shouldProceed: true };
}

function checkRoleMatch(query: string): JobFilterResult {
  // Only filter out obviously non-matching roles, let AI handle nuanced matching
  // These are roles that are clearly not software engineering
  const nonMatchingRoles = [
    /\b(medical doctor|physician|surgeon|nurse|healthcare provider)/i,
    /\b(teacher|professor|educator|instructor)/i,
    /\b(lawyer|attorney|legal counsel)/i,
    /\b(accountant|cpa|finance|bookkeeper)/i,
    /\b(pilot|flight attendant|driver|delivery)/i,
    /\b(chef|cook|restaurant|food service)/i,
    /\b(retail|cashier|sales associate)/i,
    /\b(construction|contractor|plumber|electrician)/i,
  ];
  
  // Check if this is a job posting AND has non-matching role keywords
  const isNonMatchingRole = nonMatchingRoles.some(pattern => pattern.test(query));
  
  // Only filter if it's clearly a job posting with non-matching role
  if ((isJobDescriptionQuery(query) || isJobRelatedQuery(query)) && isNonMatchingRole) {
    return {
      shouldProceed: false,
      response: "Thank you for reaching out. This position doesn't align with Mikkel's background as a software engineer, as he's focused on opportunities in software development. He would have to decline this one. Thanks for thinking of him!",
      reason: "role_mismatch"
    };
  }
  
  return { shouldProceed: true };
}

export function filterJobCriteria(query: string): JobFilterResult {
  // Check if this is a job-related query
  if (!isJobDescriptionQuery(query) && !isJobRelatedQuery(query)) {
    return { shouldProceed: true };
  }

  // Check for work authorization questions
  const authResult = checkWorkAuthorizationQuery(query);
  if (!authResult.shouldProceed) {
    return authResult;
  }

  // Check for salary questions
  const salaryResult = checkSalaryQuery(query);
  if (!salaryResult.shouldProceed) {
    return salaryResult;
  }

  // Check for obviously non-matching role titles
  const roleResult = checkRoleMatch(query);
  if (!roleResult.shouldProceed) {
    return roleResult;
  }

  return { shouldProceed: true };
}

export function filterInput(query: string, conversationHistory: string[]): FilterResult {
  const trimmed = query.trim();
  
  // Check job-specific criteria first
  const jobFilterResult = filterJobCriteria(query);
  if (!jobFilterResult.shouldProceed) {
    return {
      shouldCallAPI: false,
      response: jobFilterResult.response,
      reason: jobFilterResult.reason
    };
  }
  
  // first, check if it's an answer to a question/CTA from the LLM 
  if (conversationHistory && conversationHistory.length > 0) {
    const lastMessage = conversationHistory[conversationHistory.length - 1];

    // if the last message was a question and this is a short response, allow it
    if (lastMessage.includes('?') && trimmed.length <= 10) {
      return {
        shouldCallAPI: true,
        reason: 'valid_follow_up'
      }
    }
  }

  // too short
  if (trimmed.length <= 10) {
    return {
      shouldCallAPI: false,
      response: "Sorry, I don't understand the question or message. Please try to formulate a complete and valid question or message (ideally a full sentence) and I'll be happy to provide you with a complete answer!",
      reason: "too_short"
    };
  }

  // spam/keyboard mash filter, check for 4+ repeated characters
  if (/(.)\1{3,}/.test(trimmed)) {
    return {
      shouldCallAPI: false,
      response: "This seems like an invalid input, please ask a complete question.",
      reason: "repeated_chars"
    };
  }

  // specific keyboard mash patterns, regex for single or two random letters
  const keyboardPatterns = [
    /asdfg/i,
    /qwerty/i,
    /zxcvb/i,
    /mnbvc/i,
    /poiuyt/i,
    /lkjhgf/i,
    /^[a-z]{1,2}$/i,
  ];

  if (keyboardPatterns.some(pattern => pattern.test(trimmed))) {
    return {
      shouldCallAPI: false,
      response: "Invalid input detected, please ask a complete question or try formulating it again.",
      reason: "keyboard_mash"
    };
  }

  // generic queries - provide helpful canned response but don't call API
  const genericPatterns = [
    /^(tell me about|about mikkel|about him)$/i,
    // Greetings that slip through the length filter
    /^(hi|hello|hey|yo|howdy|greetings)[\s,!.]+$/i,
    /^(what's up|whats up|sup)[\s,!.]*$/i,
    
    // Vague queries without context
    /^(tell me more|say more|continue|go on)[\s,!.]*$/i,
    /^(what about you|about you|you\?)[\s,!.]*$/i,
    /^(more info|more information)[\s,!.]*$/i,
  ];

  if (genericPatterns.some(pattern => pattern.test(trimmed))) {
    return {
      shouldCallAPI: false,
      response: `Mikkel is a software engineer with 5 years of experience, including TypeScript, React, Node.js, ASP.NET, and Shopify expertise. 

What specific area would you like to explore?
- Ask about his **experience** at specific companies
- Ask about his **projects** and accomplishments  
- Ask about **skills** in particular technologies
- Or **paste a full job description** for detailed match analysis`,
      reason: 'generic_query'
    };
  }

  // all queries not caught above get sent to the API 
  return { shouldCallAPI: true };
}