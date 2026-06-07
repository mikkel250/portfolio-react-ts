// ---------------------------------------------------------------------------
// Prompt Utilities — Glue Between Routes, LangFuse, and Hardcoded Prompts
// ---------------------------------------------------------------------------
// This file is the assembly layer: it takes the context from the knowledge
// base, combines it with the system prompt template, and produces the final
// prompt string for the LLM.
//
// Prompt resolution order:
//   1. LangFuse Prompt Management (runtime-updatable, no deploy needed)
//   2. Hardcoded CHAT_SYSTEM_PROMPT from chat-prompt.ts (always available)
//
// The intent detection helpers (isProfessionalExperienceQuery, etc.) are
// lightweight classifiers that could be used for conditional UI or routing,
// though the KB system currently handles classification independently.
// ---------------------------------------------------------------------------

import { compilePrompt } from './langfuse-prompts';

/**
 * isProfessionalExperienceQuery: Detects whether the user is asking about
 * PROFESSIONAL (on-the-job) experience vs. personal projects.
 *
 * Useful for routing but currently informational — the KB retrieval
 * system (knowledge-base.ts) handles this implicitly via regex matching.
 */
export function isProfessionalExperienceQuery(query: string): boolean {
  const professionalKeywords = /professional\s+(experience|work|background)|on\s+the\s+job|at\s+work|in\s+production/i;
  return professionalKeywords.test(query);
}

/**
 * isSkillQuery: Detects whether the user is asking about specific
 * technologies, languages, frameworks, or tools.
 */
export function isSkillQuery(query: string): boolean {
  const skillKeywords = /do\s+you\s+(know|have\s+experience|use)|familiar\s+with|experience\s+with|skills?\s+in/i;
  return skillKeywords.test(query);
}

/**
 * isAIQuery: Detects whether the query contains AI/LLM/ML keywords.
 *
 * This is a lighter check than the KB's isMetaQuery — it could be used
 * for conditional UI or routing without loading the full meta-project KB.
 * Useful for triggering the "meta-awareness" path in the system prompt.
 */
export function isAIQuery(query: string): boolean {
  const aiKeywords = /\b(AI|LLM|GPT|machine learning|agentic|agent|autonomous|prompt engineering|AutoGPT|LangChain)\b/i;
  return aiKeywords.test(query);
}

/**
 * buildChatSystemPrompt: Assembles the final system prompt for the chat endpoint.
 *
 * Flow:
 *   1. Resolves the Calendly link (from options → env var → empty string)
 *   2. Delegates to compilePrompt() which:
 *      a. Tries LangFuse (runtime-updatable prompts via web UI)
 *      b. Falls back to hardcoded CHAT_SYSTEM_PROMPT if LangFuse unavailable
 *   3. Variables {CONTEXT} and {CALENDLY_LINK} are interpolated
 *
 * This is the function called from the main chat API route at
 * app/api/chat/route.ts.
 *
 * @param context - Raw text from getRelevantContext() (KB markdown files)
 * @param options.calendlyLink - Optional explicit scheduling link
 * @returns Compiled prompt string ready to send to the LLM
 */
export async function buildChatSystemPrompt(
  context: string,
  options?: {
    calendlyLink?: string;
  }
): Promise<string> {
  const calendlyLink = options?.calendlyLink || process.env.NEXT_PUBLIC_CALENDLY_LINK || '';

  return await compilePrompt('portfolio-chat-system', {
    context,
    calendly_link: calendlyLink,
  });
}
