// devpro-build/app/api/lib/prompts.ts

/**
 * Shared prompt utilities and helper functions
 * Note: Main chat prompt is in chat-prompt.ts, JD prompt is in jd-prompt.ts
 */

import { CHAT_SYSTEM_PROMPT } from './chat-prompt';

/**
 * Check if query is asking about professional vs personal experience
 * Helps determine response strategy in knowledge base retrieval
 */
export function isProfessionalExperienceQuery(query: string): boolean {
  const professionalKeywords = /professional\s+(experience|work|background)|on\s+the\s+job|at\s+work|in\s+production/i;
  return professionalKeywords.test(query);
}

/**
 * Detect if query is about skills/technologies
 */
export function isSkillQuery(query: string): boolean {
  const skillKeywords = /do\s+you\s+(know|have\s+experience|use)|familiar\s+with|experience\s+with|skills?\s+in/i;
  return skillKeywords.test(query);
}

/**
 * Detect if query contains AI-related keywords
 */
export function isAIQuery(query: string): boolean {
  const aiKeywords = /\b(AI|LLM|GPT|machine learning|agentic|agent|autonomous|prompt engineering|AutoGPT|LangChain)\b/i;
  return aiKeywords.test(query);
}

/**
 * Build chat system prompt with injected context and placeholders
 */
export function buildChatSystemPrompt(
  context: string,
  options?: {
    calendlyLink?: string;
  }
): string {
  let prompt = CHAT_SYSTEM_PROMPT.replace('{CONTEXT}', context);
  
  // Replace Calendly link
  const calendlyLink = options?.calendlyLink || process.env.NEXT_PUBLIC_CALENDLY_LINK || '';
  prompt = prompt.split('{CALENDLY_LINK}').join(calendlyLink);
  
  return prompt;
}