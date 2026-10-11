import { describe, expect, it } from 'vitest';
import { getSignedInPath, readNext, safeNext, withNext } from './next.js';

describe('safeNext', () => {
  it.each(['/account', '/account/bookings?page=2', '/tours/goa#book', '/'])(
    'keeps the in-app path %s',
    (path) => {
      expect(safeNext(path)).toBe(path);
    },
  );

  it.each([
    ['another site', 'https://evil.example/account'],
    ['a protocol-relative URL', '//evil.example'],
    ['a backslash URL', '/\\evil.example'],
    ['a relative path', 'account'],
    ['a script URL', 'javascript:alert(1)'],
    ['nothing', ''],
    ['a missing value', null],
    ['a non-string', 42],
  ])('rejects %s', (_label, value) => {
    expect(safeNext(value)).toBeNull();
  });
});

describe('readNext', () => {
  it('reads a safe next from the query string and ignores an unsafe or missing one', () => {
    expect(readNext(new URLSearchParams('next=%2Faccount%3Ftab%3Dtheme'))).toBe(
      '/account?tab=theme',
    );
    expect(readNext(new URLSearchParams('next=https%3A%2F%2Fevil.example'))).toBeNull();
    expect(readNext(new URLSearchParams(''))).toBeNull();
  });
});

describe('withNext', () => {
  it('adds an encoded next, and leaves the path alone when there is none', () => {
    expect(withNext('/signin', '/account?tab=theme')).toBe('/signin?next=%2Faccount%3Ftab%3Dtheme');
    expect(withNext('/signin', null)).toBe('/signin');
    expect(readNext(new URL(withNext('/signin', '/a?b=c&d=e'), 'http://x').searchParams)).toBe(
      '/a?b=c&d=e',
    );
  });
});

describe('getSignedInPath', () => {
  it('sends an incomplete profile to onboarding, carrying next along', () => {
    expect(getSignedInPath({ profileComplete: false }, '/account')).toBe(
      '/onboarding?next=%2Faccount',
    );
    expect(getSignedInPath({ profileComplete: false }, null)).toBe('/onboarding');
  });

  it('sends a complete profile to next, or home', () => {
    expect(getSignedInPath({ profileComplete: true }, '/account')).toBe('/account');
    expect(getSignedInPath({ profileComplete: true }, null)).toBe('/');
  });
});
