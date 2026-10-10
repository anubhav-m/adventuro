import { z } from 'zod';

const csvList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\/.+/, 'must be a MongoDB connection string'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'must look like 30m, 12h or 7d')
    .default('7d'),
  GOOGLE_CLIENT_ID: z.string().min(1),
  ADMIN_EMAILS: z
    .string()
    .default('')
    .transform((value) => csvList(value.toLowerCase())),
  CORS_ORIGINS: z.string().min(1).transform(csvList),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_BUCKET: z.string().min(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export const parseEnv = (source) => {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  const { ADMIN_EMAILS, CORS_ORIGINS, ...rest } = result.data;
  return Object.freeze({
    ...rest,
    ADMIN_EMAILS: Object.freeze(ADMIN_EMAILS),
    CORS_ORIGINS: Object.freeze(CORS_ORIGINS),
  });
};

export const env = parseEnv(process.env);
