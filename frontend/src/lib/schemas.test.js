import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bookingSchema, FIELD_MESSAGES, newsletterSchema, profileSchema } from './schemas.js';

const messageFor = (schema, input, field) =>
  schema.safeParse(input).error?.issues.find((issue) => issue.path[0] === field)?.message;

describe('profileSchema', () => {
  it('accepts a name and an Indian mobile number, trimmed', () => {
    expect(profileSchema.parse({ name: '  Asha  ', phone: ' 9876543210 ' })).toEqual({
      name: 'Asha',
      phone: '9876543210',
    });
  });

  it.each(['', '12345', '5876543210', '98765432100', '+919876543210', '98765 43210'])(
    'rejects the phone number "%s"',
    (phone) => {
      expect(messageFor(profileSchema, { name: 'Asha', phone }, 'phone')).toBe(
        FIELD_MESSAGES.phone,
      );
    },
  );

  it('rejects an empty or over-long name', () => {
    expect(messageFor(profileSchema, { name: '   ', phone: '9876543210' }, 'name')).toBe(
      FIELD_MESSAGES.name,
    );
    expect(messageFor(profileSchema, { name: 'a'.repeat(121), phone: '9876543210' }, 'name')).toBe(
      'Keep your name under 120 characters.',
    );
  });
});

describe('newsletterSchema', () => {
  it('accepts and trims an email', () => {
    expect(newsletterSchema.parse({ email: ' reader@example.com ' })).toEqual({
      email: 'reader@example.com',
    });
  });

  it('asks for an email when empty and for a valid one otherwise', () => {
    expect(messageFor(newsletterSchema, { email: '' }, 'email')).toBe('Enter your email address.');
    expect(messageFor(newsletterSchema, { email: 'reader@' }, 'email')).toBe(FIELD_MESSAGES.email);
  });
});

describe('bookingSchema', () => {
  const booking = (changes) => ({
    tierId: 'tier-1',
    travelers: 2,
    startDate: '2026-10-12',
    ...changes,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    // 11 Oct 2026, 23:00 in India.
    vi.setSystemTime(new Date('2026-10-11T17:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts tomorrow (IST) and the day 365 days ahead', () => {
    expect(bookingSchema.safeParse(booking({ startDate: '2026-10-12' })).success).toBe(true);
    expect(bookingSchema.safeParse(booking({ startDate: '2027-10-11' })).success).toBe(true);
  });

  it.each(['2026-10-11', '2026-10-10', '2027-10-12', '', '12-10-2026'])(
    'rejects the start date "%s"',
    (startDate) => {
      expect(messageFor(bookingSchema, booking({ startDate }), 'startDate')).toBe(
        FIELD_MESSAGES.startDate,
      );
    },
  );

  it('moves the window when the IST day changes', () => {
    vi.setSystemTime(new Date('2026-10-11T18:30:00.000Z'));
    expect(bookingSchema.safeParse(booking({ startDate: '2026-10-12' })).success).toBe(false);
    expect(bookingSchema.safeParse(booking({ startDate: '2026-10-13' })).success).toBe(true);
  });

  it.each([0, 21, 1.5, Number.NaN])('rejects %s travelers', (travelers) => {
    expect(messageFor(bookingSchema, booking({ travelers }), 'travelers')).toBe(
      FIELD_MESSAGES.travelers,
    );
  });

  it('accepts 1 and 20 travelers and requires a tier', () => {
    expect(bookingSchema.safeParse(booking({ travelers: 1 })).success).toBe(true);
    expect(bookingSchema.safeParse(booking({ travelers: 20 })).success).toBe(true);
    expect(messageFor(bookingSchema, booking({ tierId: '' }), 'tierId')).toBe(
      FIELD_MESSAGES.tierId,
    );
  });
});
