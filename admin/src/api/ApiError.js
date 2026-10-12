export const NETWORK_ERROR = 'NETWORK_ERROR';

// The server's own message is deliberately not kept: lib/errors.js decides what users read.
export class ApiError extends Error {
  constructor({ status = 0, code = null, fieldErrors = [] } = {}) {
    super(code ?? 'API_ERROR');
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  get isNetworkError() {
    return this.code === NETWORK_ERROR;
  }
}

// What the app raises itself when a signed-in account turns out not to be an admin.
export const forbiddenError = () => new ApiError({ status: 403, code: 'FORBIDDEN' });
