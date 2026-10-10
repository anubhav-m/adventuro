import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import { NewsletterSubscriber } from '../src/models/NewsletterSubscriber.js';
import { User } from '../src/models/User.js';
import { AppError } from '../src/utils/AppError.js';
import { createUser } from './helpers/factories.js';

// Builds a one-route app whose handler rejects with whatever `produce` throws or returns.
const respondTo = (produce, handler = errorHandler) => {
  const app = express();
  app.get('/boom', async () => {
    throw await produce();
  });
  app.use(handler);
  return request(app).get('/boom');
};

const namedError = (name, extra = {}) =>
  Object.assign(new Error(`${name} internals`), { name, ...extra });

describe('errorHandler', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('AppError → as thrown', async () => {
    const res = await respondTo(() => new AppError(409, 'TOUR_UNAVAILABLE', 'Tour unavailable'));
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      message: 'Tour unavailable',
      code: 'TOUR_UNAVAILABLE',
    });
  });

  it('AppError with field errors keeps them', async () => {
    const errors = [{ field: 'startDate', message: 'Out of range' }];
    const res = await respondTo(() => new AppError(400, 'VALIDATION_ERROR', 'Invalid', errors));
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(errors);
  });

  it('ZodError → 400 VALIDATION_ERROR with field paths', async () => {
    const schema = z.object({ contact: z.object({ phone: z.string() }), travelers: z.number() });
    const res = await respondTo(() => schema.safeParse({ contact: {}, travelers: 'two' }).error);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
    expect(res.body.errors).toEqual([
      { field: 'contact.phone', message: expect.any(String) },
      { field: 'travelers', message: expect.any(String) },
    ]);
  });

  it('ZodError for unknown nested keys names each key', async () => {
    const schema = z.object({ contact: z.object({}).strict() });
    const res = await respondTo(() => schema.safeParse({ contact: { role: 'admin' } }).error);
    expect(res.body.errors).toEqual([{ field: 'contact.role', message: 'Unknown field' }]);
  });

  it('Mongoose ValidationError → 400 VALIDATION_ERROR', async () => {
    const res = await respondTo(() => new User({ phone: '123', role: 'root' }).validate());
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.map(({ field }) => field).sort()).toEqual([
      'email',
      'googleId',
      'phone',
      'role',
    ]);
  });

  it('Mongoose ValidationError hides cast internals', async () => {
    const res = await respondTo(() =>
      new User({ googleId: 'g', email: 'a@b.co', lastLoginAt: 'not-a-date' }).validate(),
    );
    expect(res.body.errors).toEqual([{ field: 'lastLoginAt', message: 'Invalid value' }]);
  });

  it('Mongoose CastError → 400 VALIDATION_ERROR', async () => {
    const res = await respondTo(() => User.findById('not-an-object-id'));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: [{ field: '_id', message: 'Invalid value' }],
    });
  });

  it('duplicate key on phone → 409 PHONE_TAKEN', async () => {
    const res = await respondTo(async () => {
      await createUser({ phone: '9876543210' });
      return createUser({ phone: '9876543210' });
    });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      message: 'Phone number already in use',
      code: 'PHONE_TAKEN',
    });
  });

  it('duplicate key on another field → 409 DUPLICATE', async () => {
    const res = await respondTo(async () => {
      await NewsletterSubscriber.create({ email: 'dup@example.com' });
      return NewsletterSubscriber.create({ email: 'dup@example.com' });
    });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      message: 'Resource already exists',
      code: 'DUPLICATE',
    });
  });

  it.each(['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'])(
    '%s → 401 UNAUTHENTICATED and clears the session cookie',
    async (name) => {
      const res = await respondTo(() => namedError(name));
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHENTICATED',
      });
      const [cookie] = res.headers['set-cookie'];
      expect(cookie).toMatch(/^adv_session=;/);
      expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);
    },
  );

  it('Multer LIMIT_FILE_SIZE → 413 FILE_TOO_LARGE', async () => {
    const res = await respondTo(() => namedError('MulterError', { code: 'LIMIT_FILE_SIZE' }));
    expect(res.status).toBe(413);
    expect(res.body).toEqual({
      success: false,
      message: 'File is too large',
      code: 'FILE_TOO_LARGE',
    });
  });

  it('malformed JSON (entity.parse.failed) → 400 VALIDATION_ERROR', async () => {
    const app = express();
    app.use(express.json());
    app.use(errorHandler);
    const res = await request(app).post('/').set('Content-Type', 'application/json').send('{"a":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Malformed JSON body',
      code: 'VALIDATION_ERROR',
    });
  });

  it('unknown error → 500 INTERNAL_ERROR with a generic message and no stack', async () => {
    const res = await respondTo(() => new Error('db password is hunter2'));
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: 'Something went wrong',
      code: 'INTERNAL_ERROR',
    });
  });

  it('other Multer errors are not reported as a size problem', async () => {
    const res = await respondTo(() => namedError('MulterError', { code: 'LIMIT_UNEXPECTED_FILE' }));
    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });

  it('production mode never leaks the stack or internal message', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const { errorHandler: productionHandler } = await import('../src/middlewares/errorHandler.js');

    const res = await respondTo(() => new Error('SELECT secret FROM internals'), productionHandler);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: 'Something went wrong',
      code: 'INTERNAL_ERROR',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/secret|internals|stack|\.js/);
  });

  it('production mode marks the cleared session cookie Secure', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const { errorHandler: productionHandler } = await import('../src/middlewares/errorHandler.js');

    const res = await respondTo(() => namedError('TokenExpiredError'), productionHandler);
    expect(res.headers['set-cookie'][0]).toMatch(/Secure/);
  });

  it('development mode includes the stack to aid debugging', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.resetModules();
    const { errorHandler: developmentHandler } = await import('../src/middlewares/errorHandler.js');

    const res = await respondTo(() => new Error('boom'), developmentHandler);
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Something went wrong');
    expect(res.body.stack).toContain('Error: boom');
  });
});
