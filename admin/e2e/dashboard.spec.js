import {
  expect,
  hasHorizontalScroll,
  open,
  screenshot,
  test,
  THEMES,
  watchForErrors,
} from './fixtures.js';

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const count = new Intl.NumberFormat('en-IN');

// The same figures the page shows, asked of the API with the browser's own session.
const fetchDashboard = async (page, query = '') => {
  const response = await page.request.get(`/api/v1/admin/dashboard${query}`);
  expect(response.status()).toBe(200);
  return (await response.json()).data;
};

const stat = (page, label) =>
  page.locator('p', { hasText: new RegExp(`^${label}$`) }).locator('..');
const tableRows = (page, name) => page.getByRole('table', { name }).locator('tbody tr');

test.beforeEach(async ({ signInAs }) => {
  await signInAs('admin');
});

for (const theme of THEMES) {
  test(`dashboard in the ${theme} theme`, async ({ page }, testInfo) => {
    const problems = watchForErrors(page);
    await open(page, '/', theme);

    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(page).toHaveTitle('Dashboard · Adventuro Admin');
    await expect(page.getByText('Aditya Admin')).toBeVisible();
    // Every chart has been drawn, not just framed.
    await expect(page.locator('.recharts-surface')).toHaveCount(5);
    expect(await hasHorizontalScroll(page)).toBe(false);

    await screenshot(page, testInfo, `${theme}-dashboard`, { fullPage: true });
    expect(problems).toEqual([]);
  });
}

test('the dashboard shows the figures GET /admin/dashboard returns', async ({ page }) => {
  await open(page, '/', 'dark');
  const data = await fetchDashboard(page);

  // The harness seeds three users, three confirmed bookings, six clicks and two subscribers.
  expect(data.totals.users).toBeGreaterThanOrEqual(3);
  expect(data.totals.bookings).toBeGreaterThanOrEqual(3);
  expect(data.totals.bookingValue).toBeGreaterThan(0);

  await expect(stat(page, 'Total users')).toContainText(count.format(data.totals.users));
  await expect(stat(page, 'New users')).toContainText(count.format(data.totals.newUsers));
  await expect(stat(page, 'Bookings')).toContainText(count.format(data.totals.bookings));
  await expect(stat(page, 'Booking value')).toContainText(rupees.format(data.totals.bookingValue));
  await expect(stat(page, 'Newsletter subscribers')).toContainText(
    count.format(data.totals.newsletterSubscribers),
  );

  const topTours = tableRows(page, 'Top tours by bookings');
  await expect(topTours).toHaveCount(data.topTours.length);
  for (const [index, tour] of data.topTours.entries()) {
    await expect(topTours.nth(index)).toContainText(tour.title);
    await expect(topTours.nth(index)).toContainText(rupees.format(tour.value));
  }

  const topGear = tableRows(page, 'Top gear by affiliate clicks');
  await expect(topGear).toHaveCount(data.topGear.length);
  await expect(topGear.first()).toContainText(data.topGear[0].name);
  await expect(topGear.first()).toContainText(String(data.topGear[0].clicks));

  const recent = tableRows(page, 'Recent bookings');
  await expect(recent).toHaveCount(data.recentBookings.length);
  for (const [index, booking] of data.recentBookings.entries()) {
    await expect(recent.nth(index)).toContainText(booking.bookingNumber);
    await expect(recent.nth(index)).toContainText(booking.vertical.name);
    await expect(recent.nth(index)).toContainText(rupees.format(booking.totalAmount));
  }

  // Each chart's figures, as the table behind it: one row per vertical, in the API's order.
  const byVertical = tableRows(page, 'Bookings by vertical');
  await expect(byVertical).toHaveCount(6);
  for (const [index, row] of data.bookingsByVertical.entries()) {
    await expect(byVertical.nth(index)).toHaveText(`${row.vertical.name}${row.bookings}`);
  }
  await expect(tableRows(page, 'Bookings by status').first()).toHaveText(
    `Confirmed${data.bookingsByStatus.confirmed}`,
  );
  await expect(tableRows(page, 'New users per day')).toHaveCount(data.range.days);
});

test('changing the range refetches it and keeps it in the URL', async ({ page }) => {
  const problems = watchForErrors(page);
  await open(page, '/', 'dark');
  const range = page.getByRole('group', { name: 'Date range' });

  const sevenDays = page.waitForResponse((response) =>
    response.url().includes('/admin/dashboard?from='),
  );
  await range.getByRole('button', { name: '7 days' }).click();
  const { searchParams } = new URL((await sevenDays).url());
  await expect(page).toHaveURL(/\?range=7$/);
  await expect(tableRows(page, 'New users per day')).toHaveCount(7);

  const data = await fetchDashboard(
    page,
    `?from=${searchParams.get('from')}&to=${searchParams.get('to')}`,
  );
  expect(data.range.days).toBe(7);
  await expect(stat(page, 'Bookings')).toContainText(count.format(data.totals.bookings));

  await range.getByRole('button', { name: 'Custom' }).click();
  await expect(page).toHaveURL(/range=custom&from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}$/);
  await expect(page.getByLabel('From', { exact: true })).toHaveValue(searchParams.get('from'));

  // A range that ends before it starts is refused on the page, without asking the API.
  await page.getByLabel('To', { exact: true }).fill('2020-01-01');
  await expect(page.getByText('That range can’t be shown.')).toBeVisible();
  await expect(page.getByText('Pick a start date on or before the end date.')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('To', { exact: true })).toHaveValue('2020-01-01');

  await page.goBack();
  await expect(tableRows(page, 'New users per day')).toHaveCount(7);
  expect(problems).toEqual([]);
});

test('the theme choice is sent to the server and applied before first paint', async ({ page }) => {
  // Every test shares the harness admin, so the save is answered here and its user left as it
  // is: a real change would switch the theme under the tests running beside this one.
  const saves = [];
  await page.route('**/api/v1/users/me', async (route) => {
    const changes = route.request().postDataJSON();
    saves.push(changes);
    const envelope = await (await page.request.get('/api/v1/auth/me')).json();
    envelope.data.user = { ...envelope.data.user, ...changes };
    await route.fulfill({ json: envelope });
  });
  await open(page, '/', 'light');

  await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => saves).toEqual([{ themePreference: 'dark' }]);

  // With scripts blocked, only the inline script in index.html can have set the theme.
  await page.route('**/*.js', (route) => route.abort());
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the sections open from the menu button where the sidebar is hidden', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', 'The sidebar is always showing on a desktop.');
  const problems = watchForErrors(page);
  await open(page, '/', 'dark');
  await expect(page.getByRole('complementary')).toBeHidden();

  await page.getByRole('button', { name: 'Open menu' }).click();
  const drawer = page.getByRole('dialog', { name: 'Adventuro Admin' });
  await expect(drawer.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await screenshot(page, testInfo, 'dark-drawer');

  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  expect(problems).toEqual([]);
});

test('the sidebar is fixed beside the page on a desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Below 1024px the sidebar is a drawer.');
  await open(page, '/', 'dark');

  const sidebar = page.getByRole('complementary');
  await expect(sidebar.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
});

test('an unknown path shows the not-found page inside the shell', async ({ page }, testInfo) => {
  const problems = watchForErrors(page);
  await open(page, '/no/such/page', 'light');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await screenshot(page, testInfo, 'light-not-found');
  await page.getByRole('link', { name: 'Back to the dashboard' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  expect(problems).toEqual([]);
});
