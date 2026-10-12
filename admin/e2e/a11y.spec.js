import { expect, findA11yViolations, open, stubGoogleSignIn, test, THEMES } from './fixtures.js';

// Every route of the admin app that exists so far.
const ADMIN_ROUTES = ['/', '/?range=custom&from=2026-01-01&to=2020-01-01', '/no/such/page'];

for (const theme of THEMES) {
  test.describe(`accessibility in the ${theme} theme`, () => {
    for (const path of ADMIN_ROUTES) {
      test(`${path} has no serious or critical violations`, async ({ page, signInAs }) => {
        await signInAs('admin');
        await open(page, path, theme);

        expect(await findA11yViolations(page)).toEqual([]);
      });
    }

    test('/login has no serious or critical violations', async ({ page }) => {
      await stubGoogleSignIn(page);
      await open(page, '/login', theme);
      await expect(page.getByText('Continue with Google')).toBeVisible();

      expect(await findA11yViolations(page)).toEqual([]);
    });

    test('the open drawer has no serious or critical violations', async ({
      page,
      signInAs,
    }, testInfo) => {
      test.skip(testInfo.project.name !== 'tablet', 'The drawer exists below 1024px only.');
      await signInAs('admin');
      await open(page, '/', theme);

      await page.getByRole('button', { name: 'Open menu' }).click();
      await expect(page.getByRole('dialog', { name: 'Adventuro Admin' })).toBeVisible();

      expect(await findA11yViolations(page)).toEqual([]);
    });
  });
}
