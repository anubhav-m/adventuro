import { expect, hasHorizontalScroll, open, screenshot, test, watchForErrors } from './fixtures.js';

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
  // Google's script needs an authorised origin and the network; a stand-in draws the button.
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.google = { accounts: { id: {
        initialize() {},
        renderButton(element) { element.textContent = 'Continue with Google'; },
      } } };`,
    }),
  );
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

  test('an incomplete profile is sent to onboarding, and completing it reaches the account page', async ({
    page,
    signInAs,
  }, testInfo) => {
    const problems = watchForErrors(page);
    await signInAs('incompleteCustomer');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/account');

    await expect(page).toHaveURL('/onboarding?next=%2Faccount');
    await expect(page.getByRole('heading', { level: 1, name: 'One last step' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveValue('Ira Incomplete');
    await screenshot(page, testInfo, 'dark-onboarding', { fullPage: true });

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
    await expect(page).toHaveURL('/account');
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
