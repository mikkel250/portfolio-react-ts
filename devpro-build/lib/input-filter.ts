// Input validation and filtering to prevent BS being sent to the AI
export interface FilterResult {
  shouldCallAPI: boolean;
  response?: string;
  reason?: string;
}

export function filterInput(query: string): FilterResult {
  const trimmed = query.trim();
  
  // too short
  if (trimmed.length <= 10) {
    return {
      shouldCallAPI: false,
      response: "This doesn't seem like enough characters to have asked a useful question. Please try to formulate a complete and valid question and I'll be happy to provide you with a complete answer!",
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