// ---------------------------------------------------------------------------
// Knowledge Base — Simple RAG Retrieval System
// ---------------------------------------------------------------------------
// The knowledge base (KB) is the "retrieval" half of our RAG pattern.
// It contains structured markdown files about the candidate, organized
// by topic (experience, projects, skills, career story, meta/about-this-app).
//
// Why keyword-matching instead of vector/embedding search?
//   1. The KB is tiny (~5 pages about one person)
//   2. Keyword matching works reliably for structured, domain-specific content
//   3. Avoids embedding API costs ($0.02/1M tokens) and vector DB hosting
//   4. Ships faster — weeks saved vs. building full semantic search infra
//   5. Can be upgraded later if usage data shows semantic search would help
//
// Architecture:
//   User query → classify with regex → load relevant MD files → inject into prompt
//
// Query classification functions use regex to detect what the user is asking
// about (experience? skills? career? etc.), then load only the relevant files
// to keep prompt size manageable.
// ---------------------------------------------------------------------------

import fs from 'fs';
import path from 'path';

/** Configuration for the knowledge base file locations */
interface KnowledgeBaseConfig {
  basePath: string;
  files: {
    experience: string;
    projects: string;
    skills: string;
    careerStory: string;
    metaProject: string;
  };
}

/** Paths to all KB markdown files — single source of truth */
const KB_CONFIG: KnowledgeBaseConfig = {
  basePath: 'knowledge-base',
  files: {
    experience: 'experience.md',
    projects: 'projects.md',
    skills: 'skills.md',
    careerStory: 'career-story.md',
    metaProject: 'meta-project.md',
  },
};

/**
 * loadKBFile: Reads a knowledge base file from disk.
 *
 * All KB files are simple markdown stored in the project.
 * Reads synchronously since this runs during the request handler
 * (serverless function — no concurrent requests on the same instance).
 * Returns empty string on failure so the rest of the pipeline
 * doesn't crash — the LLM will just have less context.
 */
function loadKBFile(fileName: string): string {
  try {
    const kbPath = path.join(process.cwd(), KB_CONFIG.basePath, fileName);
    return fs.readFileSync(kbPath, 'utf-8');
  } catch (error) {
    console.error(`Error loading KB file ${fileName}:`, error);
    return '';
  }
}

/**
 * isExperienceQuery: Detects questions about work history, companies, roles.
 * Triggers loading experience.md (professional roles, companies, metrics).
 */
function isExperienceQuery(query: string): boolean {
  const experienceKeywords = /experience|work|job|role|position|company|companies|employer|career|professional|worked at|job history|background/i;
  return experienceKeywords.test(query);
}

/**
 * isProjectsQuery: Detects questions about side projects, portfolio work.
 * Triggers loading projects.md (personal projects, GitHub repos, demos).
 */
function isProjectsQuery(query: string): boolean {
  const projectKeywords = /\b(?:projects?|built|created|developed|portfolios?|github|demos?|apps?|applications?|websites?|sites?|independent)\b|outside of work|open source/i;
  return projectKeywords.test(query);
}

/**
 * isSkillsQuery: Detects questions about technologies, languages, frameworks.
 * Triggers loading skills.md (technical skills and proficiency levels).
 */
function isSkillsQuery(query: string): boolean {
  const skillKeywords = /skill|technology|tech stack|know|familiar|proficient|expertise|experienced with|languages?|frameworks?|tools?|libraries|typescript|javascript|react|angular|python|node/i;
  return skillKeywords.test(query);
}

/**
 * isCareerStoryQuery: Detects "why" questions about career transition/path.
 * Triggers loading career-story.md (transition narrative, philosophy).
 */
function isCareerStoryQuery(query: string): boolean {
  const careerStoryKeywords = /why|transition|switch|career change|background|story|journey|path|how did you|what led you|management|previous|before/i;
  return careerStoryKeywords.test(query);
}

/**
 * isMetaQuery: Detects questions about THIS app itself — how it works,
 * its architecture, its AI/LLM stack. This is the "meta-awareness" trigger.
 * Triggers loading meta-project.md (self-referential documentation).
 */
function isMetaQuery(query: string): boolean {
  const metaKeywords = /AI|assistant|chatbot|this (app|tool|bot|system)|how (does this|do you) work|built this|created this|tech stack|architecture|GPT|OpenAI|how are you|agentic|agent|autonomous|LLM|machine learning|prompt engineering/i;
  return metaKeywords.test(query);
}

/**
 * isJobDescriptionQuery: Detects whether the user pasted a full job description.
 *
 * Uses a two-layer approach to avoid false positives:
 *   1. Length check: query must be > 150 chars (JDs are long, casual messages aren't)
 *   2. Pattern check: must match at least 2 JD indicator patterns
 *
 * JD indicators include common headers like "Responsibilities:", "Requirements:",
 * "Qualifications:", "Must Have:", etc. Requiring ≥2 matches prevents triggering
 * on messages that casually mention one of these terms.
 *
 * When detected: loads ALL KB context files (need full background for matching),
 * and the JD analysis endpoint may be more appropriate than the chat endpoint.
 */
