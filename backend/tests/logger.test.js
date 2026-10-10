import express from 'express';
import { pinoHttp } from 'pino-http';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createLogger, serializeRequest } from '../src/config/logger.js';

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

describe('request logs', () => {
  it('log the path without the query string, so search terms never reach the logs', async () => {
    const { logger, last, raw } = capture();
    const probe = express();
    probe.use(pinoHttp({ logger, serializers: { req: serializeRequest } }));
    probe.get('/api/v1/admin/users', (_req, res) => res.json({ success: true, message: 'OK' }));

    await request(probe).get('/api/v1/admin/users?q=9811122233&role=user');

    expect(last().req).toMatchObject({ method: 'GET', url: '/api/v1/admin/users' });
    expect(last().req).not.toHaveProperty('query');
    expect(raw()).not.toContain('9811122233');
  });
});
