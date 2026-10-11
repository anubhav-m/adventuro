import { defineConfig } from '@playwright/test';

const APP_URL = 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: { baseURL: APP_URL, browserName: 'chromium' },
  projects: [
    { name: 'phone', use: { viewport: { width: 375, height: 812 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: [
    {
      command: 'npm run e2e:server',
      cwd: '../backend',
      url: 'http://localhost:5000/api/v1/health',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run build && npm run preview',
      url: APP_URL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
