import { randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { crc32, deflateSync } from 'node:zlib';
import { AxeBuilder } from '@axe-core/playwright';
import { test as base, expect, request as playwrightRequest } from '@playwright/test';

// Written by the backend harness on start: { customer, incompleteCustomer, admin } session tokens.
const AUTH_FILE = new URL('../../e2e/.auth.json', import.meta.url);
const SESSION_COOKIE = 'adv_session';
const APP_URL = 'http://localhost:4174';

const readSessionTokens = async () => JSON.parse(await readFile(AUTH_FILE, 'utf8'));

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

  // signInAs('admin') puts that harness user's session cookie in the browser.
  signInAs: async ({ context, baseURL }, provide) => {
    await provide(async (name) => {
      const tokens = await readSessionTokens();
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
  // A request the app cancelled itself (a range that changed mid-flight) is not a failure.
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText === 'net::ERR_ABORTED') return;
    problems.push(`request failed: ${request.url()}`);
  });
  return problems;
};

// The first pages of a run meet a harness and a preview server that have only just started.
const FIRST_PAINT_TIMEOUT_MS = 20_000;

// Opens a path in a theme and waits until nothing on the page is still loading.
export const open = async (page, path, theme) => {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
    timeout: FIRST_PAINT_TIMEOUT_MS,
  });
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
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

// Google's script needs an authorised origin and the network; a stand-in draws the button.
export const stubGoogleSignIn = (page) =>
  page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.google = { accounts: { id: {
        initialize() {},
        renderButton(element) { element.textContent = 'Continue with Google'; },
      } } };`,
    }),
  );

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BLOCKING = ['serious', 'critical'];

// The page's serious and critical WCAG 2.1 AA violations, one line each: the rule and where.
export const findA11yViolations = async (page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  return violations
    .filter(({ impact }) => BLOCKING.includes(impact))
    .map(({ id, nodes }) => `${id}: ${nodes.map(({ target }) => target.join(' ')).join(' | ')}`);
};

// The admin API with the harness admin's session, outside any page: for setup and clean-up.
// Dispose of it when done.
export const adminApi = async () => {
  const tokens = await readSessionTokens();
  return playwrightRequest.newContext({
    baseURL: APP_URL,
    extraHTTPHeaders: {
      cookie: `${SESSION_COOKIE}=${tokens.admin}`,
      'x-forwarded-for': `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`,
    },
  });
};

const pngChunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
};

// A real PNG of one flat colour, made in memory, for the upload tests.
export const makePng = ({ width = 60, height = 40, rgb = [31, 88, 242] } = {}) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bits per channel
  header[9] = 2; // truecolour RGB
  // Each row starts with filter type 0, then one RGB triple per pixel.
  const row = Buffer.concat([
    Buffer.from([0]),
    ...Array.from({ length: width }, () => Buffer.from(rgb)),
  ]);
  const pixels = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(pixels)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};
