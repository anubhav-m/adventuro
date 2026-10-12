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
export const ERROR_SUBJECT = Object.freeze({ TOUR: 'tour' });

const SUBJECT_MESSAGES = Object.freeze({
  [ERROR_SUBJECT.TOUR]: Object.freeze({
    RESOURCE_IN_USE: 'This tour has bookings — unpublish it instead.',
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

// Our own message for a field the server rejected, or undefined if it did not reject that field.
export const getFieldError = (error, field) => {
  if (!(error instanceof ApiError)) return undefined;
  if (!error.fieldErrors.some((fieldError) => fieldError.field === field)) return undefined;
  return FIELD_MESSAGES[field] ?? FIELD_FALLBACK_MESSAGE;
};
