import { describe, expect, it, vi } from 'vitest';
import { ApiError, forbiddenError, NETWORK_ERROR } from '../api/ApiError.js';
import {
  applyFieldErrors,
  clientError,
  DUPLICATE_SLUG_MESSAGE,
  ERROR_MESSAGES,
  ERROR_SUBJECT,
  FALLBACK_MESSAGE,
  FIELD_FALLBACK_MESSAGE,
  getErrorMessage,
  getFieldError,
  NETWORK_MESSAGE,
} from './errors.js';
import { FIELD_MESSAGES } from './schemas.js';

const SERVER_FAULT = 'Something went wrong on our side. Please try again in a moment.';

describe('getErrorMessage', () => {
  it.each([
    [
      'VALIDATION_ERROR',
      400,
      "Some details don't look right. Please check the highlighted fields.",
    ],
    ['INVALID_GOOGLE_TOKEN', 401, "Google sign-in didn't go through. Please try again."],
    ['UNAUTHENTICATED', 401, 'Please sign in to continue.'],
    ['PROFILE_INCOMPLETE', 403, 'Add your name and phone number to continue.'],
    ['NOT_FOUND', 404, "We couldn't find what you're looking for."],
    ['ROUTE_NOT_FOUND', 404, "We couldn't find what you're looking for."],
    ['PHONE_TAKEN', 409, 'This phone number is already linked to another account.'],
    [
      'TOUR_UNAVAILABLE',
      409,
      "This trip or package isn't available right now. Please pick another.",
    ],
    ['RATE_LIMITED', 429, "You're going a bit fast. Please wait a moment and try again."],
    ['INTERNAL_ERROR', 500, SERVER_FAULT],
  ])('maps %s to the same text as the customer app', (code, status, text) => {
    expect(getErrorMessage(new ApiError({ status, code }))).toBe(text);
  });

  it.each([
    ['DUPLICATE', 409, 'Something with this name already exists. Try a different name.'],
    ['RESOURCE_IN_USE', 409, "This is still being used elsewhere, so it can't be deleted."],
    ['INVALID_STATUS_TRANSITION', 409, "This booking's status can't be changed that way."],
    ['INVALID_FILE', 400, 'Please upload a JPG, PNG or WebP image.'],
    ['FILE_TOO_LARGE', 413, 'That image is too large. The limit is 5 MB.'],
    ['FORBIDDEN', 403, "This account doesn't have admin access."],
  ])('maps the admin code %s to its own text', (code, status, text) => {
    expect(getErrorMessage(new ApiError({ status, code }))).toBe(text);
  });

  it('covers every code of the shared contract', () => {
    expect(Object.keys(ERROR_MESSAGES)).toHaveLength(16);
  });

  it('words a tour that cannot be deleted in its own way', () => {
    const inUse = new ApiError({ status: 409, code: 'RESOURCE_IN_USE' });

    expect(getErrorMessage(inUse, { subject: ERROR_SUBJECT.TOUR })).toBe(
      'This tour has bookings — unpublish it instead.',
    );
    expect(getErrorMessage(inUse, { subject: 'toString' })).toBe(ERROR_MESSAGES.RESOURCE_IN_USE);
    expect(
      getErrorMessage(new ApiError({ status: 409, code: 'DUPLICATE' }), {
        subject: ERROR_SUBJECT.TOUR,
      }),
    ).toBe(ERROR_MESSAGES.DUPLICATE);
  });

  it('gives the error the app raises for a non-admin the FORBIDDEN text', () => {
    expect(getErrorMessage(forbiddenError())).toBe(ERROR_MESSAGES.FORBIDDEN);
  });

  it('explains a network failure', () => {
    expect(getErrorMessage(new ApiError({ code: NETWORK_ERROR }))).toBe(NETWORK_MESSAGE);
    expect(NETWORK_MESSAGE).toBe(
      "We can't reach Adventuro right now. Check your connection and try again.",
    );
  });

  it('treats any 5xx without a known code as a fault on our side', () => {
    expect(getErrorMessage(new ApiError({ status: 502 }))).toBe(SERVER_FAULT);
    expect(getErrorMessage(new ApiError({ status: 503, code: 'SOMETHING_NEW' }))).toBe(
      SERVER_FAULT,
    );
  });

  it('falls back for an unknown code, a non-API error, and nothing at all', () => {
    expect(getErrorMessage(new ApiError({ status: 418, code: 'TEAPOT' }))).toBe(FALLBACK_MESSAGE);
    expect(getErrorMessage(new Error('Cannot read properties of undefined'))).toBe(
      FALLBACK_MESSAGE,
    );
    expect(getErrorMessage(null)).toBe(FALLBACK_MESSAGE);
    expect(FALLBACK_MESSAGE).toBe("Something didn't work. Please try again.");
  });

  it('is not fooled by a code that names an Object.prototype member', () => {
    expect(getErrorMessage(new ApiError({ status: 400, code: 'toString' }))).toBe(FALLBACK_MESSAGE);
  });
});

