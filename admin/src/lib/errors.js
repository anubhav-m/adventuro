import { ApiError } from '../api/ApiError.js';
import { FIELD_MESSAGES } from './schemas.js';

const SERVER_FAULT = 'Something went wrong on our side. Please try again in a moment.';
const NOT_FOUND = "We couldn't find what you're looking for.";

export const NETWORK_MESSAGE =
  "We can't reach Adventuro right now. Check your connection and try again.";
export const FALLBACK_MESSAGE = "Something didn't work. Please try again.";
export const FIELD_FALLBACK_MESSAGE = 'Please check this field.';

// The customer app's map, with the codes only an admin can receive and the admin's own
// wording for FORBIDDEN.
export const ERROR_MESSAGES = Object.freeze({
  VALIDATION_ERROR: "Some details don't look right. Please check the highlighted fields.",
  INVALID_GOOGLE_TOKEN: "Google sign-in didn't go through. Please try again.",
  UNAUTHENTICATED: 'Please sign in to continue.',
  FORBIDDEN: "This account doesn't have admin access.",
  PROFILE_INCOMPLETE: 'Add your name and phone number to continue.',
  NOT_FOUND,
  ROUTE_NOT_FOUND: NOT_FOUND,
  PHONE_TAKEN: 'This phone number is already linked to another account.',
  DUPLICATE: 'Something with this name already exists. Try a different name.',
  RESOURCE_IN_USE: "This is still being used elsewhere, so it can't be deleted.",
  INVALID_STATUS_TRANSITION: "This booking's status can't be changed that way.",
  TOUR_UNAVAILABLE: "This trip or package isn't available right now. Please pick another.",
  INVALID_FILE: 'Please upload a JPG, PNG or WebP image.',
  FILE_TOO_LARGE: 'That image is too large. The limit is 5 MB.',
  RATE_LIMITED: "You're going a bit fast. Please wait a moment and try again.",
  INTERNAL_ERROR: SERVER_FAULT,
});

// What the error was about, when that changes the wording of a code.
export const ERROR_SUBJECT = Object.freeze({ TOUR: 'tour', TAXONOMY: 'taxonomy' });

const SUBJECT_MESSAGES = Object.freeze({
  [ERROR_SUBJECT.TOUR]: Object.freeze({
    RESOURCE_IN_USE: 'This tour has bookings — unpublish it instead.',
  }),
  [ERROR_SUBJECT.TAXONOMY]: Object.freeze({
    RESOURCE_IN_USE:
      'Some gear still uses this, so it can’t be deleted. Take it off that gear first.',
  }),
});

// The only source of error text shown to users. Never returns anything the server wrote.
export const getErrorMessage = (error, { subject } = {}) => {
  if (!(error instanceof ApiError)) return FALLBACK_MESSAGE;
  const code = error.code ?? '';
  const subjectMessages = SUBJECT_MESSAGES[subject] ?? {};
  if (Object.hasOwn(subjectMessages, code)) return subjectMessages[code];
  if (Object.hasOwn(ERROR_MESSAGES, code)) return ERROR_MESSAGES[code];
  if (error.isNetworkError) return NETWORK_MESSAGE;
  if (error.status >= 500) return SERVER_FAULT;
  return FALLBACK_MESSAGE;
};

// Our wording for a field path, where a position in a list may stand for any: 'tiers.2.name'
// reads the message of 'tiers.*.name'.
const fieldMessage = (field) =>
  FIELD_MESSAGES[field] ??
  FIELD_MESSAGES[field.replace(/\.\d+(?=\.|$)/g, '.*')] ??
  FIELD_FALLBACK_MESSAGE;

// Our own message for a field the server rejected, or undefined if it did not reject that field.
export const getFieldError = (error, field) => {
  if (!(error instanceof ApiError)) return undefined;
  if (!error.fieldErrors.some((fieldError) => fieldError.field === field)) return undefined;
  return fieldMessage(field);
};

export const DUPLICATE_SLUG_MESSAGE = 'Another item already uses this slug. Try a different one.';

// Puts each field the server rejected onto the form's own field, in our wording. A DUPLICATE
// is a clash on the slug, the only unique field the editors send. Returns true when any field
// was marked.
export const applyFieldErrors = (error, setError) => {
  if (!(error instanceof ApiError)) return false;
  if (error.code === 'DUPLICATE') {
    setError('slug', { type: 'server', message: DUPLICATE_SLUG_MESSAGE });
    return true;
  }
  for (const { field } of error.fieldErrors) {
    if (field) setError(field, { type: 'server', message: fieldMessage(field) });
  }
  return error.fieldErrors.some(({ field }) => field);
};

// An error the app raises itself, for a check it makes before asking the server (an image
// that is too large, say), so its text comes from the same map.
export const clientError = (code) => new ApiError({ code });
