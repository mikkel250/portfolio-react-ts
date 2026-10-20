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

  test('stubbed 503 rolls back the message and retry sends again', async ({
    page,
  }) => {
    let chatHits = 0;
    const errorText = 'AI service error. Please try again.';

    await page.route('**/api/chat', async (route) => {
      chatHits += 1;
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: errorText }),
      });
    });

    await page.goto('/');

    const input = page.getByRole('textbox', { name: 'Message input' });
    await expect(input).toBeVisible({ timeout: 15_000 });

    await input.fill(FILTER_PASSING_MESSAGE);
    await page.getByRole('button', { name: 'Send message' }).click();

    const alert = page.getByRole('alert').filter({ hasText: errorText });
    await expect(alert).toContainText(errorText);
    await expect(
      page
        .getByRole('article', { name: 'Your message' })
        .filter({ hasText: FILTER_PASSING_MESSAGE }),
    ).toHaveCount(0);
    await expect(input).toHaveValue(FILTER_PASSING_MESSAGE);
    expect(chatHits).toBe(1);

    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(alert).toBeHidden();
    await expect.poll(() => chatHits).toBe(2);
    await expect(alert).toContainText(errorText);
    await expect(input).toHaveValue(FILTER_PASSING_MESSAGE);
  });

  test('non-JSON 504 rolls the message back and retry sends again', async ({
    page,
  }) => {
    let chatHits = 0;
    let releaseSecond: (() => void) | undefined;
    // Chromium's JSON parser message. The route never returns 504; a platform
    // timeout is HTML, so response.json() throws before response.ok is checked.
    const errorText = `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`;

    await page.route('**/api/chat', async (route) => {
      chatHits += 1;
      if (chatHits > 1) {
        await new Promise<void>((resolve) => {
          releaseSecond = resolve;
        });
      }
      await route.fulfill({
        status: 504,
        contentType: 'text/html',
        body: '<!DOCTYPE html><title>504</title>',
      });
    });

    await page.goto('/');

    const input = page.getByRole('textbox', { name: 'Message input' });
    await expect(input).toBeVisible({ timeout: 15_000 });

    await input.fill(FILTER_PASSING_MESSAGE);
    await page.getByRole('button', { name: 'Send message' }).click();

    const alert = page.getByRole('alert').filter({ hasText: errorText });
    await expect(alert).toContainText(errorText);
    await expect(
      page
        .getByRole('article', { name: 'Your message' })
        .filter({ hasText: FILTER_PASSING_MESSAGE }),
    ).toHaveCount(0);
    await expect(input).toHaveValue(FILTER_PASSING_MESSAGE);
    expect(chatHits).toBe(1);

    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(alert).toBeHidden();
    await expect.poll(() => chatHits).toBe(2);
    releaseSecond?.();
    await expect(alert).toContainText(errorText);
    await expect(input).toHaveValue(FILTER_PASSING_MESSAGE);
  });

  test('a dropped network request rolls the message back and retry sends again', async ({
    page,
  }) => {
    let chatHits = 0;
    let releaseSecond: (() => void) | undefined;
    const errorText = 'Failed to fetch';

    await page.route('**/api/chat', async (route) => {
      chatHits += 1;
      if (chatHits > 1) {
        await new Promise<void>((resolve) => {
          releaseSecond = resolve;
        });
      }
      await route.abort('failed');
    });

    await page.goto('/');

    const input = page.getByRole('textbox', { name: 'Message input' });
    await expect(input).toBeVisible({ timeout: 15_000 });

    await input.fill(FILTER_PASSING_MESSAGE);
    await page.getByRole('button', { name: 'Send message' }).click();

    const alert = page.getByRole('alert').filter({ hasText: errorText });
    await expect(alert).toContainText(errorText);
    await expect(
      page
        .getByRole('article', { name: 'Your message' })
        .filter({ hasText: FILTER_PASSING_MESSAGE }),
    ).toHaveCount(0);
    await expect(input).toHaveValue(FILTER_PASSING_MESSAGE);
    expect(chatHits).toBe(1);

    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(alert).toBeHidden();
    await expect.poll(() => chatHits).toBe(2);
    releaseSecond?.();
    await expect(alert).toContainText(errorText);
    await expect(input).toHaveValue(FILTER_PASSING_MESSAGE);
  });
});
