import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import {
  ADMIN_APP,
  CUSTOMER_APP,
  dateAhead,
  fetchDashboard,
  open,
  rupees,
  signedInContext,
  toast,
} from './fixtures.js';

// One GoldenSaga tour goes through both apps: the admin creates it and its gear, a customer
// finds it, buys the gear and books it, the admin completes the booking and later unpublishes
// the tour. Each step builds on the one before, so the file runs in order.
test.describe.configure({ mode: 'serial' });

const suffix = randomUUID().slice(0, 8);
const TOUR = {
  title: `E2E Thar Fort Trail ${suffix}`,
  slug: `e2e-thar-fort-trail-${suffix}`,
  tiers: [
    ['Essential', 9000],
    ['Royal', 15000],
  ],
};
const GEAR = { name: `E2E Dune Scarf ${suffix}`, mrp: 1499, salePrice: 999 };
const TRAVELERS = 2;
const created = { tourId: null, gearId: null, bookingNumber: null, totals: null };

let admin;
let customer;

test.beforeAll(async ({ browser }) => {
  admin = await signedInContext(browser, 'admin');
  customer = await signedInContext(browser, 'customer');
});

test.afterAll(async () => {
  // The tour has a booking, so it stays (unpublished); the harness forgets it when it stops.
  if (created.gearId)
    await admin.request.delete(`${ADMIN_APP}/api/v1/admin/gear/${created.gearId}`);
  await admin?.close();
  await customer?.close();
});

const bookingRow = (page, bookingNumber) =>
  page.getByRole('table', { name: 'Recent bookings' }).locator('tbody tr', {
    hasText: bookingNumber,
  });
const stat = (page, label) =>
  page.locator('p', { hasText: new RegExp(`^${label}$`) }).locator('..');

