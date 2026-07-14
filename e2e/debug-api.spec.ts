import { test, expect } from '@playwright/test';

test.describe('debug API risk (unauthenticated)', () => {
  test('GET /api/test-fallback?test=environment is publicly reachable', async ({
    request,
  }) => {
    const response = await request.get('/api/test-fallback?test=environment');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.environment).toBeDefined();
    expect(typeof body.environment.hasOpenAIKey).toBe('boolean');
    expect(typeof body.environment.hasGoogleKey).toBe('boolean');
    expect(typeof body.environment.hasAnthropicKey).toBe('boolean');
  });

  test('GET /api/test-langsmith is reachable without auth', async ({
    request,
  }) => {
    const response = await request.get('/api/test-langsmith');

    expect(response.status()).not.toBe(401);
    expect(response.status()).not.toBe(403);

    const body = await response.json();
    expect(body).toHaveProperty('success');
  });
});
