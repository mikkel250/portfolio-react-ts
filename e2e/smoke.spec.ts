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

    // Prefer desktop header nav (footer also links to About).
    await page
      .locator('div.hidden.lg\\:flex')
      .getByRole('link', { name: 'About' })
      .click();
    await expect(
      page.getByRole('heading', { name: /Hey! I'm.*Mikkel Ridley/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveTitle(/About \| Mikkel Ridley/);
  });

  test('nav pages render', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: 'Close chat' }).click();
    await expect(
      page.getByRole('heading', { name: /e-commerce platforms/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /NL-to-SQL Business Intelligence Platform/ }),
    ).toBeVisible();

    await page.goto('/portfolio');
    await page.getByRole('button', { name: 'Close chat' }).click();
    await expect(
      page.getByRole('heading', { name: /adaptive engineering/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'SFMOMA Ticketing' }),
    ).toBeVisible();

    await page.goto('/contributions');
    await page.getByRole('button', { name: 'Close chat' }).click();
    await expect(
      page.getByRole('heading', { name: /Open Source/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'portfolio-react-ts' }),
    ).toBeVisible();
  });

  test('resume pdf is served', async ({ request }) => {
    const response = await request.get('/Mikkel_Ridley_Resume_portfolioSite.pdf');
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type'] ?? '').toContain('pdf');
  });

  test('reopen chat after close', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Close chat' }),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Close chat' }).click();
    await page.getByRole('button', { name: 'Open AI chat assistant' }).click();

    await expect(
      page.getByRole('textbox', { name: 'Message input' }),
    ).toBeVisible();
  });
});
