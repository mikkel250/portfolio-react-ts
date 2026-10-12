/**
 * Gemini and Claude reject transcripts that start with a model/assistant turn
 * or that contain consecutive turns of the same role. The chat UI stores a
 * welcome message as the first assistant turn, and callers may also repeat a
 * role. Drop leading assistant turns and merge consecutive same-role turns so
 * provider calls receive user, assistant, user, … ending on the user.
 */
export function normalizeConversationTurns(
  messages: readonly { role?: string; content?: string }[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const turns: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const message of messages) {
    const content = typeof message?.content === 'string' ? message.content : '';
    if (message?.role === 'assistant' || message?.role === 'model') {
      turns.push({ role: 'assistant', content });
    } else if (message?.role === 'user' || message?.role === undefined) {
      turns.push({ role: 'user', content });
    }
  }

  let start = 0;
  while (start < turns.length && turns[start].role === 'assistant') {
    start += 1;
  }

  const merged: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const turn of turns.slice(start)) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === turn.role) {
      prev.content = `${prev.content}\n\n${turn.content}`;
    } else {
      merged.push({ role: turn.role, content: turn.content });
    }
  }

  return merged;
}
