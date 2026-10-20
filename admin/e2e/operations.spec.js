import { readFile } from 'node:fs/promises';
import {
  expect,
  findA11yViolations,
  hasHorizontalScroll,
  open,
  screenshot,
  sessionApi,
  test,
  watchForErrors,
} from './fixtures.js';

// Bookings, users and the newsletter, against the harness. This spec changes bookings, so it
// runs in its own projects after every other spec (see playwright.config.js). Each test that
// changes a status books its own trip as the demo customer first, so the two widths never
// share a booking; that is two bookings per width, inside the customer's limit of ten an hour.
// Tests that only look use the seeded PeakPulse booking and leave it confirmed.

const DAY_MS = 24 * 60 * 60 * 1000;
const istDay = (offsetDays) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
    Date.now() + offsetDays * DAY_MS,
  );

// Books the Explorer package of Goa Coastal Escape for two, as the demo customer.
const bookAsCustomer = async () => {
  const api = await sessionApi('customer');
  const { tour } = (await (await api.get('/api/v1/tours/goa-coastal-escape')).json()).data;
  const response = await api.post('/api/v1/bookings', {
    data: { tourId: tour.id, tierId: tour.tiers[1].id, travelers: 2, startDate: istDay(14) },
  });
  expect(response.status()).toBe(201);
  const { booking } = (await response.json()).data;
  await api.dispose();
  return booking;
};

// What the customer's own app is told about the booking, through the customer's session in a
// context of its own.
const customerSees = async (bookingNumber) => {
  const api = await sessionApi('customer');
  const response = await api.get(`/api/v1/bookings/${bookingNumber}`);
  expect(response.status()).toBe(200);
  const { booking } = (await response.json()).data;
  await api.dispose();
  return booking;
};

const statusButtons = (page) =>
  page.getByRole('button', { name: /^(Mark completed|Cancel booking)$/ });
// The value beside one label of a detail plate ("Status", not "Status changed").
const fact = (page, plate, label) =>
  page
    .getByRole('region', { name: plate })
    .locator('dt', { hasText: new RegExp(`^${label}$`) })
    .locator('+ dd');