function isJobDescriptionQuery(query: string): boolean {
  // Only the most obvious JD structural indicators
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

/**
 * getRelevantContext: The main RAG retrieval function.
 *
 * Given a user query, classifies it and loads the most relevant KB files.
 * This is the function called from the chat API route.
 *
 * Retrieval strategy:
 *   - Job descriptions → ALL files (need comprehensive background for matching)
 *   - Mixed queries → load matching categories (can load multiple)
 *   - No match → default to experience + skills (safest general fallback)
 *
 * Sections are joined with "\n\n--\n\n" separators so the LLM can distinguish
 * different content sections (experience vs. skills vs. projects, etc.).
 *
 * Returns the concatenated context string to be injected into the system prompt.
 */
export function getRelevantContext(query: string): string {
  const contexts: string[] = [];

  // Job descriptions get EVERYTHING — recruting is comprehensive matching
  if (isJobDescriptionQuery(query)) {
    contexts.push(loadKBFile(KB_CONFIG.files.experience));
    contexts.push(loadKBFile(KB_CONFIG.files.skills));
    contexts.push(loadKBFile(KB_CONFIG.files.projects));
    contexts.push(loadKBFile(KB_CONFIG.files.careerStory));
    contexts.push(loadKBFile(KB_CONFIG.files.metaProject));
    return contexts.filter(context => context.length > 0).join('\n\n--\n\n');
  }

  // For other queries, load only the relevant files
  // Multiple categories can match — a query like "React experience"
  // matches both skills and experience, both get loaded
  if (isExperienceQuery(query)) {
    contexts.push(loadKBFile(KB_CONFIG.files.experience));
  }

  if (isProjectsQuery(query)) {
    contexts.push(loadKBFile(KB_CONFIG.files.projects));
  }

  if (isSkillsQuery(query)) {
    contexts.push(loadKBFile(KB_CONFIG.files.skills));
  }

  if (isCareerStoryQuery(query)) {
    contexts.push(loadKBFile(KB_CONFIG.files.careerStory));
  }

  if (isMetaQuery(query)) {
    contexts.push(loadKBFile(KB_CONFIG.files.metaProject));
  }

  // Safety net: if nothing matched or all loads failed, give experience + skills as default
  let filteredContexts = contexts.filter(context => context.length > 0);

  if (filteredContexts.length === 0) {
    filteredContexts.push(loadKBFile(KB_CONFIG.files.experience));
    filteredContexts.push(loadKBFile(KB_CONFIG.files.skills));
    filteredContexts = filteredContexts.filter(context => context.length > 0);
  }

  return filteredContexts.join('\n\n--\n\n');
}

/**
 * getAllContext: Loads EVERY KB file — used for the JD analysis endpoint
 * where comprehensive background is needed for detailed match scoring.
 *
 * Unlike getRelevantContext (which loads selectively), this always loads
 * all five files regardless of query content.
 */
export function getAllContext(): string {
  const contexts = [
    loadKBFile(KB_CONFIG.files.experience),
    loadKBFile(KB_CONFIG.files.projects),
    loadKBFile(KB_CONFIG.files.skills),
    loadKBFile(KB_CONFIG.files.careerStory),
    loadKBFile(KB_CONFIG.files.metaProject),
  ];

  return contexts.filter(context => context.length > 0).join('\n\n--\n\n');
}

/**
 * extractJobTitle: Attempts to extract a job title from a query or JD.
 *
 * Uses regex patterns that match common recruiter phrasing like
 * "seeking a Frontend Software Engineer" or "AI Engineer role".
 * Currently not actively used in the chat endpoint (extracted but
 * not injected), but available for future prompt personalization.
 *
 * Returns null if no title pattern matches.
 */
export function extractJobTitle(query: string): string | null {
  const patterns = [
    // Match titles like "Frontend Software Engineer", "UI/UX Developer", "AI Engineer", etc.
    /(?:seeking|hiring|looking for|impressed by your skills|interested in|good fit for|great match)\s+(?:a\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Software\s+)?(?:Engineer|Developer|Architect|Manager|Lead))/,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Software\s+)?(?:Engineer|Developer|Architect|Manager|Lead))\s+(?:role|position|job)/,
    // Specific patterns for common titles
    /(?:seeking|hiring|looking for|impressed by your skills|interested in|good fit for|great match)\s+(?:a\s+)?(Frontend\s+(?:Software\s+)?(?:Engineer|Developer))/,
    /(?:seeking|hiring|looking for|impressed by your skills|interested in|good fit for|great match)\s+(?:a\s+)?(Full\s+Stack\s+(?:Software\s+)?(?:Engineer|Developer))/,
    /(?:seeking|hiring|looking for|impressed by your skills|interested in|good fit for|great match)\s+(?:a\s+)?(UI\/UX\s+(?:Engineer|Developer))/,
    /(?:seeking|hiring|looking for|impressed by your skills|interested in|good fit for|great match)\s+(?:a\s+)?(AI\s+(?:Engineer|Developer))/,
    /(?:seeking|hiring|looking for|impressed by your skills|interested in|good fit for|great match)\s+(?:a\s+)?(Web\s+(?:Engineer|Developer))/,
    /(?:seeking|hiring|looking for|impressed by your skills|interested in|good fit for|great match)\s+(?:a\s+)?(React\s+(?:Engineer|Developer))/,
    /(?:seeking|hiring|looking for|impressed by your skills|interested in|good fit for|great match)\s+(?:a\s+)?(Angular\s+(?:Engineer|Developer))/,
    /(?:seeking|hiring|looking for|impressed by your skills|interested in|good fit for|great match)\s+(?:a\s+)?(JavaScript\s+(?:Engineer|Developer))/,
    /(?:seeking|hiring|looking for|impressed by your skills|interested in|good fit for|great match)\s+(?:a\s+)?(TypeScript\s+(?:Engineer|Developer))/,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}


// Job filtering functions moved to lib/input-filter.ts to avoid fs import issues on client side
