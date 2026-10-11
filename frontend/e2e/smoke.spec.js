import {
  expect,
  hasHorizontalScroll,
  open,
  screenshot,
  test,
  THEMES,
  watchForErrors,
} from './fixtures.js';

for (const theme of THEMES) {
  test(`not-found in the ${theme} theme`, async ({ page }, testInfo) => {
    const problems = watchForErrors(page);
    await open(page, '/no-such-trail', theme);

    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);

    await screenshot(page, testInfo, `${theme}-not-found`, { fullPage: true });
    expect(problems).toEqual([]);
  });

  test(`logo menu in the ${theme} theme`, async ({ page }, testInfo) => {
    const problems = watchForErrors(page);
    await open(page, '/', theme);

    await page.getByRole('button', { name: 'Browse verticals' }).click();
    const menu = page.getByRole('menu', { name: 'Verticals' });
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: 'PeakPulse' }).hover();
    expect(await hasHorizontalScroll(page)).toBe(false);
    await screenshot(page, testInfo, `${theme}-logo-menu`);

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    expect(problems).toEqual([]);
  });
}

test('the theme choice is applied before first paint on the next visit', async ({ page }) => {
  await open(page, '/', 'light');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // With scripts blocked, only the inline script in index.html can have set the theme.
  await page.route('**/*.js', (route) => route.abort());
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('newsletter subscribes through the real API', async ({ page }, testInfo) => {
  const problems = watchForErrors(page);
  await open(page, '/', 'dark');

  const email = `smoke-${testInfo.project.name}@e2e.adventuro.test`;
  await page.getByRole('textbox', { name: 'New trips and gear, by email' }).fill(email);
  await page.getByRole('button', { name: 'Subscribe' }).click();

  await expect(page.getByText("You're on the list!")).toBeVisible();
  await expect(page.locator('[data-sonner-toast][data-mounted="true"]')).toBeVisible();
  await screenshot(page, testInfo, 'dark-toast');
  expect(problems).toEqual([]);
});
