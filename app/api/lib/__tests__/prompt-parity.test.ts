import { describe, expect, it } from 'vitest';
import { SALARY_EXPECTATION_REPLY_TEMPLATE } from '@/lib/input-filter';
import { CHAT_SYSTEM_PROMPT } from '../chat-prompt';
import {
  PROMPT_SMOKE_CALENDLY_LINK,
  assertSalaryExactReplyCompiles,
  compiledPromptDiff,
} from '../prompt-parity';

describe('assertSalaryExactReplyCompiles', () => {
  it('accepts the local chat prompt', () => {
    expect(() => assertSalaryExactReplyCompiles(CHAT_SYSTEM_PROMPT)).not.toThrow();
  });

  it('rejects a prompt that dropped the shared template', () => {
    const baked = CHAT_SYSTEM_PROMPT.split(SALARY_EXPECTATION_REPLY_TEMPLATE).join(
      'Compensation is discussed later.',
    );
    expect(() => assertSalaryExactReplyCompiles(baked)).toThrow(
      /SALARY_EXPECTATION_REPLY_TEMPLATE/,
    );
  });
});

describe('compiledPromptDiff', () => {
  const vars = { calendly_link: PROMPT_SMOKE_CALENDLY_LINK };

  it('matches when both templates compile the same way', () => {
    const template = `Exact reply:\n${SALARY_EXPECTATION_REPLY_TEMPLATE}`;
    expect(compiledPromptDiff(template, template, vars)).toBeNull();
  });

  it('reports an inserted line without flagging the unchanged tail', () => {
    const diff = compiledPromptDiff('a\nb\nc', 'a\nc', {});
    expect(diff).toContain('+ b');
    expect(diff).not.toContain('+ c');
    expect(diff).not.toContain('- c');
  });

  it('shows a baked production URL against the local placeholder', () => {
    const local = `Exact reply:\n${SALARY_EXPECTATION_REPLY_TEMPLATE}`;
    const remote = local
      .split('{{calendly_link}}')
      .join('https://old.example/booked');
    const diff = compiledPromptDiff(local, remote, vars);

    expect(diff).toContain('-');
    expect(diff).toContain('https://old.example/booked');
    expect(diff).toContain(PROMPT_SMOKE_CALENDLY_LINK);
  });
});
