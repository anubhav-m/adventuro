import { defineConfig } from '@playwright/test';

const APP_URL = 'http://localhost:4174';
const TABLET = { viewport: { width: 768, height: 1024 } };
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const OPERATIONS = /operations\.spec\.js$/;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: { baseURL: APP_URL, browserName: 'chromium' },
  // Specs that change bookings run after every other spec, so the dashboard spec never reads
  // its figures while they move.
  projects: [
    { name: 'tablet', use: TABLET, testIgnore: OPERATIONS },
    { name: 'desktop', use: DESKTOP, testIgnore: OPERATIONS },
    { name: 'tablet-ops', use: TABLET, testMatch: OPERATIONS, dependencies: ['tablet', 'desktop'] },
    {
      name: 'desktop-ops',
      use: DESKTOP,
      testMatch: OPERATIONS,
      dependencies: ['tablet', 'desktop'],
    },
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
