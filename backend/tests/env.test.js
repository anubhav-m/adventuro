import { describe, expect, it } from 'vitest';
import { env, parseEnv } from '../src/config/env.js';

const validEnv = {
  NODE_ENV: 'production',
  PORT: '8080',
  MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.net/adventuro',
  JWT_SECRET: 'x'.repeat(32),
  GOOGLE_CLIENT_ID: 'client-id',
  ADMIN_EMAILS: ' Admin@Example.com , second@example.com,',
  CORS_ORIGINS: 'http://localhost:5173, http://localhost:5174',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  SUPABASE_BUCKET: 'images',
};

describe('env', () => {
  it('parses, coerces and normalizes a valid environment', () => {
    expect(parseEnv(validEnv)).toEqual({
      ...validEnv,
      PORT: 8080,
      JWT_EXPIRES_IN: '7d',
      LOG_LEVEL: 'info',
      ADMIN_EMAILS: ['admin@example.com', 'second@example.com'],
      CORS_ORIGINS: ['http://localhost:5173', 'http://localhost:5174'],
    });
  });

  it('applies defaults for optional values', () => {
    const { NODE_ENV: _nodeEnv, PORT: _port, ADMIN_EMAILS: _admins, ...rest } = validEnv;
    expect(parseEnv(rest)).toMatchObject({ NODE_ENV: 'development', PORT: 5000, ADMIN_EMAILS: [] });
  });

  it('rejects a JWT_SECRET shorter than 32 characters', () => {
    expect(() => parseEnv({ ...validEnv, JWT_SECRET: 'x'.repeat(31) })).toThrow(/JWT_SECRET/);
  });

  it('rejects a missing MONGODB_URI', () => {
    const { MONGODB_URI: _uri, ...rest } = validEnv;
    expect(() => parseEnv(rest)).toThrow(/MONGODB_URI/);
  });

  it.each([
    ['MONGODB_URI', 'http://not-mongo'],
    ['NODE_ENV', 'staging'],
    ['PORT', 'abc'],
    ['JWT_EXPIRES_IN', 'forever'],
    ['SUPABASE_URL', 'not-a-url'],
    ['CORS_ORIGINS', ''],
    ['LOG_LEVEL', 'loud'],
  ])('rejects an invalid %s', (key, value) => {
    expect(() => parseEnv({ ...validEnv, [key]: value })).toThrow(new RegExp(key));
  });

  it('never includes secret values in the error message', () => {
    const secret = 'short-secret';
    let message = '';
    try {
      parseEnv({ ...validEnv, JWT_SECRET: secret });
    } catch (err) {
      ({ message } = err);
    }
    expect(message).toContain('JWT_SECRET');
    expect(message).not.toContain(secret);
  });

  it('exports a deeply frozen object', () => {
    expect(Object.isFrozen(env)).toBe(true);
    expect(Object.isFrozen(env.ADMIN_EMAILS)).toBe(true);
    expect(Object.isFrozen(env.CORS_ORIGINS)).toBe(true);
    expect(() => {
      env.JWT_SECRET = 'changed';
    }).toThrow(TypeError);
    expect(env.NODE_ENV).toBe('test');
  });
});
