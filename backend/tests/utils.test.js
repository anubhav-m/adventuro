import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { AppError } from '../src/utils/AppError.js';
import { clearAuthCookie, durationToMs, setAuthCookie } from '../src/utils/cookies.js';
import {
  addDays,
  formatDateOnly,
  getIstToday,
  getIstTomorrow,
  getMaxStartDate,
  isBookableStartDate,
  parseDateOnly,
} from '../src/utils/dates.js';
import { escapeRegex } from '../src/utils/escapeRegex.js';
import { buildPaginationMeta, parsePagination } from '../src/utils/pagination.js';
import { slugify } from '../src/utils/slugify.js';

// IST is UTC+05:30, so the IST day rolls over at 18:30 UTC.
const BEFORE_IST_MIDNIGHT = new Date('2026-10-10T18:29:59.999Z');
const AT_IST_MIDNIGHT = new Date('2026-10-10T18:30:00.000Z');

describe('dates', () => {
  it('parses a valid date-only string to 00:00 UTC', () => {
    expect(parseDateOnly('2026-10-10').toISOString()).toBe('2026-10-10T00:00:00.000Z');
  });

  it.each(['2026-02-30', '2026-13-01', '2026-1-1', '10-10-2026', '2026-10-10T00:00', '', null, 5])(
    'rejects invalid date-only value %s',
    (value) => {
      expect(parseDateOnly(value)).toBeNull();
    },
  );

  it('accepts Feb 29 only in leap years', () => {
    expect(parseDateOnly('2028-02-29')).not.toBeNull();
    expect(parseDateOnly('2027-02-29')).toBeNull();
  });

  it('formats and adds days', () => {
    const date = parseDateOnly('2026-12-31');
    expect(formatDateOnly(addDays(date, 1))).toBe('2027-01-01');
  });

  it('resolves "today" in IST on both sides of IST midnight', () => {
    expect(formatDateOnly(getIstToday(BEFORE_IST_MIDNIGHT))).toBe('2026-10-10');
    expect(formatDateOnly(getIstToday(AT_IST_MIDNIGHT))).toBe('2026-10-11');
  });

  it('resolves IST tomorrow and the +365 day bound', () => {
    expect(formatDateOnly(getIstTomorrow(BEFORE_IST_MIDNIGHT))).toBe('2026-10-11');
    expect(formatDateOnly(getIstTomorrow(AT_IST_MIDNIGHT))).toBe('2026-10-12');
    expect(formatDateOnly(getMaxStartDate(BEFORE_IST_MIDNIGHT))).toBe('2027-10-10');
  });

  it('defaults to the current time', () => {
    expect(getIstTomorrow().getTime() - getIstToday().getTime()).toBe(86_400_000);
    expect(isBookableStartDate(getIstTomorrow())).toBe(true);
    expect(getMaxStartDate() > getIstTomorrow()).toBe(true);
  });

  it.each([
    ['2026-10-10', false, 'today'],
    ['2026-10-09', false, 'yesterday'],
    ['2026-10-11', true, 'tomorrow'],
    ['2027-10-10', true, '+365 days'],
    ['2027-10-11', false, '+366 days'],
  ])('isBookableStartDate(%s) is %s (%s)', (value, expected) => {
    expect(isBookableStartDate(parseDateOnly(value), BEFORE_IST_MIDNIGHT)).toBe(expected);
  });

  it('shifts the bookable window once IST midnight passes', () => {
    expect(isBookableStartDate(parseDateOnly('2026-10-11'), AT_IST_MIDNIGHT)).toBe(false);
    expect(isBookableStartDate(parseDateOnly('2027-10-11'), AT_IST_MIDNIGHT)).toBe(true);
  });
});

