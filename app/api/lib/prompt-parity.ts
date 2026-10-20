import { SALARY_EXPECTATION_REPLY_TEMPLATE } from '@/lib/input-filter';
import { compileLocalTemplate } from './langfuse-prompts';

export const PROMPT_SMOKE_CONTEXT = 'KB_SMOKE';
export const PROMPT_SMOKE_CALENDLY_LINK = 'https://example.com/cal';

const SALARY_COMPILE_VARS = {
  context: PROMPT_SMOKE_CONTEXT,
  calendly_link: PROMPT_SMOKE_CALENDLY_LINK,
};

function salaryReplyWithSmokeLink(): string {
  return SALARY_EXPECTATION_REPLY_TEMPLATE.split('{{calendly_link}}').join(
    PROMPT_SMOKE_CALENDLY_LINK,
  );
}

/**
 * The local chat template must embed the shared salary reply unchanged, and
 * that reply's `{{calendly_link}}` must be the same variable the rest of the
 * prompt compiles.
 */
export function assertSalaryExactReplyCompiles(template: string): void {
  if (!template.includes(SALARY_EXPECTATION_REPLY_TEMPLATE)) {
    throw new Error(
      'Chat system prompt must embed SALARY_EXPECTATION_REPLY_TEMPLATE, including its {{calendly_link}} placeholder.',
    );
  }

  const compiled = compileLocalTemplate(template, SALARY_COMPILE_VARS);
  const reply = salaryReplyWithSmokeLink();
  if (!compiled.includes(`Exact reply:\n${reply}`)) {
    throw new Error(
      'Compiling the chat prompt did not place the sentinel Calendly URL in the salary exact reply.',
    );
  }
  if (!compiled.includes(`Reply: ${reply}`)) {
    throw new Error(
      'Compiling the chat prompt did not place the sentinel Calendly URL in the salary reply example.',
    );
  }
  if (compiled.includes('{{calendly_link}}') || compiled.includes('{{context}}')) {
    throw new Error(
      'Chat prompt still contains an uncompiled {{calendly_link}} or {{context}} placeholder.',
    );
  }
}

function formatSide(lines: string[], prefix: string): string[] {
  const cap = 40;
  const shown = lines.slice(0, cap).map((line) => `${prefix}${line}`);
  if (lines.length > cap) {
    shown.push(`${prefix}… ${lines.length - cap} more lines`);
  }
  return shown;
}

function formatLineDiff(production: string, local: string): string {
  const productionLines = production.split('\n');
  const localLines = local.split('\n');
  let start = 0;
  const productionEnd = productionLines.length;
  const localEnd = localLines.length;
  while (
    start < productionEnd &&
    start < localEnd &&
    productionLines[start] === localLines[start]
  ) {
    start += 1;
  }

  let endProduction = productionEnd - 1;
  let endLocal = localEnd - 1;
  while (
    endProduction >= start &&
    endLocal >= start &&
    productionLines[endProduction] === localLines[endLocal]
  ) {
    endProduction -= 1;
    endLocal -= 1;
  }

  const removed = productionLines.slice(start, endProduction + 1);
  const added = localLines.slice(start, endLocal + 1);
  return [
    `@@ line ${start + 1}`,
    ...formatSide(removed, '- '),
    ...formatSide(added, '+ '),
  ].join('\n');
}

/**
 * Compile both templates with the same vars. Returns a short diff when they
 * differ, with production lines prefixed `-` and local lines prefixed `+`.
 */
export function compiledPromptDiff(
  localTemplate: string,
  remoteTemplate: string,
  vars: Record<string, string>,
): string | null {
  const local = compileLocalTemplate(localTemplate, vars);
  const remote = compileLocalTemplate(remoteTemplate, vars);
  if (local === remote) return null;
  return formatLineDiff(remote, local);
}
