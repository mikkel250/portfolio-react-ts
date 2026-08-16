import { describe, expect, it } from 'vitest';
import { MISSING_IP_KEY, resolveClientIp } from '../rate-limit';

describe('resolveClientIp', () => {
  it('prefers x-real-ip over spoofed x-forwarded-for prefix', () => {
    const headers = new Headers({
      'x-real-ip': '203.0.113.50',
      'x-forwarded-for': '198.51.100.99, 203.0.113.50',
    });

    expect(resolveClientIp(headers)).toBe('203.0.113.50');
  });

  it('uses the last x-forwarded-for hop when x-real-ip is absent', () => {
    const headers = new Headers({
      'x-forwarded-for': '198.51.100.99, 203.0.113.50',
    });

    expect(resolveClientIp(headers)).toBe('203.0.113.50');
  });

  it('returns MISSING_IP_KEY when no IP headers are present', () => {
    expect(resolveClientIp(new Headers())).toBe(MISSING_IP_KEY);
  });
});
