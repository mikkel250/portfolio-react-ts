/**
 * Langfuse experiment runner — complements LangSmith guardrail tests.
 *
 * Runs an experiment via Langfuse SDK (inline dataset → traces + scores in Langfuse UI).
 * Requires LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY. Optionally seeds a Langfuse dataset
 * when LANGFUSE_SEED_DATASET=true.
 *
 * Usage: `npx tsx tests/langfuse-evaluation.ts`
 * Requires dev server: `npm run dev` (chat API must be reachable).
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { LangfuseClient } from '@langfuse/client';
import fetch from 'node-fetch';

const DATASET_NAME = 'portfolio-chat-guardrails';

/** Subset of cases — mirror structure from langsmith-guardrails-evaluation.ts */
const evaluationCases = [
  {
    name: 'experience_query_5_years',
    query: 'How many years of React experience does Mikkel have?',
  },
  {
    name: 'meta_awareness_ai_query',
    query: 'Has Mikkel built AI assistants?',
  },
  {
    name: 'simple_experience_query',
    query: "What's Mikkel's experience with Next.js?",
  },
];

async function callChatAPI(query: string): Promise<string> {
  const API_URL = process.env.CHAT_API_URL || 'http://localhost:3000/api/chat';
  const sessionId = `lf-eval-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: query }],
      sessionId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as { content?: string };
  return data.content || '';
}

async function seedDataset(client: LangfuseClient): Promise<void> {
  console.log(`Creating / updating dataset "${DATASET_NAME}" in Langfuse...`);

  await client.api.datasets
    .create({
      name: DATASET_NAME,
      description: 'Portfolio chat guardrail smoke cases (from langfuse-evaluation.ts)',
    })
    .catch(() => {
      /* dataset may already exist */
    });

  for (const c of evaluationCases) {
    await client.api.datasetItems.create({
      datasetName: DATASET_NAME,
      input: c.query,
      metadata: { caseName: c.name },
    });
  }

  console.log(`Added ${evaluationCases.length} items to dataset "${DATASET_NAME}".`);
}

async function main(): Promise<void> {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    console.error(
      'Missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY. Set them in .env.local.'
    );
    process.exit(1);
  }

  const langfuse = new LangfuseClient({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
  });

  if (process.env.LANGFUSE_SEED_DATASET === 'true') {
    await seedDataset(langfuse);
  }

  const calendly =
    process.env.NEXT_PUBLIC_CALENDLY_LINK ||
    process.env.CANDIDATE_CALENDLY ||
    '';

  const experimentData = evaluationCases.map((c) => ({
    input: c.query,
    metadata: { caseName: c.name },
  }));

  console.log('Running Langfuse experiment against live chat API...\n');

  const result = await langfuse.experiment.run({
    name: 'portfolio-chat-guardrails-smoke',
    description:
      'Smoke test: Calendly presence heuristic (full guardrails live in LangSmith suite).',
    runName: `guardrails-${new Date().toISOString().slice(0, 19)}`,
    data: experimentData,
    maxConcurrency: 2,
    task: async ({ input }) => {
      const query = typeof input === 'string' ? input : String(input);
      return callChatAPI(query);
    },
    evaluators: [
      async ({ output, metadata }) => {
        const text = typeof output === 'string' ? output : String(output);
        const hasCalendly =
          !!calendly && text.includes(calendly);
        return {
          name: 'includes_calendly',
          value: hasCalendly ? 1 : 0,
          comment:
            (metadata as { caseName?: string })?.caseName ?? undefined,
        };
      },
    ],
    runEvaluators: [
      async ({ itemResults }) => {
        const scores = itemResults.flatMap((r) =>
          r.evaluations.filter((e) => e.name === 'includes_calendly')
        );
        const avg =
          scores.length === 0
            ? 0
            : scores.reduce((a, s) => a + Number(s.value ?? 0), 0) /
              scores.length;
        return {
          name: 'avg_calendly_score',
          value: avg,
          comment: 'Fraction of responses containing the configured Calendly URL',
        };
      },
    ],
  });

  console.log(await result.format({ includeItemResults: true }));
  await langfuse.shutdown();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
