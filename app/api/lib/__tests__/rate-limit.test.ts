import { describe, expect, it } from 'vitest';
import { MISSING_IP_KEY, resolveClientIp } from '../rate-limit';

describe('resolveClientIp', () => {
  it('prefers x-vercel-forwarded-for over x-real-ip and x-forwarded-for', () => {
    const headers = new Headers({
      'x-vercel-forwarded-for': '203.0.113.10, 10.0.0.8',
      'x-real-ip': '203.0.113.50',
      'x-forwarded-for': '198.51.100.99, 203.0.113.50',
    });

    expect(resolveClientIp(headers)).toBe('203.0.113.10');
  });

  it('prefers x-real-ip over a spoofed x-forwarded-for prefix', () => {
    const headers = new Headers({
      'x-real-ip': '203.0.113.50',
      'x-forwarded-for': '198.51.100.99, 203.0.113.50',
    });

    expect(resolveClientIp(headers)).toBe('203.0.113.50');
  });

  it('uses the first x-forwarded-for address, which is the client', () => {
    const headers = new Headers({
      'x-forwarded-for': '198.51.100.99, 203.0.113.50',
    });

    expect(resolveClientIp(headers)).toBe('198.51.100.99');
  });

  it('falls through a whitespace-only x-real-ip to x-forwarded-for', () => {
    const headers = new Headers({
      'x-real-ip': '   ',
      'x-forwarded-for': '203.0.113.50',
    });

    expect(resolveClientIp(headers)).toBe('203.0.113.50');
  });

  it('returns MISSING_IP_KEY for whitespace-only x-real-ip with no other address', () => {
    const headers = new Headers({
      'x-real-ip': '   ',
    });

    expect(resolveClientIp(headers)).toBe(MISSING_IP_KEY);
  });

  it('returns MISSING_IP_KEY for a comma-only x-forwarded-for', () => {
    const headers = new Headers({
      'x-forwarded-for': ', ',
    });

    expect(resolveClientIp(headers)).toBe(MISSING_IP_KEY);
    expect(resolveClientIp(headers)).not.toBe('');
  });

  it('keeps the client address when x-forwarded-for has a trailing comma', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.50, ',
    });

    expect(resolveClientIp(headers)).toBe('203.0.113.50');
    expect(resolveClientIp(headers)).not.toBe('');
  });

  it('returns MISSING_IP_KEY when no IP headers are present', () => {
    expect(resolveClientIp(new Headers())).toBe(MISSING_IP_KEY);
  });
});
