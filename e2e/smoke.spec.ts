import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('home loads, chat hydrates, About is reachable after closing chat', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /Chat with Mikkel's AI/i }),
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText('builds things.')).toBeVisible();

    await page.getByRole('button', { name: 'Close chat' }).click();

    await page.goto('/about');
    await expect(
      page.getByRole('heading', { name: /Hey! I'm.*Mikkel Ridley/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveTitle(/About \| Mikkel Ridley/);
  });
});