describe('getFieldError', () => {
  const error = new ApiError({
    status: 400,
    code: 'VALIDATION_ERROR',
    fieldErrors: [{ field: 'from' }, { field: 'nickname' }],
  });

  it('returns our own message for a field the server rejected', () => {
    expect(getFieldError(error, 'from')).toBe(FIELD_MESSAGES.from);
  });

  it('falls back for a rejected field we have no wording for', () => {
    expect(getFieldError(error, 'nickname')).toBe(FIELD_FALLBACK_MESSAGE);
    expect(FIELD_FALLBACK_MESSAGE).toBe('Please check this field.');
  });

  it('returns undefined for a field that was not rejected, or when there is no API error', () => {
    expect(getFieldError(error, 'to')).toBeUndefined();
    expect(getFieldError(null, 'from')).toBeUndefined();
    expect(getFieldError(new Error('boom'), 'from')).toBeUndefined();
  });
});

describe('getFieldError with list positions', () => {
  it('reads the wording of any position in a list', () => {
    const error = new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      fieldErrors: [{ field: 'tiers.3.name' }, { field: 'gallery.0' }],
    });

    expect(getFieldError(error, 'tiers.3.name')).toBe(FIELD_MESSAGES['tiers.*.name']);
    expect(getFieldError(error, 'gallery.0')).toBe(FIELD_MESSAGES['gallery.*']);
  });
});

describe('applyFieldErrors', () => {
  it('puts every rejected field on the form, in our words', () => {
    const setError = vi.fn();
    const error = new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      fieldErrors: [
        { field: 'reporting.time' },
        { field: 'tiers.1.pricePerPerson' },
        { field: '' },
      ],
    });

    expect(applyFieldErrors(error, setError)).toBe(true);
    expect(setError.mock.calls).toEqual([
      ['reporting.time', { type: 'server', message: FIELD_MESSAGES['reporting.time'] }],
      [
        'tiers.1.pricePerPerson',
        { type: 'server', message: FIELD_MESSAGES['tiers.*.pricePerPerson'] },
      ],
    ]);
  });

  it('marks the slug on a DUPLICATE', () => {
    const setError = vi.fn();

    expect(applyFieldErrors(new ApiError({ status: 409, code: 'DUPLICATE' }), setError)).toBe(true);
    expect(setError).toHaveBeenCalledWith('slug', {
      type: 'server',
      message: DUPLICATE_SLUG_MESSAGE,
    });
  });

  it('marks nothing for an error without fields, or one that is not from the API', () => {
    const setError = vi.fn();

    expect(applyFieldErrors(new ApiError({ status: 500, code: 'INTERNAL_ERROR' }), setError)).toBe(
      false,
    );
    expect(applyFieldErrors(new Error('boom'), setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});

describe('clientError and subjects', () => {
  it('words a check the app makes itself like the server code it stands for', () => {
    expect(getErrorMessage(clientError('FILE_TOO_LARGE'))).toBe(ERROR_MESSAGES.FILE_TOO_LARGE);
  });

  it('words RESOURCE_IN_USE for a taxonomy', () => {
    expect(
      getErrorMessage(new ApiError({ status: 409, code: 'RESOURCE_IN_USE' }), {
        subject: ERROR_SUBJECT.TAXONOMY,
      }),
    ).toBe('Some gear still uses this, so it can’t be deleted. Take it off that gear first.');
  });
});
