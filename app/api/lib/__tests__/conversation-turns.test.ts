import { describe, expect, it } from 'vitest';
import { normalizeConversationTurns } from '../conversation-turns';

describe('normalizeConversationTurns', () => {
  it('maps Gemini model role to assistant', () => {
    expect(
      normalizeConversationTurns([
        { role: 'user', content: 'Q' },
        { role: 'model', content: 'A' },
        { role: 'user', content: 'Q2' },
      ])
    ).toEqual([
      { role: 'user', content: 'Q' },
      { role: 'assistant', content: 'A' },
      { role: 'user', content: 'Q2' },
    ]);
  });

  it('drops multiple leading assistant turns (welcome + follow-up)', () => {
    expect(
      normalizeConversationTurns([
        { role: 'assistant', content: 'Welcome' },
        { role: 'assistant', content: 'How can I help?' },
        { role: 'user', content: 'Hello' },
      ])
    ).toEqual([{ role: 'user', content: 'Hello' }]);
  });

  it('treats missing role as user for provider-safe alternation', () => {
    expect(
      normalizeConversationTurns([
        { content: 'implicit user' },
        { role: 'assistant', content: 'reply' },
        { role: 'user', content: 'follow-up' },
      ])
    ).toEqual([
      { role: 'user', content: 'implicit user' },
      { role: 'assistant', content: 'reply' },
      { role: 'user', content: 'follow-up' },
    ]);
  });

  it('omits an unsupported system role', () => {
    expect(
      normalizeConversationTurns([
        { role: 'user', content: 'ok' },
        { role: 'system', content: 'hidden' },
        { role: 'assistant', content: 'reply' },
      ])
    ).toEqual([
      { role: 'user', content: 'ok' },
      { role: 'assistant', content: 'reply' },
    ]);
  });

  it('merges adjacent user turns with a double newline', () => {
    expect(
      normalizeConversationTurns([
        { role: 'user', content: 'ok' },
        { role: 'user', content: 'again' },
      ])
    ).toEqual([{ role: 'user', content: 'ok\n\nagain' }]);
  });

  it('coerces non-string content to empty strings', () => {
    expect(
      normalizeConversationTurns([
        { role: 'user', content: undefined },
        { role: 'assistant', content: 42 as unknown as string },
      ])
    ).toEqual([
      { role: 'user', content: '' },
      { role: 'assistant', content: '' },
    ]);
  });

  it('returns empty when only leading assistants remain after stripping', () => {
    expect(
      normalizeConversationTurns([{ role: 'assistant', content: 'solo welcome' }])
    ).toEqual([]);
  });
});
