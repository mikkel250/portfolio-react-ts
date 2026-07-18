import { describe, expect, it } from 'vitest';
import { filterInput, filterJobCriteria } from './input-filter';

/** Observed-style JD paste that previously false-positived on compensation. */
const JD_WITH_COMPENSATION = `This is for a role described as: The Role: Senior Full-Stack Engineer Engineers in us design, create and deploy generative AI products. You'll work across the stack on: • Developing full stack generative AI functionality • Shipping high performance UI code and backend systems that process and analyze millions of contracts reliably • Designing pipelines that orchestrate LLMs, data extraction, and clustering algorithms at scale • Collaborating with designers, lawyers and other engineers to re-imagine how lawyers work in the AI age *Compensation: The USD salary range for this role is $249K - $405K. Final offer amounts are determined by multiple factors, including, experience and expertise, and may vary from the amounts listed above. *Work culture : We have an in-office culture, with some hybrid flexibility. Mission Every major business has an in-house legal team, and all of those lawyers are overworked. 80 hour weeks, tight deadlines and contract-reading death marches are the industry norm. Up until recently, there wasn't anything technology could do to help this situation. LLMs have given us the ability to give these lawyers their lives back, and at the organization, that's our mission. We're building an AI-native platform to automate legal drudgery. People love our software - despite high competition, we have the highest trial win rate on the market (85%). We're genuinely improving people's lives, and we're only just getting started. We might be a good fit for you if you: You love writing code, but you love having impact more: We're a team of engineers at heart, but our #1 goal is building the best possible product. That means making pragmatic choices and looking for 80/20 solutions. Would describe yourself as being relentlessly resourceful. You have a strong internal sense of urgency. You have a bias towards doing things today, rather than tomorrow. Experience working in a startup environment is preferred but not required. Are excited about the adventure of building a company`;

/** Same JD without compensation section — still has contract/full-time employer copy. */
const JD_WITHOUT_COMPENSATION = `This is for a role described as: The Role: Senior Full-Stack Engineer Engineers in us design, create and deploy generative AI products. You'll work across the stack on: • Developing full stack generative AI functionality • Shipping high performance UI code and backend systems that process and analyze millions of contracts reliably • Designing pipelines that orchestrate LLMs, data extraction, and clustering algorithms at scale • Collaborating with designers, lawyers and other engineers to re-imagine how lawyers work in the AI age *Work culture : We have an in-office culture, with some hybrid flexibility. Mission Every major business has an in-house legal team, and all of those lawyers are overworked. tight deadlines and contract-reading death marches are the industry norm. Up until recently, there wasn't anything technology could do to help this situation. LLMs have given us the ability to give these lawyers their lives back, and at the organization, that's our mission. We're building an AI-native platform to automate legal drudgery. People love our software - despite high competition, we have the highest trial win rate on the market (85%). We're genuinely improving people's lives, and we're only just getting started. We might be a good fit for you if you: You love writing code, but you love having impact more: We're a team of engineers at heart, but our #1 goal is building the best possible product. That means making pragmatic choices and looking for 80/20 solutions. Would describe yourself as being relentlessly resourceful. You have a strong internal sense of urgency. You have a bias towards doing things today, rather than tomorrow. Experience working in a startup environment is preferred but not required. Are excited about the adventure of building a company`;

const FAQ_REASONS = new Set([
  'salary_query',
  'work_arrangement_query',
  'location_query',
  'work_authorization',
  'role_mismatch',
]);

