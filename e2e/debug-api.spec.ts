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

test.describe('removed analyze-jd route', () => {
  test('POST /api/analyze-jd returns 404', async ({ request }) => {
    const response = await request.post('/api/analyze-jd', {
      data: { jobDescription: 'Engineer', sessionId: 'session-removed' },
    });
    expect(response.status()).toBe(404);
  });
});