test('the admin creates and publishes a GoldenSaga tour with packages and gear', async () => {
  const page = await admin.newPage();
  await open(page, `${ADMIN_APP}/tours/new`);
  created.totals = (await fetchDashboard(page)).totals;

  await page.getByRole('combobox', { name: 'Vertical' }).selectOption({ label: 'GoldenSaga' });
  await page.getByRole('switch', { name: 'Published' }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill(TOUR.title);
  await expect(page.getByRole('textbox', { name: 'Slug' })).toHaveValue(TOUR.slug);
  await page.getByRole('textbox', { name: 'State' }).fill('Rajasthan');
  await page.getByRole('textbox', { name: 'Destination' }).fill('Jaisalmer');
  await page.getByRole('spinbutton', { name: 'Duration in days' }).fill('2');
  await page.getByRole('combobox', { name: 'Difficulty' }).selectOption({ label: 'Easy' });
  await page.getByRole('textbox', { name: 'Overview' }).fill('Two days inside the golden fort.');

  await page.getByRole('tab', { name: 'Experience' }).click();
  await page.getByRole('textbox', { name: 'Activity' }).fill('ATV ride across the Sam dunes');
  await page.getByRole('textbox', { name: 'What happens' }).fill('An hour on the dunes at dusk.');

  await page.getByRole('tab', { name: 'Itinerary' }).click();
  for (const [day, dayTitle] of [
    ['Day 1', 'Into the fort'],
    ['Day 2', 'Dunes and departure'],
  ]) {
    await page.getByRole('button', { name: 'Add day' }).click();
    await page
      .getByRole('group', { name: day })
      .getByRole('textbox', { name: 'Title' })
      .fill(dayTitle);
  }

  await page.getByRole('tab', { name: 'Packages' }).click();
  await page.getByRole('button', { name: 'Add package' }).click();
  for (const [index, [name, price]] of TOUR.tiers.entries()) {
    const tier = page.getByRole('group', { name: `Package ${index + 1}` });
    await tier.getByRole('textbox', { name: 'Name' }).fill(name);
    await tier.getByRole('spinbutton', { name: 'Price per person' }).fill(String(price));
  }

  await page.getByRole('tab', { name: 'Reporting' }).click();
  await page.getByRole('textbox', { name: 'Location' }).fill('Gadisar Lake gate');
  await page.getByLabel('Reporting time').fill('16:00');

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(toast(page, `${TOUR.title} saved.`)).toBeVisible();
  await expect(page).toHaveURL(/\/tours\/[a-f\d]{24}$/);
  created.tourId = page.url().split('/').at(-1);

  await open(page, `${ADMIN_APP}/gear/new`);
  await page.getByRole('textbox', { name: 'Name' }).fill(GEAR.name);
  await page.getByRole('textbox', { name: 'Short description' }).fill('Cotton scarf for sand');
  await page.getByRole('spinbutton', { name: 'MRP' }).fill(String(GEAR.mrp));
  await page.getByRole('spinbutton', { name: 'Sale price' }).fill(String(GEAR.salePrice));
  await page
    .getByRole('textbox', { name: 'Affiliate link' })
    .fill(`https://example.com/e2e-dune-scarf-${suffix}`);
  await page.getByRole('combobox', { name: 'Category' }).selectOption({ label: 'Accessories' });
  await page.getByRole('button', { name: 'Climates' }).click();
  await page.getByRole('checkbox', { name: 'Desert/Dust' }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Linked tours' }).click();
  await page.getByRole('searchbox', { name: 'Filter options' }).fill(suffix);
  await page.getByRole('checkbox', { name: new RegExp(TOUR.title) }).check();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(toast(page, `${GEAR.name} saved.`)).toBeVisible();
  await expect(page).toHaveURL(/\/gear\/[a-f\d]{24}$/);
  created.gearId = page.url().split('/').at(-1);
  await page.close();
});

test('the customer finds the tour and its gear, and books it', async () => {
  test.skip(!created.gearId, 'Needs the tour and gear from the first step.');
  const page = await customer.newPage();
  await open(page, `${CUSTOMER_APP}/v/goldensaga`);

  await expect(page.getByRole('link', { name: `Explore ${TOUR.title}` })).toBeVisible();
  const suggested = page.getByRole('region', { name: 'Suggested gear' });
  await expect(suggested.getByText(GEAR.name)).toBeVisible();

  await page.getByRole('link', { name: `Explore ${TOUR.title}` }).click();
  await expect(page).toHaveURL(`${CUSTOMER_APP}/tours/${TOUR.slug}`);
  await expect(page.getByRole('heading', { level: 1, name: TOUR.title })).toBeVisible();
  await expect(page.getByText('ATV ride across the Sam dunes')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Gear for this trip' }).getByText(GEAR.name),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Book this trip' }).filter({ visible: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Book this trip' });
  await dialog.getByRole('radio', { name: /Royal/ }).check();
  await dialog.getByRole('button', { name: 'More travelers' }).click();
  await dialog.getByLabel('Start date').fill(dateAhead(20));
  const total = rupees(TOUR.tiers[1][1] * TRAVELERS);
  await expect(dialog.getByRole('status', { name: 'Total' })).toHaveText(total);
  await dialog.getByRole('button', { name: 'Confirm Booking' }).click();

  await expect(page).toHaveURL(/\/bookings\/ADV-GS-\d{4}-\d{6}$/);
  created.bookingNumber = page.url().split('/').at(-1);
  const ticket = page.getByRole('article');
  await expect(ticket.getByRole('heading', { level: 1 })).toHaveText(created.bookingNumber);
  await expect(ticket).toContainText('Confirmed');
  await expect(ticket).toContainText(TOUR.title);
  await expect(ticket).toContainText('Royal');
  await expect(ticket).toContainText(total);
  await expect(ticket).toContainText('Gadisar Lake gate');
  await expect(ticket).toContainText('4:00 PM');
  await page.close();
});

test('the admin sees the booking on the dashboard and completes it; the ticket follows', async () => {
  test.skip(!created.bookingNumber, 'Needs the booking from the step before.');
  const page = await admin.newPage();
  await open(page, `${ADMIN_APP}/`);
  const data = await fetchDashboard(page);

  // The booking is on the dashboard: one more booking, its value, and in the recent list.
  const totalAmount = TOUR.tiers[1][1] * TRAVELERS;
  expect(data.totals.bookings).toBe(created.totals.bookings + 1);
  expect(data.totals.bookingValue).toBe(created.totals.bookingValue + totalAmount);
  const booking = data.recentBookings.find((row) => row.bookingNumber === created.bookingNumber);
  expect(booking).toMatchObject({ status: 'confirmed', totalAmount });
  await expect(stat(page, 'Bookings')).toContainText(String(data.totals.bookings));
  await expect(stat(page, 'Booking value')).toContainText(rupees(data.totals.bookingValue));
  await expect(bookingRow(page, created.bookingNumber)).toContainText('GoldenSaga');
  const before = { bookings: data.totals.bookings, value: data.totals.bookingValue };

  await open(page, `${ADMIN_APP}/bookings`);
  await page.getByRole('searchbox', { name: 'Search' }).fill(created.bookingNumber);
  const rows = page.getByRole('table', { name: 'Bookings' }).locator('tbody tr');
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText(TOUR.title);
  await rows.getByRole('link', { name: created.bookingNumber }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(created.bookingNumber);

  await page.getByRole('button', { name: 'Mark completed' }).click();
  await page
    .getByRole('dialog', { name: `Mark ${created.bookingNumber} completed?` })
    .getByRole('button', { name: 'Mark completed' })
    .click();
  await expect(page.getByText(`${created.bookingNumber} is marked completed.`)).toBeVisible();

  // A completed booking still counts, at the same value.
  const after = await fetchDashboard(page);
  expect(after.totals.bookings).toBe(before.bookings);
  expect(after.totals.bookingValue).toBe(before.value);
  expect(after.bookingsByStatus.completed).toBeGreaterThanOrEqual(1);
  await page.close();

  const ticketPage = await customer.newPage();
  await open(ticketPage, `${CUSTOMER_APP}/bookings/${created.bookingNumber}`);
  await expect(ticketPage.getByRole('article')).toContainText('Completed');
  await ticketPage.close();
});

test('an affiliate click in the customer app reaches the admin dashboard', async () => {
  test.skip(!created.gearId, 'Needs the gear from the first step.');
  const adminPage = await admin.newPage();
  const clicksOf = async () =>
    (await fetchDashboard(adminPage)).topGear.find(({ gearId }) => gearId === created.gearId)
      ?.clicks ?? 0;
  const clicksBefore = await clicksOf();

  const page = await customer.newPage();
  await open(page, `${CUSTOMER_APP}/tours/${TOUR.slug}`);
  const [shop] = await Promise.all([
    customer.waitForEvent('page'),
    page.getByRole('link', { name: `Buy ${GEAR.name} (opens in a new tab)` }).click(),
  ]);
  await shop.waitForLoadState();
  expect(shop.url()).toBe(`https://example.com/e2e-dune-scarf-${suffix}`);
  await shop.close();
  await page.close();

  expect(await clicksOf()).toBe(clicksBefore + 1);
  await open(adminPage, `${ADMIN_APP}/`);
  await expect(
    adminPage
      .getByRole('table', { name: 'Top gear by affiliate clicks' })
      .locator('tbody tr', { hasText: GEAR.name }),
  ).toContainText(String(clicksBefore + 1));
  await adminPage.close();
});

test('an unpublished tour is gone for the customer, but its ticket still opens', async () => {
  test.skip(!created.bookingNumber, 'Needs the booking from the steps before.');
  const page = await admin.newPage();
  await open(page, `${ADMIN_APP}/tours?q=${suffix}`);
  const published = page.getByRole('switch', { name: `Published: ${TOUR.title}` });
  await expect(published).toBeChecked();
  await published.click();
  await expect(published).not.toBeChecked();
  await page.close();

  const customerPage = await customer.newPage();
  await open(customerPage, `${CUSTOMER_APP}/tours/${TOUR.slug}`);
  await expect(customerPage.getByRole('heading', { level: 1 })).toHaveText(
    'This trail isn’t on the map.',
  );

  await open(customerPage, `${CUSTOMER_APP}/v/goldensaga`);
  await expect(customerPage.getByRole('link', { name: `Explore ${TOUR.title}` })).toHaveCount(0);

  await open(customerPage, `${CUSTOMER_APP}/bookings/${created.bookingNumber}`);
  const ticket = customerPage.getByRole('article');
  await expect(ticket.getByRole('heading', { level: 1 })).toHaveText(created.bookingNumber);
  await expect(ticket).toContainText(TOUR.title);
  await expect(ticket).toContainText('Gadisar Lake gate');
  await customerPage.close();
});

test('one account’s theme preference follows it from one app to the other', async ({ browser }) => {
  // The admin app admits admins only, so the account that uses both apps is the admin's.
  const context = await signedInContext(browser, 'admin');
  const restore = () =>
    context.request.patch(`${CUSTOMER_APP}/api/v1/users/me`, {
      data: { themePreference: 'system' },
    });
  try {
    const page = await context.newPage();
    // The device prefers light, so dark can only have come from the account.
    await page.emulateMedia({ colorScheme: 'light' });

    await open(page, `${CUSTOMER_APP}/account`);
    const saved = page.waitForResponse(
      (response) => response.url().endsWith('/api/v1/users/me') && response.ok(),
    );
    await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Dark' }).click();
    await saved;
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // A fresh origin with nothing in its localStorage takes the account's choice.
    await open(page, `${ADMIN_APP}/`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const theme = page.getByRole('group', { name: 'Theme' });
    await expect(theme.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // And back the other way.
    const savedLight = page.waitForResponse(
      (response) => response.url().endsWith('/api/v1/users/me') && response.ok(),
    );
    await theme.getByRole('button', { name: 'Light' }).click();
    await savedLight;
    await page.emulateMedia({ colorScheme: 'dark' });
    await open(page, `${CUSTOMER_APP}/account`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(
      page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Light' }),
    ).toHaveAttribute('aria-pressed', 'true');
  } finally {
    await restore();
    await context.close();
  }
});
