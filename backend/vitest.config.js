import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    hookTimeout: 300_000,
    env: {
      NODE_ENV: 'test',
      PORT: '5000',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/adventuro-test',
      JWT_SECRET: 'test-only-secret-that-is-at-least-32-chars',
      JWT_EXPIRES_IN: '7d',
      GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
      ADMIN_EMAILS: 'admin@example.com',
      CORS_ORIGINS: 'http://localhost:5173,http://localhost:5174',
      SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      SUPABASE_BUCKET: 'test-bucket',
      LOG_LEVEL: 'silent',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/server.js', 'src/config/db.js'],
      reporter: ['text', 'text-summary'],
      thresholds: { lines: 80, branches: 80 },
    },
  },
});
