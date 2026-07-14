import { test, expect } from '@playwright/test';

const STUB_REPLY = 'MVTS stub reply';
/** Must pass lib/input-filter.ts (length > 10, not greeting/generic). */
const FILTER_PASSING_MESSAGE =
  "What TypeScript and React work has Mikkel done recently?";

test.describe('chat', () => {
  test('stubbed happy path shows assistant reply', async ({ page }) => {
    let chatHits = 0;

    await page.route('**/api/chat', async (route) => {
      chatHits += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: STUB_REPLY,
          remaining: 10,
          model: 'stub',
        }),
      });
    });

    await page.goto('/');

    const input = page.getByRole('textbox', { name: 'Message input' });
    await expect(input).toBeVisible({ timeout: 15_000 });

    await input.fill(FILTER_PASSING_MESSAGE);
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(
      page
        .getByRole('article', { name: 'Assistant message' })
        .filter({ hasText: STUB_REPLY }),
    ).toBeVisible();
    expect(chatHits).toBeGreaterThan(0);
  });

  test('generic query is filtered and never hits /api/chat', async ({
    page,
  }) => {
    let chatHits = 0;

    await page.route('**/api/chat', async (route) => {
      chatHits += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: 'should-not-appear',
          remaining: 10,
          model: 'stub',
        }),
      });
    });

    await page.goto('/');

    const input = page.getByRole('textbox', { name: 'Message input' });
    await expect(input).toBeVisible({ timeout: 15_000 });

    // "hi" is treated as a follow-up when the welcome message contains "?".
    // Use a length>10 generic pattern that still skips the API.
    await input.fill('tell me about');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(
      page
        .getByRole('article', { name: 'Assistant message' })
        .filter({ hasText: 'Mikkel is a software engineer' }),
    ).toBeVisible();
    expect(chatHits).toBe(0);
  });
});
