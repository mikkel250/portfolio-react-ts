import { test, expect } from '@playwright/test';

test.describe('debug API risk (removed)', () => {
  test('GET /api/test-fallback returns 404', async ({ request }) => {
    const response = await request.get('/api/test-fallback?test=environment');
    expect(response.status()).toBe(404);
  });

  test('GET /api/test-langsmith returns 404', async ({ request }) => {
    const response = await request.get('/api/test-langsmith', {
      timeout: 15_000,
    });
    expect(response.status()).toBe(404);
  });
});
