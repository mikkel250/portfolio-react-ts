/**
 * Langfuse Prompt Migration Script
 *
 * Usage:
 *   1. Set LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL
 *   2. npm run migrate:prompts -- --check   (compare production to local; no upload)
 *   3. npm run migrate:prompts
 *   4. --sync: run by the production build; uploads only when production
 *      differs from the local templates, then re-checks (fails the build if
 *      it still differs). Skipped unless VERCEL_ENV=production.
 *
 * Uploads the local chat/JD system templates (with {{context}} injection
 * slots) as Langfuse Prompt Management versions labeled `production`.
 * Subsequent runs create new versions and promote them to production.
 * `--check` compiles the production prompt and the local template with the
 * same vars and fails when they differ.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { LangfuseClient } from '@langfuse/client';
import { CHAT_SYSTEM_PROMPT } from '../app/api/lib/chat-prompt';
import { JD_ANALYSIS_SYSTEM_PROMPT } from '../app/api/lib/jd-prompt';
import {
  PROMPT_SMOKE_CALENDLY_LINK,
  PROMPT_SMOKE_CONTEXT,
  assertSalaryExactReplyCompiles,
  compiledPromptDiff,
} from '../app/api/lib/prompt-parity';

/** App-facing label used by runtime `client.prompt.get(..., { label })`. */
const APP_PROMPT_LABEL = 'production';

type MigratablePrompt = {
  name: string;
  type: 'text';
  prompt: string;
  labels: string[];
  /** Primary label the app fetches at runtime (usually production). */
  appLabel?: typeof APP_PROMPT_LABEL;
  compileSmokeVars?: Record<string, string>;
  config: { description: string };
};

async function productionMatchesLocal(
  client: LangfuseClient,
  prompts: MigratablePrompt[],
): Promise<boolean> {
  let ok = true;

  for (const p of prompts) {
    if (!p.appLabel || !p.compileSmokeVars) continue;
    try {
      const fetched = await client.prompt.get(p.name, { label: p.appLabel });
      const remote = typeof fetched.prompt === 'string' ? fetched.prompt : '';
      if (!remote) {
        ok = false;
        console.error(
          `  ❌  ${p.name}  label=${p.appLabel}  version=${fetched.version} has no text body`,
        );
        continue;
      }
      const diff = compiledPromptDiff(p.prompt, remote, p.compileSmokeVars);
      if (diff) {
        ok = false;
        console.error(
          `  ❌  ${p.name}  label=${p.appLabel}  version=${fetched.version} does not match the local template after compile\n${diff}`,
        );
      } else {
        console.log(
          `  ✅  ${p.name}  label=${p.appLabel}  version=${fetched.version} matches the local template`,
        );
      }
    } catch (err: unknown) {
      ok = false;
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `  ❌  ${p.name}  label=${p.appLabel}  fetch failed: ${message}`,
      );
    }
  }

  return ok;
}

