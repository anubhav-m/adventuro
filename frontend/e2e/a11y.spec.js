import { expect, findA11yViolations, stubGoogleSignIn, test, THEMES } from './fixtures.js';

// Every route of the customer app, with something on the page that shows it has loaded.
// `/onboarding` is checked in account.spec.js, by the one test that may use the incomplete user.
const PUBLIC_ROUTES = [
  { path: '/', ready: { role: 'heading', name: 'Choose your adventure' } },
  { path: '/v/tidetrail', ready: { role: 'heading', name: 'Curated expeditions' } },
  { path: '/tours/goa-coastal-escape', ready: { role: 'heading', name: 'Choose your package' } },
  {
    path: '/tours/goa-coastal-escape?book=goa-coastal-escape',
    ready: { role: 'button', name: 'Confirm Booking' },
  },
  { path: '/gear', ready: { role: 'heading', name: 'Gear store' } },
  { path: '/about', ready: { role: 'heading', name: 'Our story' } },
  { path: '/privacy-terms', ready: { role: 'heading', name: 'Privacy & Terms' } },
  { path: '/cancellation-refund', ready: { role: 'heading', name: 'Cancellation & Refund' } },
  { path: '/affiliate-disclosure', ready: { role: 'heading', name: 'Affiliate Disclosure' } },
  { path: '/signin', ready: { role: 'heading', name: 'Sign in to Adventuro' } },
  { path: '/no/such/page', ready: { role: 'heading', name: 'This trail isn’t on the map.' } },
];

const ACCOUNT_ROUTES = [
  { path: '/account', ready: { role: 'heading', name: 'Your account' } },
  { path: '/account/bookings', ready: { role: 'list', name: 'Bookings' } },
];

// Reduced motion makes every fade and rise instant, so nothing is measured half-drawn.
const visit = async (page, theme, { path, ready }) => {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.goto(path);
  await expect(page.getByRole(ready.role, { name: ready.name })).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
};

for (const theme of THEMES) {
  test.describe(`accessibility in the ${theme} theme`, () => {
    for (const route of PUBLIC_ROUTES) {
      test(`${route.path} has no serious or critical violations`, async ({ page }) => {
        await stubGoogleSignIn(page);
        await visit(page, theme, route);

        expect(await findA11yViolations(page)).toEqual([]);
      });
    }

    for (const route of ACCOUNT_ROUTES) {
      test(`${route.path} has no serious or critical violations`, async ({ page, signInAs }) => {
        await signInAs('customer');
        await visit(page, theme, route);

        expect(await findA11yViolations(page)).toEqual([]);
      });
    }

    test('a ticket has no serious or critical violations', async ({ page, signInAs }) => {
      await signInAs('customer');
      await visit(page, theme, ACCOUNT_ROUTES[1]);
      await page.getByRole('list', { name: 'Bookings' }).getByRole('link').first().click();
      await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();

      expect(await findA11yViolations(page)).toEqual([]);
    });

    test('the open menus and the search overlay have no serious or critical violations', async ({
      page,
    }) => {
      await visit(page, theme, PUBLIC_ROUTES[0]);

      await page.getByRole('button', { name: 'Browse verticals' }).click();
      await expect(page.getByRole('menu', { name: 'Verticals' })).toBeVisible();
      expect(await findA11yViolations(page)).toEqual([]);
      await page.keyboard.press('Escape');

      await page.keyboard.press('/');
      await page.getByRole('dialog').getByRole('searchbox').fill('goa');
      await expect(page.getByRole('dialog').getByRole('link').first()).toBeVisible();
      expect(await findA11yViolations(page)).toEqual([]);
    });
  });
}
