import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SALARY_EXPECTATION_REPLY_TEMPLATE,
  salaryExpectationReply,
} from '@/lib/input-filter';
import { CHAT_SYSTEM_PROMPT } from '../chat-prompt';
import { compileLocalTemplate, compilePrompt } from '../langfuse-prompts';

describe('compileLocalTemplate', () => {
  it('interpolates {{var}} placeholders only once each', () => {
    const template =
      'Intro {CONTEXT} then pack:\n{{context}}\nCTA {{calendly_link}} and again {{calendly_link}}';
    const out = compileLocalTemplate(template, {
      context: 'KB_BODY',
      calendly_link: 'https://cal.example/x',
    });

    expect(out).toContain('Intro {CONTEXT} then pack:');
    expect(out).toContain('KB_BODY');
    expect(out.match(/KB_BODY/g)).toHaveLength(1);
    expect(out).not.toContain('{{context}}');
    expect(out.match(/https:\/\/cal\.example\/x/g)).toHaveLength(2);
  });

  it('does not expand instructional {CONTEXT} into the knowledge pack', () => {
    const kb = 'A'.repeat(50_000);
    const out = compileLocalTemplate(CHAT_SYSTEM_PROMPT, {
      context: kb,
      calendly_link: 'https://cal.example/x',
    });

    // Pre-fix bug: 22× {CONTEXT} replacements → multi-MB prompts.
    expect(out.length).toBeLessThan(kb.length * 2);
    expect(out.split(kb)).toHaveLength(2); // one injection → two split parts
    expect(out).toContain('{CONTEXT}'); // instructional refs preserved
    expect(out).not.toContain('{{context}}');
    expect(out).not.toContain('{{calendly_link}}');
    expect(CHAT_SYSTEM_PROMPT).toContain(SALARY_EXPECTATION_REPLY_TEMPLATE);
    const salaryReply = salaryExpectationReply('https://cal.example/x');
    expect(out).toContain(salaryReply);
    expect(out).toContain(`Exact reply:\n${salaryReply}`);
    expect(out).toContain(
      'Do not include any booking link that is not already present in the exact reply.',
    );
  });
});

describe('compilePrompt local fallback', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses local templates when Langfuse keys are missing', async () => {
    vi.stubEnv('LANGFUSE_PUBLIC_KEY', '');
    vi.stubEnv('LANGFUSE_SECRET_KEY', '');

    const kb = 'knowledge-slice';
    const out = await compilePrompt('portfolio-chat-system', {
      context: kb,
      calendly_link: 'https://cal.example/y',
    });

    expect(out).toContain(kb);
    expect(out.match(/knowledge-slice/g)).toHaveLength(1);
    expect(out).toContain('https://cal.example/y');
  });
});