describe('pagination', () => {
  it('applies defaults', () => {
    expect(parsePagination()).toEqual({ page: 1, limit: 12, skip: 0 });
    expect(parsePagination({})).toEqual({ page: 1, limit: 12, skip: 0 });
  });

  it('computes skip from page and limit', () => {
    expect(parsePagination({ page: 3, limit: 20 })).toEqual({ page: 3, limit: 20, skip: 40 });
    expect(parsePagination({ page: '2', limit: '5' })).toEqual({ page: 2, limit: 5, skip: 5 });
  });

  it('caps the limit at 50 and falls back on bad input', () => {
    expect(parsePagination({ limit: 500 }).limit).toBe(50);
    expect(parsePagination({ page: 0, limit: -4 })).toEqual({ page: 1, limit: 12, skip: 0 });
    expect(parsePagination({ page: 'abc', limit: 'xyz' })).toEqual({ page: 1, limit: 12, skip: 0 });
  });

  it('builds meta', () => {
    expect(buildPaginationMeta({ page: 2, limit: 12, total: 25 })).toEqual({
      page: 2,
      limit: 12,
      total: 25,
      totalPages: 3,
    });
    expect(buildPaginationMeta({ page: 1, limit: 12, total: 0 }).totalPages).toBe(0);
    expect(buildPaginationMeta({ page: 1, limit: 12, total: 12 }).totalPages).toBe(1);
  });
});

describe('escapeRegex', () => {
  it('escapes every regex metacharacter', () => {
    expect(escapeRegex('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it.each(['.*', '(', 'a+b', '[goa', 'price$', 'back\\slash'])(
    'makes %s match only itself literally',
    (input) => {
      const regex = new RegExp(escapeRegex(input), 'i');
      expect(regex.test(input)).toBe(true);
      expect(regex.test('zzz')).toBe(false);
    },
  );

  it('leaves plain text untouched', () => {
    expect(escapeRegex('Goa beach 2026')).toBe('Goa beach 2026');
  });
});

describe('slugify', () => {
  it.each([
    ['Goa Coastal Escape', 'goa-coastal-escape'],
    ['  Andaman & Nicobar  ', 'andaman-and-nicobar'],
    ['Tropical/Beach', 'tropical-beach'],
    ['High Altitude/Snow', 'high-altitude-snow'],
    ['Café Délhi!!', 'cafe-delhi'],
    ['--Already--Slugged--', 'already-slugged'],
    ['!!!', ''],
    [2026, '2026'],
  ])('slugify(%s) → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('caps length without leaving a trailing dash', () => {
    const slug = slugify(`${'a'.repeat(119)} bcd`);
    expect(slug).toBe('a'.repeat(119));
  });
});

describe('cookies.durationToMs', () => {
  it.each([
    ['45s', 45_000],
    ['30m', 1_800_000],
    ['12h', 43_200_000],
    ['7d', 604_800_000],
  ])('%s → %d ms', (input, expected) => {
    expect(durationToMs(input)).toBe(expected);
  });
});

describe('auth cookie helpers', () => {
  const cookieApp = express();
  cookieApp.get('/set', (_req, res) => setAuthCookie(res, 'signed.jwt.value').end());
  cookieApp.get('/clear', (_req, res) => clearAuthCookie(res).end());

  it('sets adv_session with the session flags and a maxAge matching JWT_EXPIRES_IN', async () => {
    const res = await request(cookieApp).get('/set');
    const [cookie] = res.headers['set-cookie'];
    expect(cookie).toMatch(/^adv_session=signed\.jwt\.value;/);
    expect(cookie).toMatch(/Max-Age=604800;/);
    expect(cookie).toMatch(/Path=\/;/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).not.toMatch(/Secure/);
  });

  it('clears adv_session with matching attributes', async () => {
    const res = await request(cookieApp).get('/clear');
    const [cookie] = res.headers['set-cookie'];
    expect(cookie).toMatch(/^adv_session=;/);
    expect(cookie).toMatch(/Path=\/;/);
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});

describe('AppError', () => {
  it('carries status, code, message and field errors', () => {
    const errors = [{ field: 'phone', message: 'Invalid' }];
    const err = new AppError(400, 'VALIDATION_ERROR', 'Validation failed', errors);
    expect(err).toBeInstanceOf(Error);
    expect(err).toMatchObject({
      name: 'AppError',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors,
    });
  });
});
