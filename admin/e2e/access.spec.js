import {
  expect,
  findA11yViolations,
  hasHorizontalScroll,
  open,
  screenshot,
  stubGoogleSignIn,
  test,
  THEMES,
  watchForErrors,
} from './fixtures.js';

const NO_ACCESS = "This account doesn't have admin access.";

test.beforeEach(async ({ page }) => {
  await stubGoogleSignIn(page);
});

for (const theme of THEMES) {
  test(`a customer is kicked to login with the no-access message, ${theme} theme`, async ({
    page,
    signInAs,
  }, testInfo) => {
    const problems = watchForErrors(page);
    await signInAs('customer');
    const dashboardRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/admin/')) dashboardRequests.push(request.url());
    });

    await open(page, '/', theme);

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveText(NO_ACCESS);
    await expect(page.getByText('Continue with Google')).toBeVisible();
    // The layout was never shown, and nothing was asked of the admin API.
    await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
    expect(dashboardRequests).toEqual([]);
    expect(await hasHorizontalScroll(page)).toBe(false);
    expect(await findA11yViolations(page)).toEqual([]);

    await screenshot(page, testInfo, `${theme}-login-denied`);
    expect(problems).toEqual([]);
  });
}

test('the customer’s session is ended, so a reload stays on login', async ({ page, signInAs }) => {
  await signInAs('customer');
  await open(page, '/', 'dark');
  await expect(page.getByRole('alert')).toHaveText(NO_ACCESS);

  const session = await page.request.get('/api/v1/auth/me');
  expect(session.status()).toBe(401);

  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
});

test('the admin API refuses a customer whatever the app does', async ({ page, signInAs }) => {
  await signInAs('customer');
  const response = await page.request.get('/api/v1/admin/dashboard');

  expect(response.status()).toBe(403);
  expect((await response.json()).code).toBe('FORBIDDEN');
});

test('a signed-out visitor is sent to login from any path, without a message', async ({
  page,
}, testInfo) => {
  const problems = watchForErrors(page);
  await open(page, '/tours/new', 'dark');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page).toHaveTitle('Sign in · Adventuro Admin');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await screenshot(page, testInfo, 'dark-login');
  expect(problems).toEqual([]);
});

test('an admin who opens login is sent to the dashboard, and can sign out', async ({
  page,
  signInAs,
}) => {
  const problems = watchForErrors(page);
  await signInAs('admin');
  await open(page, '/login', 'dark');
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('the app asks search engines not to index it', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});
