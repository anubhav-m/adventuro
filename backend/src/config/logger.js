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

export const createLogger = ({ level = env.LOG_LEVEL, destination } = {}) =>
  pino({ level, redact: { paths: REDACT_PATHS, censor: '[REDACTED]' } }, destination);

export const logger = createLogger();
