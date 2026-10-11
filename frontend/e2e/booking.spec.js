import { readFile } from 'node:fs/promises';
import {
  dateAhead,
  expect,
  hasHorizontalScroll,
  open,
  screenshot,
  stubGoogleSignIn,
  test,
  THEMES,
  watchForErrors,
} from './fixtures.js';

const GOA = 'Goa Coastal Escape';
const TOUR_URL = '/tours/goa-coastal-escape';

const formatPrice = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

// "₹18,749" → 18749
const toRupees = (text) => Number(text.match(/₹([\d,]+)/)[1].replaceAll(',', ''));

const bookingDialog = (page) => page.getByRole('dialog', { name: 'Book this trip' });
// The tour page has two Book links: beside the packages on desktop, in the bottom bar below it.
const bookThisTrip = (page) =>
  page.getByRole('link', { name: 'Book this trip' }).filter({ visible: true });

test('a customer books a tour, gets the ticket and its PDF, and finds it in My Bookings', async ({
  page,
  signInAs,
}) => {
  const problems = watchForErrors(page);
  const startDate = dateAhead(45);
  await signInAs('customer');
  await open(page, TOUR_URL, 'dark');

  await bookThisTrip(page).click();
  const dialog = bookingDialog(page);
  await expect(dialog.getByText(GOA)).toBeVisible();

  const explorer = dialog.getByRole('radio', { name: /Explorer/ });
  await explorer.check();
  await dialog.getByRole('button', { name: 'More travelers' }).click();
  await dialog.getByLabel('Start date').fill(startDate);

  const pricePerPerson = toRupees(await explorer.locator('xpath=ancestor::label').innerText());
  const total = formatPrice(2 * pricePerPerson);
  await expect(dialog.getByRole('status', { name: 'Total' })).toHaveText(total);

  await dialog.getByRole('button', { name: 'Confirm Booking' }).click();

  await expect(page).toHaveURL(/\/bookings\/ADV-TT-\d{4}-\d{6}$/);
  const bookingNumber = page.url().split('/').at(-1);
  expect(bookingNumber).toContain(`ADV-TT-${dateAhead(0).slice(0, 4)}-`);
  const ticket = page.getByRole('article');
  await expect(ticket.getByRole('heading', { level: 1, name: bookingNumber })).toBeVisible();
  await expect(ticket).toContainText('Confirmed');
  await expect(ticket).toContainText('TideTrail');
  await expect(ticket).toContainText('Explorer');
  await expect(ticket).toContainText(total);
  await expect(ticket).toContainText('Asha Customer');
  await expect(ticket.getByText('Reporting time')).toBeVisible();
  await expect(ticket.getByText('10:30 AM')).toBeVisible();
  await expect(ticket.getByText('Reporting location')).toBeVisible();
  await expect(ticket.locator('dt', { hasText: 'Reporting location' }).locator('+ dd')).toHaveText(
    /\S/,
  );

  const downloading = page.waitForEvent('download');
  await ticket.getByRole('button', { name: 'Download PDF' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe(`Adventuro-${bookingNumber}.pdf`);
  const pdf = await readFile(await download.path());
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');

  await page.getByRole('link', { name: 'My bookings', exact: true }).click();
  await expect(page).toHaveURL('/account/bookings');
  const row = page
    .getByRole('list', { name: 'Bookings' })
    .getByRole('listitem')
    .filter({ hasText: bookingNumber });
  await expect(row).toContainText(GOA);
  await expect(row).toContainText(total);
  await expect(row).toContainText('Confirmed');

  await row.getByRole('link', { name: bookingNumber }).click();
  await expect(page).toHaveURL(`/bookings/${bookingNumber}`);
  expect(problems).toEqual([]);
});

test('a signed-out visitor who confirms is sent to sign in, with the way back kept', async ({
  page,
}) => {
  const startDate = dateAhead(20);
  await stubGoogleSignIn(page);
  await open(page, '/v/tidetrail', 'light');

  await page.getByRole('link', { name: `Book ${GOA}` }).click();
  const dialog = bookingDialog(page);
  await dialog.getByRole('button', { name: 'More travelers' }).click();
  await dialog.getByLabel('Start date').fill(startDate);
  await dialog.getByRole('button', { name: 'Confirm Booking' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Sign in to Adventuro' })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/signin');
  expect(new URL(page.url()).searchParams.get('next')).toBe('/v/tidetrail?book=goa-coastal-escape');
  const intent = await page.evaluate(() =>
    JSON.parse(window.sessionStorage.getItem('adventuro.bookingIntent')),
  );
  expect(intent).toMatchObject({ tourSlug: 'goa-coastal-escape', travelers: 2, startDate });

  // Back from sign-in without signing in, the booking is as it was left.
  await page.goBack();
  await expect(dialog.getByRole('group', { name: 'travelers' }).getByRole('status')).toHaveText(
    '2',
  );
  await expect(dialog.getByLabel('Start date')).toHaveValue(startDate);
});

test('a start date outside the window is refused in the form', async ({ page, signInAs }) => {
  await signInAs('customer');
  await open(page, `${TOUR_URL}?book=goa-coastal-escape`, 'dark');
  const dialog = bookingDialog(page);

  await dialog.getByLabel('Start date').fill(dateAhead(0));
  await dialog.getByRole('button', { name: 'Confirm Booking' }).click();

  await expect(dialog.getByRole('alert')).toHaveText(
    'Pick a start date from tomorrow up to a year ahead.',
  );
  await expect(page).toHaveURL(`${TOUR_URL}?book=goa-coastal-escape`);
});

for (const theme of THEMES) {
  test(`booking modal, ticket, my bookings and about in the ${theme} theme`, async ({
    page,
    signInAs,
  }, testInfo) => {
    const problems = watchForErrors(page);
    await signInAs('customer');

    await open(page, `${TOUR_URL}?book=goa-coastal-escape`, theme);
    const dialog = bookingDialog(page);
    await dialog.getByRole('button', { name: 'More travelers' }).click();
    await dialog.getByLabel('Start date').fill(dateAhead(30));
    await expect(
      dialog.getByRole('region', { name: 'Recommended gear' }).getByRole('link'),
    ).not.toHaveCount(0);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await screenshot(page, testInfo, `${theme}-booking-modal`);

    await open(page, '/account/bookings', theme);
    const bookings = page.getByRole('list', { name: 'Bookings' });
    await expect(bookings.getByRole('listitem').first()).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
    await screenshot(page, testInfo, `${theme}-my-bookings`, { fullPage: true });

    await bookings.getByRole('link').last().click();
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
    await screenshot(page, testInfo, `${theme}-ticket`, { fullPage: true });

    await open(page, '/about', theme);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await screenshot(page, testInfo, `${theme}-about`, { fullPage: true });

    await open(page, '/cancellation-refund', theme);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await screenshot(page, testInfo, `${theme}-static`, { fullPage: true });
    expect(problems).toEqual([]);
  });
}