async function main(): Promise<void> {
  try {
    assertSalaryExactReplyCompiles(CHAT_SYSTEM_PROMPT);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌  ${message}`);
    process.exitCode = 1;
    return;
  }

  // --sync runs at the end of the Vercel production build. Never from local or
  // preview builds: that would promote an unmerged prompt to `production`.
  const syncMode = process.argv.includes('--sync');
  if (syncMode && process.env.VERCEL_ENV !== 'production') {
    console.log(
      `ℹ️  Prompt sync skipped (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}; runs on production builds only).`,
    );
    return;
  }
  if (
    syncMode &&
    (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY)
  ) {
    console.warn(
      '⚠️  Prompt sync skipped: Langfuse keys are not set, so the app serves the local prompts.',
    );
    return;
  }

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
        context: PROMPT_SMOKE_CONTEXT,
        calendly_link: PROMPT_SMOKE_CALENDLY_LINK,
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
        context: PROMPT_SMOKE_CONTEXT,
        job_title: 'Engineer',
      },
      config: {
        description:
          'Job description analysis prompt (vars: context, job_title)',
      },
    },
  ];

  if (syncMode) {
    console.log(`\n🔄 Syncing prompts to Langfuse (${baseUrl})...\n`);
    if (await productionMatchesLocal(client, prompts)) {
      await client.shutdown();
      console.log('\n✨ Production prompts already match the local templates; no new version.\n');
      return;
    }
    console.log('\nProduction differs from the local templates; creating new versions.\n');
  }

  if (process.argv.includes('--check')) {
    console.log(`\n🔍 Comparing production prompts to the local templates (${baseUrl})...\n`);
    const ok = await productionMatchesLocal(client, prompts);
    await client.shutdown();
    if (!ok) {
      console.error(
        '\n❌ Production prompts do not match the local templates. Re-run npm run migrate:prompts after reviewing the diff.\n',
      );
      process.exitCode = 1;
      return;
    }
    console.log('\n✨ Production prompts match the local templates.\n');
    return;
  }

  console.log(`\n📦 Migrating ${prompts.length} prompts to Langfuse (${baseUrl})...\n`);

  const stats = { created: 0, skipped: 0, failed: 0 };

  for (const p of prompts) {
    try {
      const result = await client.prompt.create({
        name: p.name,
        type: p.type,
        prompt: p.prompt,
        labels: p.labels,
        config: p.config,
      });
      stats.created += 1;
      console.log(
        `  ✅  ${p.name}  →  version ${result.version} (${result.labels?.join(', ') ?? 'no labels'}) [${p.prompt.length} chars]`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? (err as { status: unknown }).status
          : undefined;
      if (status === 409 || message.includes('already exists')) {
        stats.skipped += 1;
        console.log(`  ⚠️   ${p.name}  →  already exists (check Langfuse UI for latest version)`);
      } else {
        stats.failed += 1;
        console.error(`  ❌  ${p.name}  →  ${message}`);
      }
    }
  }

  console.log(
    `\n📊 Summary: ${stats.created} created, ${stats.skipped} skipped (already exists), ${stats.failed} failed\n`
  );

  // Non-blocking: same name/label combos the app uses. Migration can succeed
  // even if verification fails (renames, label drift, compile schema mismatch).
  console.log('\n🔍 Verifying prompt fetch for app targets (non-blocking)...\n');

  const verificationTargets = prompts
    .filter(
      (p): p is MigratablePrompt & { appLabel: typeof APP_PROMPT_LABEL } =>
        p.appLabel != null
    )
    .map((p) => ({
      name: p.name,
      label: p.appLabel,
      compileSmokeVars: p.compileSmokeVars,
    }));

  if (verificationTargets.length === 0) {
    console.log('  ℹ️  No labeled prompts configured – skipping verification.\n');
  } else {
    for (const { name, label, compileSmokeVars } of verificationTargets) {
      try {
        const fetched = await client.prompt.get(name, { label });
        let injectionInfo = '';
        let injectOk: boolean | null = null;
        if (compileSmokeVars) {
          try {
            const compiled = fetched.compile(compileSmokeVars);
            injectOk = compiled.includes('KB_SMOKE');
            injectionInfo = ` injects={{context}}:${injectOk} (compileSmokeVars keys: ${Object.keys(compileSmokeVars).join(', ')})`;
          } catch (error) {
            const providedKeys = Object.keys(compileSmokeVars);
            // Langfuse TextPromptClient has no public `variables` field; extract
            // {{mustache}} names from the template when possible.
            const promptText =
              typeof fetched.prompt === 'string' ? fetched.prompt : '';
            const expectedFromTemplate = [
              ...new Set(
                [...promptText.matchAll(/\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g)].map(
                  (m) => m[1]
                )
              ),
            ];
            const expectedInfo =
              expectedFromTemplate.length > 0
                ? `; expected variables: ${expectedFromTemplate.join(', ')}`
                : '';
            injectionInfo =
              ` (compile smoke test skipped: prompt compile failed; provided keys: ${providedKeys.join(', ')}${expectedInfo}; error: ${error instanceof Error ? error.message : String(error)})`;
          }
        }
        if (injectOk === false) {
          console.log(
            `  ⚠️  ${name}  label=${label}  version=${fetched.version}${injectionInfo} (non-blocking: smoke token missing from compile)`
          );
        } else {
          console.log(
            `  ✅  ${name}  label=${label}  version=${fetched.version}${injectionInfo}`
          );
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(
          `  ⚠️  Non-blocking verification failed for prompt="${name}" label="${label}": ${message}`
        );
      }
    }

    console.log(
      '\nℹ️  Verification is non-blocking. Migration can still succeed if some checks fail (renamed prompts/labels).\n'
    );
  }

  // Blocking in sync mode: the build fails if production still differs after
  // the upload, so the previous deployment stays live.
  if (syncMode && stats.failed === 0 && !(await productionMatchesLocal(client, prompts))) {
    stats.failed += 1;
    console.error('❌ Production prompts still differ from the local templates after upload.');
  }

  await client.shutdown();

  if (stats.failed > 0) {
    console.error(
      `\n❌ Migration finished with ${stats.failed} prompt create failure(s).\n`
    );
    // Use exitCode (not exit) so the event loop drains after client.shutdown().
    process.exitCode = 1;
    return;
  }

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