// Finds a booking from the list by its number and opens its page.
const findBooking = async (page, bookingNumber) => {
  await open(page, '/bookings', 'dark');
  await page.getByRole('searchbox', { name: 'Search' }).fill(bookingNumber);
  await expect(page).toHaveURL(`/bookings?q=${bookingNumber}`);
  const rows = page.getByRole('table', { name: 'Bookings' }).locator('tbody tr');
  await expect(rows).toHaveCount(1);
  await rows.getByRole('link', { name: bookingNumber }).click();
  await expect(page.getByRole('region', { name: 'Trip' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(bookingNumber);
};

test.beforeEach(async ({ signInAs }) => {
  await signInAs('admin');
});

test('an admin finds a booking by its number and marks it completed', async ({
  page,
}, testInfo) => {
  const problems = watchForErrors(page);
  const { bookingNumber } = await bookAsCustomer();

  await findBooking(page, bookingNumber);
  await expect(fact(page, 'Record', 'Status')).toHaveText('Confirmed');
  await expect(statusButtons(page)).toHaveCount(2);
  expect(await hasHorizontalScroll(page)).toBe(false);
  await screenshot(page, testInfo, 'booking-confirmed', { fullPage: true });

  await page.getByRole('button', { name: 'Mark completed' }).click();
  const dialog = page.getByRole('dialog', { name: `Mark ${bookingNumber} completed?` });
  await screenshot(page, testInfo, 'booking-complete-dialog');
  await dialog.getByRole('button', { name: 'Mark completed' }).click();

  await expect(page.getByText(`${bookingNumber} is marked completed.`)).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(fact(page, 'Record', 'Status')).toHaveText('Completed');
  await expect(statusButtons(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Download ticket PDF' })).toBeVisible();
  await screenshot(page, testInfo, 'booking-completed', { fullPage: true });

  expect((await customerSees(bookingNumber)).status).toBe('completed');

  // The list shows the new status too.
  await page.getByRole('link', { name: 'All bookings' }).click();
  await page.getByRole('searchbox', { name: 'Search' }).fill(bookingNumber);
  await expect(page).toHaveURL(`/bookings?q=${bookingNumber}`);
  const rows = page.getByRole('table', { name: 'Bookings' }).locator('tbody tr');
  await expect(rows).toHaveCount(1);
  await expect(rows.getByText('Completed')).toBeVisible();
  expect(problems).toEqual([]);
});

test('an admin cancels a booking, after backing out once, and downloads its ticket', async ({
  page,
}) => {
  const problems = watchForErrors(page);
  const { bookingNumber } = await bookAsCustomer();
  await findBooking(page, bookingNumber);

  await page.getByRole('button', { name: 'Cancel booking' }).click();
  await page.getByRole('button', { name: 'Keep as it is' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(fact(page, 'Record', 'Status')).toHaveText('Confirmed');

  await page.getByRole('button', { name: 'Cancel booking' }).click();
  await page
    .getByRole('dialog', { name: `Cancel ${bookingNumber}?` })
    .getByRole('button', { name: 'Cancel booking' })
    .click();

  await expect(page.getByText(`${bookingNumber} is cancelled.`)).toBeVisible();
  await expect(fact(page, 'Record', 'Status')).toHaveText('Cancelled');
  await expect(statusButtons(page)).toHaveCount(0);
  expect((await customerSees(bookingNumber)).status).toBe('cancelled');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download ticket PDF' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(`Adventuro-${bookingNumber}.pdf`);
  expect((await readFile(await download.path())).subarray(0, 5).toString()).toBe('%PDF-');
  expect(problems).toEqual([]);
});

test('the bookings list filters by status through the URL', async ({ page }, testInfo) => {
  await open(page, '/bookings', 'light');
  expect(await hasHorizontalScroll(page)).toBe(false);
  await screenshot(page, testInfo, 'bookings', { fullPage: true });

  await page.getByRole('combobox', { name: 'Status' }).selectOption('Confirmed');

  await expect(page).toHaveURL('/bookings?status=confirmed');
  const rows = page.getByRole('table', { name: 'Bookings' }).locator('tbody tr');
  await expect(rows.first()).toContainText('Confirmed');
  await expect(rows.getByText(/^(Completed|Cancelled)$/)).toHaveCount(0);
});

test('a recent booking on the dashboard opens its page', async ({ page }) => {
  await open(page, '/', 'dark');
  const link = page.getByRole('table', { name: 'Recent bookings' }).getByRole('link').first();
  const bookingNumber = await link.textContent();

  await link.click();

  await expect(page).toHaveURL(`/bookings/${bookingNumber}`);
  await expect(page.getByRole('region', { name: 'Trip' })).toBeVisible();
});

test('a search finds the demo customer, whose page lists their bookings', async ({
  page,
}, testInfo) => {
  const problems = watchForErrors(page);
  await open(page, '/users', 'dark');
  await screenshot(page, testInfo, 'users', { fullPage: true });

  await page.getByRole('searchbox', { name: 'Search' }).fill('Asha');
  const rows = page.getByRole('table', { name: 'Users' }).locator('tbody tr');
  await expect(rows).toHaveCount(1);
  await rows.getByRole('link', { name: 'Asha Customer' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Asha Customer' })).toBeVisible();
  await expect(fact(page, 'Account', 'Phone')).toHaveText('9876543210');
  const bookings = page.getByRole('table', { name: 'Asha Customer’s bookings' });
  // The three seeded bookings, at least; this spec books more.
  for (const code of ['TT', 'GS', 'PP']) {
    await expect(
      bookings.getByRole('link', { name: new RegExp(`^ADV-${code}-`) }).first(),
    ).toBeVisible();
  }
  expect(await hasHorizontalScroll(page)).toBe(false);
  await screenshot(page, testInfo, 'user-detail', { fullPage: true });
  expect(problems).toEqual([]);
});

test('the newsletter list exports every subscriber as CSV', async ({ page }, testInfo) => {
  await open(page, '/newsletter', 'light');
  const table = page.getByRole('table', { name: 'Subscribers' });
  await expect(table.getByText('reader.one@e2e.adventuro.test')).toBeVisible();
  await screenshot(page, testInfo, 'newsletter', { fullPage: true });

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export CSV' }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/^adventuro-newsletter-\d{4}-\d{2}-\d{2}\.csv$/);
  const lines = (await readFile(await download.path(), 'utf8'))
    .replace(/^\uFEFF/, '')
    .trimEnd()
    .split('\r\n');
  expect(lines[0]).toBe('"Email","Subscribed at (UTC)"');
  expect(
    lines
      .slice(1)
      .map((line) => line.split(',')[0])
      .sort(),
  ).toEqual(['"reader.one@e2e.adventuro.test"', '"reader.two@e2e.adventuro.test"']);
  await expect(page.getByText('Exported 2 subscribers.')).toBeVisible();
});

// A seeded booking this spec never changes: the PeakPulse one, still confirmed.
const confirmedSeedBooking = async () => {
  const api = await sessionApi('admin');
  const { bookings } = (await (await api.get('/api/v1/admin/bookings?q=ADV-PP')).json()).data;
  await api.dispose();
  return bookings.find(({ status }) => status === 'confirmed').bookingNumber;
};

// Presses Tab until `target` has focus, and fails if it never does.
const tabTo = async (page, target, presses = 60) => {
  for (let count = 0; count < presses; count += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error('Tab never reached the element.');
};

test('the bookings table, a booking’s dialog and the users table work from the keyboard alone', async ({
  page,
}) => {
  const bookingNumber = await confirmedSeedBooking();
  await open(page, `/bookings?q=${bookingNumber}`, 'dark');

  await tabTo(page, page.getByRole('link', { name: bookingNumber }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Trip' })).toBeVisible();

  const cancel = page.getByRole('button', { name: 'Cancel booking' });
  await tabTo(page, cancel);
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: `Cancel ${bookingNumber}?` });
  await expect(dialog).toBeVisible();
  // Focus starts in the dialog and stays there.
  for (let count = 0; count < 4; count += 1) {
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(cancel).toBeFocused();
  await expect(fact(page, 'Record', 'Status')).toHaveText('Confirmed');

  await open(page, '/users?q=Asha', 'dark');
  await tabTo(page, page.getByRole('link', { name: 'Asha Customer' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Asha Customer' })).toBeVisible();

  await open(page, '/newsletter', 'dark');
  await tabTo(page, page.getByRole('region', { name: 'Subscribers' }));
  await tabTo(page, page.getByRole('button', { name: 'Export CSV' }));
});

test('a booking and its dialog, and a user, have no serious or critical violations', async ({
  page,
}) => {
  const bookingNumber = await confirmedSeedBooking();
  for (const theme of ['dark', 'light']) {
    await open(page, `/bookings/${bookingNumber}`, theme);
    expect(await findA11yViolations(page), `booking, ${theme}`).toEqual([]);
    await page.getByRole('button', { name: 'Cancel booking' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await findA11yViolations(page), `dialog, ${theme}`).toEqual([]);
    await page.getByRole('button', { name: 'Keep as it is' }).click();

    await page.getByRole('region', { name: 'Customer' }).getByRole('link').first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Asha Customer' })).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    expect(await findA11yViolations(page), `user, ${theme}`).toEqual([]);
  }
});
