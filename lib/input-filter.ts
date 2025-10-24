// Input validation and filtering to prevent BS being sent to the AI
export interface FilterResult {
  shouldCallAPI: boolean;
  response?: string;
  reason?: string;
}

export function filterInput(query: string, conversationHistory: string[]): FilterResult {
  const trimmed = query.trim();
  
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