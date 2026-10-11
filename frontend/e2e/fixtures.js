import { randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { AxeBuilder } from '@axe-core/playwright';
import { test as base, expect } from '@playwright/test';

// Written by the backend harness on start: { customer, incompleteCustomer, admin } session tokens.
const AUTH_FILE = new URL('../../e2e/.auth.json', import.meta.url);
const SESSION_COOKIE = 'adv_session';

export const THEMES = ['dark', 'light'];

const DEMO_PHOTO_HOST = 'https://picsum.photos';
const SHADES = ['#6f8f8c', '#a98f6a', '#7f879c', '#8a7f72', '#6d8a76', '#9a7b84'];

const demoPhoto = (url) => {
  const shade = SHADES[[...url].reduce((sum, char) => sum + char.charCodeAt(0), 0) % SHADES.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="${shade}"/><path d="M0 620 320 380l220 170 240-260 420 330v180H0Z" fill="#00000033"/></svg>`;
};

export const test = base.extend({
  // The harness rate-limits per IP. A fresh address per test keeps long runs and reruns green.
  page: async ({ page }, provide) => {
    const address = `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
    await page.route('**/api/v1/**', (route) =>
      route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': address } }),
    );
    // The demo content's photos live on a placeholder host. Answering for it here keeps the
    // suite fast and independent of the network: each photo is a flat block of its own shade.
    await page.route(`${DEMO_PHOTO_HOST}/**`, (route) =>
      route.fulfill({ contentType: 'image/svg+xml', body: demoPhoto(route.request().url()) }),
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
  // A request the app cancelled itself (a list whose filters changed mid-flight) is not a failure.
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText === 'net::ERR_ABORTED') return;
    problems.push(`request failed: ${request.url()}`);
  });
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

// The IST calendar date `daysAhead` from now, as a date input takes it.
export const dateAhead = (daysAhead) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
    Date.now() + daysAhead * 24 * 60 * 60 * 1000,
  );
