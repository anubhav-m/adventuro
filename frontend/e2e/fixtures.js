import { randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';

// Written by the backend harness on start: { customer, incompleteCustomer, admin } session tokens.
const AUTH_FILE = new URL('../../e2e/.auth.json', import.meta.url);
const SESSION_COOKIE = 'adv_session';

export const THEMES = ['dark', 'light'];

export const test = base.extend({
  // The harness rate-limits per IP. A fresh address per test keeps long runs and reruns green.
  page: async ({ page }, provide) => {
    const address = `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
    await page.route('**/api/v1/**', (route) =>
      route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': address } }),
    );
    await provide(page);
  },

  // signInAs('customer') puts that harness user's session cookie in the browser.
  signInAs: async ({ context, baseURL }, provide) => {
    await provide(async (name) => {
      const tokens = JSON.parse(await readFile(AUTH_FILE, 'utf8'));
      await context.addCookies([{ name: SESSION_COOKIE, value: tokens[name], url: baseURL }]);
    });
  },
});

export { expect };

// By contract GET /auth/me answers 401 to a signed-out visitor, and the browser itself logs
// every 4xx response as a console error. That one line is expected; nothing else is.
const isSignedOutSessionCheck = (message) =>
  message.location().url.endsWith('/api/v1/auth/me') && message.text().includes('401');

// Collects every console error, uncaught exception and failed request on the page.
export const watchForErrors = (page) => {
  const problems = [];
  page.on('console', (message) => {
    if (message.type() !== 'error' || isSignedOutSessionCheck(message)) return;
    problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`exception: ${error.message}`));
  page.on('requestfailed', (request) => problems.push(`request failed: ${request.url()}`));
  return problems;
};

export const open = async (page, path, theme) => {
  await page.emulateMedia({ colorScheme: theme });
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

export const hasHorizontalScroll = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

export const screenshot = (page, testInfo, name, options) =>
  page.screenshot({
    path: `e2e/screenshots/${testInfo.project.name}-${name}.png`,
    animations: 'disabled',
    ...options,
  });
