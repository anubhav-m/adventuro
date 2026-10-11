import { describe, expect, it } from 'vitest';
import { ApiError, NETWORK_ERROR } from '../api/ApiError.js';
import {
  ERROR_MESSAGES,
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
    ['FORBIDDEN', 403, "You don't have access to this."],
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
  ])('maps %s to its own text', (code, status, text) => {
    expect(getErrorMessage(new ApiError({ status, code }))).toBe(text);
  });

  it('covers exactly the codes the customer app can receive', () => {
    expect(Object.keys(ERROR_MESSAGES)).toHaveLength(11);
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
    fieldErrors: [{ field: 'phone' }, { field: 'nickname' }],
  });

  it('returns our own message for a field the server rejected', () => {
    expect(getFieldError(error, 'phone')).toBe(FIELD_MESSAGES.phone);
  });

  it('falls back for a rejected field we have no wording for', () => {
    expect(getFieldError(error, 'nickname')).toBe(FIELD_FALLBACK_MESSAGE);
    expect(FIELD_FALLBACK_MESSAGE).toBe('Please check this field.');
  });

  it('returns undefined for a field that was not rejected, or when there is no API error', () => {
    expect(getFieldError(error, 'name')).toBeUndefined();
    expect(getFieldError(null, 'phone')).toBeUndefined();
    expect(getFieldError(new Error('boom'), 'phone')).toBeUndefined();
  });
});