describe('filterInput short-circuit router', () => {
  describe('role-share / JD false positives (AE1, AE2, AE6)', () => {
    it('AE1: JD with compensation/salary range goes to LLM, not salary canned', () => {
      const result = filterInput(JD_WITH_COMPENSATION, []);
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).not.toBe('salary_query');
      expect(FAQ_REASONS.has(result.reason ?? '')).toBe(false);
    });

    it('AE2: JD without compensation but with contract/full-time language goes to LLM', () => {
      const result = filterInput(JD_WITHOUT_COMPENSATION, []);
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).not.toBe('work_arrangement_query');
      expect(FAQ_REASONS.has(result.reason ?? '')).toBe(false);
    });

    it('AE6: long JD plus embedded terms question still goes to LLM (role-share wins)', () => {
      const mixed = `${JD_WITHOUT_COMPENSATION}\n\nWhat's his salary expectation? Can he do C2C?`;
      const result = filterInput(mixed, []);
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).not.toBe('salary_query');
      expect(result.reason).not.toBe('work_arrangement_query');
    });
  });

  describe('true-positive short FAQ asks (AE3, AE4)', () => {
    it('AE3a: short salary expectation ask is canned', () => {
      const result = filterInput("What's his salary expectation?", []);
      expect(result.shouldCallAPI).toBe(false);
      expect(result.reason).toBe('salary_query');
    });

    it('AE3a: ask-shaped compensation range question is canned', () => {
      const result = filterInput(
        'What compensation range are you looking for?',
        [],
      );
      expect(result.shouldCallAPI).toBe(false);
      expect(result.reason).toBe('salary_query');
    });

    it('AE3b: short C2C ask is canned', () => {
      const result = filterInput('Can he do C2C?', []);
      expect(result.shouldCallAPI).toBe(false);
      expect(result.reason).toBe('work_arrangement_query');
    });

    it('AE3b: open-to-contract ask is canned', () => {
      const result = filterInput('Is he open to contract work?', []);
      expect(result.shouldCallAPI).toBe(false);
      expect(result.reason).toBe('work_arrangement_query');
    });

    it('short employer blurb with bare W2 does not short-circuit', () => {
      const result = filterInput(
        'Looking for W2 only, React engineer in SF for 6 months',
        [],
      );
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).not.toBe('work_arrangement_query');
    });

    it('employer auth blurb does not short-circuit', () => {
      const result = filterInput(
        'Must be authorized to work in the US for this React role.',
        [],
      );
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).not.toBe('work_authorization');
    });

    it('employer location blurb does not short-circuit', () => {
      const result = filterInput(
        'This role is based in San Francisco with hybrid flexibility.',
        [],
      );
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).not.toBe('location_query');
    });

    it('employer C2C blurb does not short-circuit', () => {
      const result = filterInput(
        'C2C preferred. React TypeScript engagement for 6 months.',
        [],
      );
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).not.toBe('work_arrangement_query');
    });

    it('background finance question is not role_mismatch', () => {
      const result = filterInput('Does he have finance experience?', []);
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).not.toBe('role_mismatch');
    });

    it('AE4a: short greeting is canned (too_short or generic_query)', () => {
      const result = filterInput('hi', []);
      expect(result.shouldCallAPI).toBe(false);
      expect(['too_short', 'generic_query']).toContain(result.reason);
    });

    it('short greeting after a prior ? still gets canned, not valid_follow_up', () => {
      const prior =
        'What specific area would you like to explore?\n- Or paste a job description?';
      const result = filterInput('hi', [prior]);
      expect(result.shouldCallAPI).toBe(false);
      expect(result.reason).toBe('generic_query');
    });

    it('short FAQ ask bypasses too-short when under 10 chars', () => {
      const result = filterInput('C2C?', []);
      expect(result.shouldCallAPI).toBe(false);
      expect(result.reason).toBe('work_arrangement_query');
    });

    it('AE4b: greeting token inside a long JD does not force greeting canned', () => {
      const withHi = `${JD_WITHOUT_COMPENSATION} hi hello there`;
      const result = filterInput(withHi, []);
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).not.toBe('generic_query');
      expect(result.reason).not.toBe('too_short');
    });
  });

  describe('hard garbage (AE5)', () => {
    it('AE5a: short keyboard mash is canned', () => {
      const result = filterInput('asdfgqwerty', []);
      expect(result.shouldCallAPI).toBe(false);
      expect(['keyboard_mash', 'repeated_chars', 'too_short']).toContain(
        result.reason,
      );
    });

    it('AE5a: repeated chars above too-short threshold are canned', () => {
      const result = filterInput('aaaabbbbcccc', []);
      expect(result.shouldCallAPI).toBe(false);
      expect(result.reason).toBe('repeated_chars');
    });

    it('repeated-char garbage is canned even after a question follow-up context', () => {
      const result = filterInput('aaaa', ['What skills does he have?']);
      expect(result.shouldCallAPI).toBe(false);
      expect(result.reason).toBe('repeated_chars');
    });

    it('meaningful short follow-up after a question goes to LLM', () => {
      const result = filterInput('React', ['What skills does he have?']);
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).toBe('valid_follow_up');
    });

    it('short FAQ after a prior ? still gets canned, not valid_follow_up', () => {
      const prior =
        'What specific area would you like to explore?\n- Ask about his **experience**';
      const result = filterInput('C2C?', [prior]);
      expect(result.shouldCallAPI).toBe(false);
      expect(result.reason).toBe('work_arrangement_query');
    });

    it('AE5b: long JD with normal double letters is not mash', () => {
      const result = filterInput(JD_WITHOUT_COMPENSATION, []);
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).not.toBe('keyboard_mash');
      expect(result.reason).not.toBe('repeated_chars');
    });
  });

  describe('regressions from filterJobCriteria', () => {
    it('short work-auth ask is still canned when eligible', () => {
      const result = filterInput('Does he need visa sponsorship?', []);
      expect(result.shouldCallAPI).toBe(false);
      expect(result.reason).toBe('work_authorization');
    });

    it('SE-oriented short role question can proceed to LLM when not an FAQ ask', () => {
      const result = filterJobCriteria(
        'Looking for a Senior Full-Stack Engineer with React and TypeScript experience',
      );
      expect(result.shouldProceed).toBe(true);
    });

    it('technical instructor role declines even with technical SE indicators', () => {
      const result = filterJobCriteria('Hiring a technical instructor role.');
      expect(result.shouldProceed).toBe(false);
      expect(result.reason).toBe('role_mismatch');
    });

    it('background nurse skill question is not role_mismatch', () => {
      const result = filterInput('Does he have nurse experience?', []);
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).not.toBe('role_mismatch');
    });

    it('physician role opening still declines', () => {
      const result = filterJobCriteria('Hiring a physician role.');
      expect(result.shouldProceed).toBe(false);
      expect(result.reason).toBe('role_mismatch');
    });

    it('SE role opening is not role_mismatch', () => {
      const result = filterJobCriteria(
        'Hiring a Senior Full-Stack Engineer with React and TypeScript',
      );
      expect(result.shouldProceed).toBe(true);
    });

    it('asking about his role at a company is not role_mismatch', () => {
      const result = filterInput("What's his role at Intrinsic?", []);
      expect(result.shouldCallAPI).toBe(true);
      expect(result.reason).not.toBe('role_mismatch');
    });

    it('unknown non-SE opening declines without occupation blacklist', () => {
      const result = filterJobCriteria('Hiring a dental hygienist role.');
      expect(result.shouldProceed).toBe(false);
      expect(result.reason).toBe('role_mismatch');
    });
  });
});
