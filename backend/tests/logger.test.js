import { describe, expect, it } from 'vitest';
import { createLogger } from '../src/config/logger.js';

const capture = () => {
  const lines = [];
  const logger = createLogger({
    level: 'info',
    destination: { write: (line) => lines.push(line) },
  });
  return { logger, last: () => JSON.parse(lines.at(-1)), raw: () => lines.join('') };
};

describe('logger redaction', () => {
  it('redacts cookies and authorization headers from request logs', () => {
    const { logger, last, raw } = capture();
    logger.info({
      req: {
        headers: { cookie: 'adv_session=jwt-value', authorization: 'Bearer abc', accept: '*/*' },
      },
      res: { headers: { 'set-cookie': ['adv_session=jwt-value'] } },
    });

    expect(last().req.headers).toEqual({
      cookie: '[REDACTED]',
      authorization: '[REDACTED]',
      accept: '*/*',
    });
    expect(last().res.headers['set-cookie']).toBe('[REDACTED]');
    expect(raw()).not.toContain('jwt-value');
  });

  it('redacts Google credentials and phone numbers at any logged depth', () => {
    const { logger, raw } = capture();
    logger.info({
      credential: 'google-id-token',
      phone: '9876543210',
      body: { credential: 'google-id-token', phone: '9876543210' },
      booking: { contact: { phone: '9876543210', name: 'Asha' } },
    });

    expect(raw()).not.toContain('google-id-token');
    expect(raw()).not.toContain('9876543210');
    expect(raw()).toContain('Asha');
  });

  it('honours the configured level', () => {
    const { logger, raw } = capture();
    logger.debug('hidden');
    expect(raw()).toBe('');
    logger.info('shown');
    expect(raw()).toContain('shown');
  });
});
