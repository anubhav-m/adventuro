import { ApiError } from '../api/ApiError.js';
import { FIELD_MESSAGES } from './schemas.js';

const SERVER_FAULT = 'Something went wrong on our side. Please try again in a moment.';
const NOT_FOUND = "We couldn't find what you're looking for.";

export const NETWORK_MESSAGE =
  "We can't reach Adventuro right now. Check your connection and try again.";
export const FALLBACK_MESSAGE = "Something didn't work. Please try again.";
export const FIELD_FALLBACK_MESSAGE = 'Please check this field.';

export const ERROR_MESSAGES = Object.freeze({
  VALIDATION_ERROR: "Some details don't look right. Please check the highlighted fields.",
  INVALID_GOOGLE_TOKEN: "Google sign-in didn't go through. Please try again.",
  UNAUTHENTICATED: 'Please sign in to continue.',
  FORBIDDEN: "You don't have access to this.",
  PROFILE_INCOMPLETE: 'Add your name and phone number to continue.',
  NOT_FOUND,
  ROUTE_NOT_FOUND: NOT_FOUND,
  PHONE_TAKEN: 'This phone number is already linked to another account.',
  TOUR_UNAVAILABLE: "This trip or package isn't available right now. Please pick another.",
  RATE_LIMITED: "You're going a bit fast. Please wait a moment and try again.",
  INTERNAL_ERROR: SERVER_FAULT,
});

// The only source of error text shown to users. Never returns anything the server wrote.
export const getErrorMessage = (error) => {
  if (!(error instanceof ApiError)) return FALLBACK_MESSAGE;
  if (Object.hasOwn(ERROR_MESSAGES, error.code ?? '')) return ERROR_MESSAGES[error.code];
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
