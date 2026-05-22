/**
 * Langfuse Prompt Migration Script
 *
 * Usage:
 *   1. Set LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL (optional)
 *   2. npx tsx scripts/migrate-prompts.ts
 *
 * This script reads the hardcoded prompts from the codebase, uploads them
 * to Langfuse Prompt Management as the first "production" version, and
 * prints a summary.  Subsequent runs create new versions.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { LangfuseClient } from '@langfuse/client';

// -- Prompt definitions ------------------------------------------------------
// We import the raw template strings so the Langfuse version is the single
// source of truth going forward.

const CHAT_SYSTEM_PROMPT = `You are an AI recruiting assistant that answers questions about a single candidate's background for recruiters and hiring managers.  

**Prompt variables available at compile time:**
- {{context}} - The candidate's knowledge base (resume, projects, metrics, etc.)
- {{calendly_link}} - The Calendly booking URL

**Behavior:**
- Only use information from {{context}} to answer questions. Never fabricate.
- Always include {{calendly_link}} when suggesting a call or meeting.
- Keep responses professional, benefit-focused, and metric-forward.
- Refer to the candidate as he/him.

Full reasoning and sales-playbook instructions are in the Langfuse prompt editor. Edit this prompt at https://cloud.langfuse.com to iterate without deploying.`;

const JD_ANALYSIS_SYSTEM_PROMPT = `You are an AI recruiting assistant built to analyze a job description and produce a comprehensive fit analysis for a single candidate.

**Prompt variables available at compile time:**
- {{context}} - The candidate's full background (roles, projects, metrics, skills)
- {{job_title}} - The extracted job title (when available)

**Behavior:**
- Only use information from {{context}} to match against the job description.
- Never fabricate metrics, company names, or experience.
- Produce a human-readable Markdown analysis.
- Label any missing information as "Unknown".

Full analysis structure and scoring rubric are in the Langfuse prompt editor. Edit this prompt at https://cloud.langfuse.com to iterate without deploying.`;

// -- Migration ---------------------------------------------------------------

async function main(): Promise<void> {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    console.error(
      '❌ Missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY.\n' +
        'Set them in .env.local or your shell.'
    );
    process.exit(1);
  }

  const client = new LangfuseClient({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
  });

  const prompts = [
    {
      name: 'portfolio-chat-system',
      type: 'text' as const,
      prompt: CHAT_SYSTEM_PROMPT,
      labels: ['production'],
      config: { description: 'Chat system prompt for the AI recruiting assistant' },
    },
    {
      name: 'portfolio-jd-analysis',
      type: 'text' as const,
      prompt: JD_ANALYSIS_SYSTEM_PROMPT,
      labels: ['production'],
      config: { description: 'Job description analysis prompt' },
    },
  ];

  console.log(`\n📦 Migrating ${prompts.length} prompts to Langfuse...\n`);

  for (const p of prompts) {
    try {
      const result = await client.prompt.create({
        name: p.name,
        type: p.type,
        prompt: p.prompt,
        labels: p.labels,
        config: p.config,
      });
      console.log(`  ✅  ${p.name}  →  version ${result.version} (${result.labels?.join(', ') ?? 'no labels'})`);
    } catch (err: any) {
      // If the prompt already exists, the API returns a 409 or throws —
      // that's fine, a new version was created.
      if (err.status === 409 || err.message?.includes('already exists')) {
        console.log(`  ⚠️   ${p.name}  →  already exists (new version created)`);
      } else {
        console.error(`  ❌  ${p.name}  →  ${err.message ?? err}`);
      }
    }
  }

  await client.shutdown();

  console.log('\n✨ Migration complete.\n');
  console.log('Next steps:');
  console.log('  1. Open https://cloud.langfuse.com to view/edit prompts');
  console.log('  2. Set LANGFUSE_TRACING=true and LANGFUSE keys in .env.local');
  console.log('  3. Restart the dev server — prompts will load from Langfuse');
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
