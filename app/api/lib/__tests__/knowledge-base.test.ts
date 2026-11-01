import { describe, expect, it } from 'vitest';
import { getRelevantContext } from '../knowledge-base';

const MARKERS = {
  experience: 'Jefferson Health',
  career: 'Career Transition & Background Story',
  meta: 'About This AI Recruiting Assistant',
  projects: 'Technical Projects',
  skills: 'NEVER SAY (Critical - Prevent Hallucinations)',
} as const;

const SAMPLE_JD = `Software Engineer - Full Stack
Location: San Francisco
Responsibilities:
- Build scalable web applications
- Collaborate with product team
Requirements:
- 5+ years of experience
- TypeScript, React, Node.js
Qualifications:
- BS in Computer Science preferred
- Strong communication skills`;

describe('getRelevantContext', () => {
  it('loads every KB section for a pasted job description', () => {
    const context = getRelevantContext(SAMPLE_JD);

    expect(context).toContain(MARKERS.experience);
    expect(context).toContain(MARKERS.career);
    expect(context).toContain(MARKERS.meta);
    expect(context).toContain(MARKERS.projects);
    expect(context).toContain(MARKERS.skills);
    expect(context.length).toBeGreaterThan(100_000);
  });

  it('does not treat short recruiter outreach as a full job description', () => {
    const context = getRelevantContext(
      "Hi Mikkel, I'm reaching out about a Full-Stack Engineer role. We're looking for someone with Node.js experience.",
    );

    expect(context).toContain(MARKERS.experience);
    expect(context).not.toContain(MARKERS.career);
    expect(context).not.toContain(MARKERS.meta);
  });

  it('requires two JD indicators even when the paste is long', () => {
    const longSingleIndicator = `${'x'.repeat(160)}\nRequirements:\nfoo`;
    const context = getRelevantContext(longSingleIndicator);

    expect(context).not.toContain(MARKERS.career);
    expect(context).not.toContain(MARKERS.meta);
    expect(context).toContain(MARKERS.experience);
  });

  it('loads meta-project content for questions about this assistant', () => {
    const context = getRelevantContext('How does this chatbot work under the hood?');

    expect(context).toContain(MARKERS.meta);
  });

  it('loads career-story content for transition questions', () => {
    const context = getRelevantContext('Why did you switch to software engineering?');

    expect(context).toContain(MARKERS.career);
  });

  it('defaults to experience and skills when nothing else matches', () => {
    const context = getRelevantContext('Hello');

    expect(context).toContain(MARKERS.experience);
    expect(context).not.toContain(MARKERS.career);
    expect(context).not.toContain(MARKERS.meta);
    expect(/TypeScript/i.test(context)).toBe(true);
  });

  it('loads projects.md for side-project and GitHub questions', () => {
    const context = getRelevantContext(
      'What side projects has he shipped on GitHub outside of work?',
    );

    expect(context).toContain(MARKERS.projects);
    expect(context).not.toContain(MARKERS.career);
    expect(context).not.toContain(MARKERS.meta);
  });

  it('loads skills.md alone for a stack proficiency question', () => {
    const context = getRelevantContext(
      'Which TypeScript frameworks is he proficient with?',
    );

    expect(context).toContain(MARKERS.skills);
    expect(context).not.toContain(MARKERS.career);
    expect(context).not.toContain(MARKERS.projects);
  });
});
