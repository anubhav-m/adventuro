import { randomInt } from 'node:crypto';
import { expect, test } from '@playwright/test';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'not-found', path: '/no-such-trail' },
];
const THEMES = ['dark', 'light'];

// Fails the test on any console error, uncaught exception or failed request.
const watchForErrors = (page) => {
  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`exception: ${error.message}`));
  page.on('requestfailed', (request) => problems.push(`request failed: ${request.url()}`));
  return problems;
};

const open = async (page, path, theme) => {
  await page.emulateMedia({ colorScheme: theme });
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
};

const hasHorizontalScroll = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

for (const { name, path } of PAGES) {
  for (const theme of THEMES) {
    test(`${name} in the ${theme} theme`, async ({ page }, testInfo) => {
      const problems = watchForErrors(page);
      await open(page, path, theme);

      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
      await expect(page.getByRole('contentinfo')).toBeVisible();
      expect(await hasHorizontalScroll(page)).toBe(false);

      await page.screenshot({
        path: `e2e/screenshots/${testInfo.project.name}-${theme}-${name}.png`,
        fullPage: true,
        animations: 'disabled',
      });
      expect(problems).toEqual([]);
    });
  }
}

for (const theme of THEMES) {
  test(`logo menu in the ${theme} theme`, async ({ page }, testInfo) => {
    const problems = watchForErrors(page);
    await open(page, '/', theme);

    await page.getByRole('button', { name: 'Browse verticals and gear' }).click();
    const menu = page.getByRole('menu', { name: 'Verticals and gear' });
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: 'PeakPulse' }).hover();
    expect(await hasHorizontalScroll(page)).toBe(false);
    await page.screenshot({
      path: `e2e/screenshots/${testInfo.project.name}-${theme}-logo-menu.png`,
      animations: 'disabled',
    });

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    expect(problems).toEqual([]);
  });
}

test('the theme choice is applied before first paint on the next visit', async ({ page }) => {
  await open(page, '/', 'light');
  await page.getByRole('button', { name: 'Theme: System' }).click();
  await page.getByRole('menuitemradio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // With scripts blocked, only the inline script in index.html can have set the theme.
  await page.route('**/*.js', (route) => route.abort());
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('newsletter subscribes through the real API', async ({ page }, testInfo) => {
  const problems = watchForErrors(page);
  // The harness rate-limits subscribing per IP. A fresh address per run keeps reruns green.
  const address = `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
  await page.route('**/api/v1/newsletter', (route) =>
    route.continue({ headers: { ...route.request().headers(), 'x-forwarded-for': address } }),
  );
  await open(page, '/', 'dark');

  const email = `smoke-${testInfo.project.name}@e2e.adventuro.test`;
  await page.getByRole('textbox', { name: 'New trips and gear, by email' }).fill(email);
  await page.getByRole('button', { name: 'Subscribe' }).click();

  await expect(page.getByText("You're on the list!")).toBeVisible();
  await expect(page.locator('[data-sonner-toast][data-mounted="true"]')).toBeVisible();
  await page.screenshot({
    path: `e2e/screenshots/${testInfo.project.name}-dark-toast.png`,
    animations: 'disabled',
  });
  expect(problems).toEqual([]);
});
