import { describe, expect, it } from 'vitest';
import { isAllowedBrandRole, sanitizeBrandCallbackUrl } from '@/lib/portal-auth';

describe('sanitizeBrandCallbackUrl (open-redirect protection)', () => {
  it('keeps safe in-app paths', () => {
    expect(sanitizeBrandCallbackUrl('/dashboard/orders?tab=returns')).toBe('/dashboard/orders?tab=returns');
  });
  it.each([
    'https://evil.com',
    '//evil.com',
    '//evil.com/x',
    'javascript:alert(1)',
    '/login',
    '/register',
    '/api/auth/signout',
    '/',
    '',
    null,
    undefined,
  ])('falls back for unsafe input %s', (input) => {
    expect(sanitizeBrandCallbackUrl(input as string | null | undefined)).toBe('/dashboard');
  });
});

describe('isAllowedBrandRole', () => {
  it('rejects non-brand and malformed roles', () => {
    expect(isAllowedBrandRole('SUPER_ADMIN')).toBe(false);
    expect(isAllowedBrandRole('CUSTOMER')).toBe(false);
    expect(isAllowedBrandRole(undefined)).toBe(false);
    expect(isAllowedBrandRole(42)).toBe(false);
  });
  it('accepts the brand owner role', () => {
    expect(isAllowedBrandRole('BRAND_OWNER')).toBe(true);
  });
});
