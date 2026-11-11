import { randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect } from '@playwright/test';

export const CUSTOMER_APP = 'http://localhost:5173';
export const ADMIN_APP = 'http://localhost:5174';

// Written by the backend harness on start: { customer, incompleteCustomer, admin } session tokens.
const AUTH_FILE = new URL('./.auth.json', import.meta.url);
// Each app has its own session cookie; this browser is signed in to both.
const SESSION_COOKIES = ['adv_session', 'adv_admin_session'];
const DEMO_PHOTO_HOST = 'https://picsum.photos';
const AFFILIATE_HOST = 'https://example.com';

const randomAddress = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;

// A browser signed in as one harness user ('customer' | 'admin') in both apps. Its own address keeps it clear of the harness's per-IP limits; the demo photos and the
// affiliate shops are answered here so the run does not depend on the network.
export const signedInContext = async (browser, user) => {
  const tokens = JSON.parse(await readFile(AUTH_FILE, 'utf8'));
  const context = await browser.newContext({
    extraHTTPHeaders: { 'x-forwarded-for': randomAddress() },
  });
  await context.addCookies(
    SESSION_COOKIES.map((name) => ({ name, value: tokens[user], domain: 'localhost', path: '/' })),
  );
  await context.route(`${DEMO_PHOTO_HOST}/**`, (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#8a7f72"/></svg>',
    }),
  );
  await context.route(`${AFFILIATE_HOST}/**`, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>Shop</title><h1>Shop</h1>' }),
  );
  return context;
};

// Opens a path and waits until the page has its heading and nothing is still loading.
export const open = async (page, url) => {
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
};

// The admin dashboard's figures for the default range, read with the page's own session.
export const fetchDashboard = async (page) => {
  const response = await page.request.get(`${ADMIN_APP}/api/v1/admin/dashboard`, {
    headers: { 'x-adventuro-app': 'admin' },
  });
  expect(response.status()).toBe(200);
  return (await response.json()).data;
};

export const toast = (page, text) => page.locator('[data-sonner-toast]', { hasText: text });

// The IST calendar date `daysAhead` from now, as a date input takes it.
export const dateAhead = (daysAhead) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
    Date.now() + daysAhead * 24 * 60 * 60 * 1000,
  );

export const rupees = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
