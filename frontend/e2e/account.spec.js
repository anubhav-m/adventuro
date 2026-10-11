import {
  dateAhead,
  expect,
  findA11yViolations,
  hasHorizontalScroll,
  open,
  screenshot,
  stubGoogleSignIn,
  test,
  watchForErrors,
} from './fixtures.js';

const appliedTheme = (page) => page.locator('html');

test('the account menu shows the signed-in customer', async ({ page, signInAs }, testInfo) => {
  const problems = watchForErrors(page);
  await signInAs('customer');
  await open(page, '/', 'dark');

  const navbar = page.getByRole('navigation', { name: 'Main' });
  await expect(navbar.getByRole('link', { name: 'Sign in' })).toHaveCount(0);
  await navbar.getByRole('button', { name: 'Account' }).click();

  const menu = page.getByRole('menu', { name: 'Account' });
  const panel = menu.locator('..');
  await expect(panel).toContainText('Asha Customer');
  await expect(panel).toContainText('customer@e2e.adventuro.test');
  await expect(panel).toContainText('+91 9876543210');
  await expect(panel.getByText(/^[0-9a-f]{24}$/)).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'My Bookings' })).toHaveAttribute(
    'href',
    '/account/bookings',
  );
  await expect(menu.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute('href', '/account');
  await expect(menu.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
  await screenshot(page, testInfo, 'dark-account-menu');
  expect(problems).toEqual([]);
});

test('a signed-out visitor to the account page is sent to sign in', async ({ page }, testInfo) => {
  await stubGoogleSignIn(page);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/account');

  await expect(page).toHaveURL('/signin?next=%2Faccount');
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to Adventuro' })).toBeVisible();
  await expect(page.getByText('Continue with Google')).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
  await screenshot(page, testInfo, 'light-signin', { fullPage: true });
});

// These change the harness's users, so they run once, in order, on a fresh harness.
test.describe('account changes', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(({ viewport }) => viewport.width < 1024, 'Changes shared harness data: desktop only');

  // The harness has one incomplete user and a profile is completed once, so this is the only
  // test that may use them: the guard, onboarding, and the booking that waited for it.
  test('an incomplete profile is sent to onboarding, and completing it finishes the booking that was waiting', async ({
    page,
    signInAs,
  }, testInfo) => {
    const problems = watchForErrors(page);
    const startDate = dateAhead(60);
    await signInAs('incompleteCustomer');
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/account');

    await expect(page).toHaveURL('/onboarding?next=%2Faccount');
    await expect(page.getByRole('heading', { level: 1, name: 'One last step' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveValue('Ira Incomplete');
    await screenshot(page, testInfo, 'dark-onboarding', { fullPage: true });
    expect(await findA11yViolations(page)).toEqual([]);
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await findA11yViolations(page)).toEqual([]);

    await page.goto('/tours/goa-coastal-escape');
    await page.getByRole('link', { name: 'Book this trip' }).filter({ visible: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Book this trip' });
    await dialog.getByRole('radio', { name: /Explorer/ }).check();
    await dialog.getByRole('button', { name: 'More travelers' }).click();
    await dialog.getByLabel('Start date').fill(startDate);
    await dialog.getByRole('button', { name: 'Confirm Booking' }).click();

    await expect(page).toHaveURL(
      /\/onboarding\?next=%2Ftours%2Fgoa-coastal-escape%3Fbook%3Dgoa-coastal-escape/,
    );
    await page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(page.getByRole('alert')).toHaveText(
      'Enter a 10-digit Indian mobile number, without +91.',
    );

    await page.getByRole('textbox', { name: 'Mobile number' }).fill('9876543210');
    await page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(page.getByRole('alert')).toHaveText(
      'This phone number is already linked to another account.',
    );

    await page.getByRole('textbox', { name: 'Mobile number' }).fill('9123456780');
    await page.getByRole('button', { name: 'Save and continue' }).click();

    // Back on the tour, with the booking as it was left.
    await expect(page).toHaveURL(/\/tours\/goa-coastal-escape\?book=goa-coastal-escape/);
    await expect(dialog.getByRole('radio', { name: /Explorer/ })).toBeChecked();
    await expect(dialog.getByRole('group', { name: 'travelers' }).getByRole('status')).toHaveText(
      '2',
    );
    await expect(dialog.getByLabel('Start date')).toHaveValue(startDate);
    await dialog.getByRole('button', { name: 'Confirm Booking' }).click();

    await expect(page).toHaveURL(/\/bookings\/ADV-TT-\d{4}-\d{6}$/);
    const ticket = page.getByRole('article');
    await expect(ticket).toContainText('Ira Incomplete');
    await expect(ticket).toContainText('+91 9123456780');
    await expect(ticket).toContainText('Explorer');

    await page.goto('/account');
    await expect(page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Mobile number' })).toHaveValue('9123456780');
    await screenshot(page, testInfo, 'dark-account', { fullPage: true });
    // The one console error is the browser reporting the 409 the test asked for.
    expect(problems).toEqual([expect.stringContaining('409')]);
  });

  test('a theme chosen while signed in is saved to the account and survives a reload', async ({
    page,
    signInAs,
  }, testInfo) => {
    await signInAs('customer');
    await open(page, '/account', 'light');
    await expect(appliedTheme(page)).toHaveAttribute('data-theme', 'light');

    const saved = page.waitForResponse(
      (response) => response.url().endsWith('/users/me') && response.ok(),
    );
    await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Dark' }).click();
    await saved;
    await expect(appliedTheme(page)).toHaveAttribute('data-theme', 'dark');
    await screenshot(page, testInfo, 'dark-account-theme', { fullPage: true });

    // Without the local copy, only the server's value can bring the theme back.
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await expect(appliedTheme(page)).toHaveAttribute('data-theme', 'dark');
    await expect(
      page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Dark' }),
    ).toHaveAttribute('aria-pressed', 'true');

    const reset = page.waitForResponse(
      (response) => response.url().endsWith('/users/me') && response.ok(),
    );
    await page
      .getByRole('group', { name: 'Theme' })
      .getByRole('button', { name: 'System' })
      .click();
    await reset;
    await expect(appliedTheme(page)).toHaveAttribute('data-theme', 'light');
  });
});
