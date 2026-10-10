import { pino } from 'pino';
import { env } from './env.js';

const REDACT_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  'authorization',
  'credential',
  '*.credential',
  'phone',
  '*.phone',
  '*.*.phone',
];

// Query strings are left out of request logs: an admin search term can be a customer's
// phone number or email address.
export const serializeRequest = ({ query: _query, url, ...request }) => ({
  ...request,
  url: url.split('?')[0],
});

export const createLogger = ({ level = env.LOG_LEVEL, destination } = {}) =>
  pino({ level, redact: { paths: REDACT_PATHS, censor: '[REDACTED]' } }, destination);

export const logger = createLogger();
