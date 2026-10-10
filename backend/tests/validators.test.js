import { describe, expect, it } from 'vitest';
import { dateOnly, httpsUrl, objectId, pagination, phone, slug } from '../src/validators/common.js';

const accepts = (schema, value) => schema.safeParse(value).success;

describe('validators/common', () => {
  it('objectId accepts 24 hex chars only', () => {
    expect(accepts(objectId, '64b7f0c2a1d3e4f5a6b7c8d9')).toBe(true);
    expect(accepts(objectId, '64B7F0C2A1D3E4F5A6B7C8D9')).toBe(true);
    expect(accepts(objectId, '64b7f0c2a1d3e4f5a6b7c8d')).toBe(false);
    expect(accepts(objectId, 'zzb7f0c2a1d3e4f5a6b7c8d9')).toBe(false);
    expect(accepts(objectId, { $ne: null })).toBe(false);
  });

  it('slug normalizes case and rejects malformed slugs', () => {
    expect(slug.parse('  Goa-Coastal-Escape ')).toBe('goa-coastal-escape');
    expect(accepts(slug, 'goa--escape')).toBe(false);
    expect(accepts(slug, '-goa')).toBe(false);
    expect(accepts(slug, 'goa escape')).toBe(false);
    expect(accepts(slug, '')).toBe(false);
    expect(accepts(slug, 'a'.repeat(121))).toBe(false);
  });

  it('phone accepts 10-digit Indian mobiles starting 6–9', () => {
    expect(phone.parse(' 9876543210 ')).toBe('9876543210');
    expect(accepts(phone, '6000000000')).toBe(true);
    expect(accepts(phone, '5876543210')).toBe(false);
    expect(accepts(phone, '987654321')).toBe(false);
    expect(accepts(phone, '+919876543210')).toBe(false);
    expect(accepts(phone, 9876543210)).toBe(false);
  });

  it('pagination coerces query strings and applies defaults', () => {
    expect(pagination.parse({})).toEqual({ page: 1, limit: 12 });
    expect(pagination.parse({ page: '3', limit: '50' })).toEqual({ page: 3, limit: 50 });
  });

  it.each([{ limit: '51' }, { limit: '0' }, { page: '0' }, { page: '1.5' }, { page: 'abc' }])(
    'pagination rejects %o',
    (query) => {
      expect(accepts(pagination, query)).toBe(false);
    },
  );

  it('dateOnly accepts real calendar dates in YYYY-MM-DD', () => {
    expect(accepts(dateOnly, '2026-10-10')).toBe(true);
    expect(accepts(dateOnly, '2026-02-30')).toBe(false);
    expect(accepts(dateOnly, '10/10/2026')).toBe(false);
    expect(accepts(dateOnly, '2026-10-10T10:00:00Z')).toBe(false);
  });

  it('httpsUrl accepts https URLs only', () => {
    expect(accepts(httpsUrl, 'https://example.com/product?id=1')).toBe(true);
    expect(accepts(httpsUrl, 'http://example.com/product')).toBe(false);
    expect(accepts(httpsUrl, 'javascript:alert(1)')).toBe(false);
    expect(accepts(httpsUrl, 'ftp://example.com')).toBe(false);
    expect(accepts(httpsUrl, 'example.com')).toBe(false);
    expect(accepts(httpsUrl, `https://example.com/${'a'.repeat(2048)}`)).toBe(false);
  });
});
