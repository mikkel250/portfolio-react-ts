/**
 * Langfuse Prompt Migration Script
 *
 * Usage:
 *   1. Set LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL
 *   2. npm run migrate:prompts
 *
 * Uploads the local chat/JD system templates (with {{context}} injection
 * slots) as Langfuse Prompt Management versions labeled `production`.
 * Subsequent runs create new versions and promote them to production.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { LangfuseClient } from '@langfuse/client';
import { CHAT_SYSTEM_PROMPT } from '../app/api/lib/chat-prompt';
import { JD_ANALYSIS_SYSTEM_PROMPT } from '../app/api/lib/jd-prompt';

/** App-facing label used by runtime `client.prompt.get(..., { label })`. */
const APP_PROMPT_LABEL = 'production';

type MigratablePrompt = {
  name: string;
  type: 'text';
  prompt: string;
  labels: string[];
  /** Primary label the app fetches at runtime (usually production). */
  appLabel?: string;
  compileSmokeVars?: Record<string, string>;
  config: { description: string };
};

async function main(): Promise<void> {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    console.error(
      '❌ Missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY.\n' +
        'Set them in .env.local or your shell.'
    );
    process.exit(1);
  }

  const baseUrl = process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com';
  const client = new LangfuseClient({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl,
  });

  const prompts: MigratablePrompt[] = [
    {
      name: 'portfolio-chat-system',
      type: 'text',
      prompt: CHAT_SYSTEM_PROMPT,
      labels: [APP_PROMPT_LABEL],
      appLabel: APP_PROMPT_LABEL,
      compileSmokeVars: {
        context: 'KB_SMOKE',
        calendly_link: 'https://example.com/cal',
      },
      config: {
        description:
          'Chat system prompt for the AI recruiting assistant (vars: context, calendly_link)',
      },
    },
    {
      name: 'portfolio-jd-analysis',
      type: 'text',
      prompt: JD_ANALYSIS_SYSTEM_PROMPT,
      labels: [APP_PROMPT_LABEL],
      appLabel: APP_PROMPT_LABEL,
      compileSmokeVars: {
        context: 'KB_SMOKE',
        job_title: 'Engineer',
      },
      config: {
        description:
          'Job description analysis prompt (vars: context, job_title)',
      },
    },
  ];

  console.log(`\n📦 Migrating ${prompts.length} prompts to Langfuse (${baseUrl})...\n`);

  for (const p of prompts) {
    try {
      const result = await client.prompt.create({
        name: p.name,
        type: p.type,
        prompt: p.prompt,
        labels: p.labels,
        config: p.config,
      });
      console.log(
        `  ✅  ${p.name}  →  version ${result.version} (${result.labels?.join(', ') ?? 'no labels'}) [${p.prompt.length} chars]`
      );
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('already exists')) {
        console.log(`  ⚠️   ${p.name}  →  already exists (check Langfuse UI for latest version)`);
      } else {
        console.error(`  ❌  ${p.name}  →  ${err.message ?? err}`);
      }
    }
  }

  // Non-blocking: same name/label combos the app uses. Migration can succeed
  // even if verification fails (renames, label drift, compile schema mismatch).
  console.log('\n🔍 Verifying prompt fetch for app targets (non-blocking)...\n');

  const verificationTargets = prompts
    .filter((p) => p.appLabel)
    .map((p) => ({
      name: p.name,
      label: p.appLabel!,
      compileSmokeVars: p.compileSmokeVars,
    }));

  if (verificationTargets.length === 0) {
    console.log('  ℹ️  No labeled prompts configured – skipping verification.\n');
  } else {
    for (const { name, label, compileSmokeVars } of verificationTargets) {
      try {
        const fetched = await client.prompt.get(name, { label });
        let injectionInfo = '';
        if (compileSmokeVars) {
          try {
            const compiled = fetched.compile(compileSmokeVars);
            const injected = compiled.includes('KB_SMOKE');
            injectionInfo = ` injects={{context}}:${injected}`;
          } catch {
            injectionInfo =
              ' (compile smoke test skipped: variables mismatch)';
          }
        }
        console.log(
          `  ✅  ${name}  label=${label}  version=${fetched.version}${injectionInfo}`
        );
      } catch (err: any) {
        console.log(
          `  ⚠️  Non-blocking verification failed for prompt="${name}" label="${label}": ${
            err?.message ?? err
          }`
        );
      }
    }

    console.log(
      '\nℹ️  Verification is non-blocking. Migration can still succeed if some checks fail (renamed prompts/labels).\n'
    );
  }

  await client.shutdown();

  console.log('\n✨ Migration complete.\n');
  console.log('Next steps:');
  console.log(`  1. Open ${baseUrl} → Prompts to view/edit`);
  console.log('  2. Restart npm run dev — chat should stop logging prompt 404s');
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
