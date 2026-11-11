import { defineConfig } from '@playwright/test';

// The whole system at once: the backend harness, the customer app and the admin app, each on its
// dev port. The specs follow one tour through both apps, so they run one at a time, in order.
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  timeout: 60_000,
  use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
  webServer: [
    {
      command: 'npm run e2e:server',
      cwd: './backend',
      url: 'http://localhost:5000/api/v1/health',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      cwd: './frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      cwd: './admin',
      url: 'http://localhost:5174',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
