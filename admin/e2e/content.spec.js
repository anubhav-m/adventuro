import { randomUUID } from 'node:crypto';
import {
  adminApi,
  expect,
  hasHorizontalScroll,
  makePng,
  open,
  screenshot,
  test,
  watchForErrors,
} from './fixtures.js';

// One tour and one gear item go through their whole life in the real admin, uploading to the
// real Supabase dev bucket: created, published, edited, linked, deleted, their images gone.
// Each project (tablet, desktop) runs its own copy with its own names.
test.describe.configure({ mode: 'serial' });

const suffix = randomUUID().slice(0, 8);
const created = { tour: null, gear: null, imageUrls: [] };

const TOUR_TABS = [
  'Basics',
  'Media',
  'Experience',
  'Itinerary',
  'Inclusions / Exclusions',
  'Packages',
  'Reporting',
  'Gear',
];

const fetchPublic = (page, path) => page.request.get(`/api/v1${path}`);

const toast = (page, text) => page.locator('[data-sonner-toast]', { hasText: text });

// An upload asks the CDN for a copy it has never cached, so a deleted image cannot be served
// from the cache.
const fetchUncached = (page, url) => page.request.get(`${url}?e2e=${Date.now()}`);

test.beforeEach(async ({ signInAs }) => {
  await signInAs('admin');
});

// If a step fails, whatever it created is still deleted, which also removes its images.
test.afterAll(async () => {
  const api = await adminApi();
  if (created.gear) await api.delete(`/api/v1/admin/gear/${created.gear.id}`);
  if (created.tour) await api.delete(`/api/v1/admin/tours/${created.tour.id}`);
  await api.dispose();
});

test('create and publish a PeakPulse tour with an uploaded cover', async ({ page }, testInfo) => {
  const problems = watchForErrors(page);
  const title = `E2E Summit Trek ${testInfo.project.name} ${suffix}`;
  await open(page, '/tours/new', 'dark');

  await page.getByRole('combobox', { name: 'Vertical' }).selectOption({ label: 'PeakPulse' });
  await page.getByRole('switch', { name: 'Published' }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill(title);
  await expect(page.getByRole('textbox', { name: 'Slug' })).toHaveValue(
    `e2e-summit-trek-${testInfo.project.name}-${suffix}`,
  );
  await page.getByRole('textbox', { name: 'State' }).fill('Uttarakhand');
  await page.getByRole('textbox', { name: 'Destination' }).fill('Auli');
  await page.getByRole('spinbutton', { name: 'Duration in days' }).fill('2');
  await page.getByRole('combobox', { name: 'Difficulty' }).selectOption({ label: 'Moderate' });
  await page.getByRole('textbox', { name: 'Overview' }).fill('Two days on the Auli slopes.');

  await page.getByRole('tab', { name: 'Media' }).click();
  await page
    .getByLabel('Cover image: choose a file')
    .setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: makePng() });
  await expect(page.getByRole('img', { name: 'Cover image, current image' })).toBeVisible();

  await page.getByRole('tab', { name: 'Experience' }).click();
  await page.getByRole('textbox', { name: 'Activity' }).fill('Ski lesson on the Auli slopes');
  await page.getByRole('textbox', { name: 'What happens' }).fill('A morning with an instructor.');

  await page.getByRole('tab', { name: 'Itinerary' }).click();
  for (const [day, dayTitle] of [
    ['Day 1', 'Arrive in Auli'],
    ['Day 2', 'Slopes and departure'],
  ]) {
    await page.getByRole('button', { name: 'Add day' }).click();
    await page
      .getByRole('group', { name: day })
      .getByRole('textbox', { name: 'Title' })
      .fill(dayTitle);
  }

  await page.getByRole('tab', { name: 'Packages' }).click();
  await page.getByRole('button', { name: 'Add package' }).click();
  for (const [index, [name, price]] of [
    ['Essential', '12000'],
    ['Explorer', '15000'],
  ].entries()) {
    const tier = page.getByRole('group', { name: `Package ${index + 1}` });
    await tier.getByRole('textbox', { name: 'Name' }).fill(name);
    await tier.getByRole('spinbutton', { name: 'Price per person' }).fill(price);
  }

  await page.getByRole('tab', { name: 'Reporting' }).click();
  await page.getByRole('textbox', { name: 'Location' }).fill('Joshimath taxi stand');
  await page.getByLabel('Reporting time').fill('07:30');

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(toast(page, `${title} saved.`)).toBeVisible();
  await expect(page).toHaveURL(/\/tours\/[a-f\d]{24}$/);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();

  const response = await fetchPublic(
    page,
    `/tours/e2e-summit-trek-${testInfo.project.name}-${suffix}`,
  );
  expect(response.status()).toBe(200);
  const { tour } = (await response.json()).data;
  created.tour = { id: page.url().split('/').at(-1), slug: tour.slug, title };
  created.imageUrls.push(tour.coverImage.url);
  expect(tour.startingPrice).toBe(12000);
  expect(tour.tiers.map(({ name, pricePerPerson }) => [name, pricePerPerson])).toEqual([
    ['Essential', 12000],
    ['Explorer', 15000],
  ]);
  expect(tour.itinerary.map(({ day, title: dayTitle }) => [day, dayTitle])).toEqual([
    [1, 'Arrive in Auli'],
    [2, 'Slopes and departure'],
  ]);
  expect(tour.vertical.key).toBe('peakpulse');
  expect(tour.coverImage.path).toMatch(/^tours\/[a-f\d-]{36}\.png$/);
  expect((await fetchUncached(page, tour.coverImage.url)).status()).toBe(200);
  expect(problems).toEqual([]);

  // The editor, tab by tab, for review.
  for (const tab of TOUR_TABS) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
    await screenshot(page, testInfo, `dark-tour-tab-${tab.replace(/\W+/g, '-').toLowerCase()}`, {
      fullPage: true,
    });
  }
});

test('a new reporting time reaches the customer API', async ({ page }) => {
  test.skip(!created.tour, 'Needs the tour from the first step.');
  await open(page, `/tours/${created.tour.id}?tab=reporting`, 'light');

  await page.getByLabel('Reporting time').fill('06:15');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(toast(page, `${created.tour.title} saved.`)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();

  const { tour } = (await (await fetchPublic(page, `/tours/${created.tour.slug}`)).json()).data;
  expect(tour.reporting.time).toBe('06:15');
});

test('gear linked to the tour shows on the tour in the store', async ({ page }, testInfo) => {
  test.skip(!created.tour, 'Needs the tour from the first step.');
  const problems = watchForErrors(page);
  const name = `E2E Storm Shell ${testInfo.project.name} ${suffix}`;
  await open(page, '/gear/new', 'light');

  await page.getByRole('textbox', { name: 'Name' }).fill(name);
  await page.getByRole('textbox', { name: 'Short description' }).fill('Packable rain shell');
  await page
    .getByLabel('Add to images: choose a file')
    .setInputFiles({
      name: 'shell.png',
      mimeType: 'image/png',
      buffer: makePng({ rgb: [20, 115, 78] }),
    });
  await expect(page.getByRole('listitem', { name: 'Image 1 of 1' })).toBeVisible();
  await page.getByRole('spinbutton', { name: 'MRP' }).fill('4999');
  await page.getByRole('spinbutton', { name: 'Sale price' }).fill('5999');
  await page
    .getByRole('textbox', { name: 'Affiliate link' })
    .fill('https://example.com/e2e-storm-shell');
  await expect(page.getByRole('link', { name: 'Test link' })).toHaveAttribute(
    'href',
    'https://example.com/e2e-storm-shell',
  );
  await page.getByRole('combobox', { name: 'Category' }).selectOption({ label: 'Winter Gear' });
  await page.getByRole('button', { name: 'Climates' }).click();
  await page.getByRole('checkbox', { name: 'High Altitude/Snow' }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Linked tours' }).click();
  await page.getByRole('searchbox', { name: 'Filter options' }).fill(suffix);
  await page.getByRole('checkbox', { name: new RegExp(created.tour.title) }).check();
  await page.keyboard.press('Escape');

  // A sale price above the MRP is refused before anything is sent.
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Sale price' })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.getByRole('spinbutton', { name: 'Sale price' }).fill('3999');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(toast(page, `${name} saved.`)).toBeVisible();
  await expect(page).toHaveURL(/\/gear\/[a-f\d]{24}$/);
  created.gear = { id: page.url().split('/').at(-1), name };
  await screenshot(page, testInfo, 'light-gear-editor', { fullPage: true });
  expect(await hasHorizontalScroll(page)).toBe(false);

  const { gear: items } = (
    await (await fetchPublic(page, `/gear?tour=${created.tour.slug}`)).json()
  ).data;
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ name, mrp: 4999, salePrice: 3999 });
  expect(items[0].category.name).toBe('Winter Gear');
  expect(items[0].climates.map(({ name: climate }) => climate)).toEqual(['High Altitude/Snow']);
  created.imageUrls.push(items[0].images[0].url);

  // The tour's Gear tab lists it, read-only, with a link to edit it.
  await open(page, `/tours/${created.tour.id}?tab=gear`, 'dark');
  await expect(page.getByRole('table', { name: 'Linked gear' }).getByText(name)).toBeVisible();
  await screenshot(page, testInfo, 'dark-tour-tab-gear-linked', { fullPage: true });
  expect(problems).toEqual([]);
});

test('deleting the gear and the tour removes their images from storage', async ({ page }) => {
  test.skip(!created.tour || !created.gear, 'Needs the tour and the gear from the steps above.');
  await open(page, `/gear?q=${encodeURIComponent(suffix)}`, 'dark');

  await page.getByRole('button', { name: `Delete ${created.gear.name}` }).click();
  await page
    .getByRole('dialog', { name: `Delete ${created.gear.name}?` })
    .getByRole('button', { name: 'Delete' })
    .click();
  await expect(toast(page, `${created.gear.name} deleted.`)).toBeVisible();
  created.gear = null;

  await open(page, `/tours?q=${encodeURIComponent(suffix)}`, 'dark');
  await page.getByRole('button', { name: `Delete ${created.tour.title}` }).click();
  await page
    .getByRole('dialog', { name: `Delete ${created.tour.title}?` })
    .getByRole('button', { name: 'Delete' })
    .click();
  await expect(toast(page, `${created.tour.title} deleted.`)).toBeVisible();
  await expect(page.getByRole('cell', { name: created.tour.title })).toHaveCount(0);

  expect((await fetchPublic(page, `/tours/${created.tour.slug}`)).status()).toBe(404);
  created.tour = null;
  // Clean-up runs just after the response, so give storage a moment.
  for (const url of created.imageUrls) {
    await expect
      .poll(async () => (await fetchUncached(page, url)).status(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(400);
  }
});

// A demo tour with bookings per project, so the two projects never act on the same tour.
const TOURS_WITH_BOOKINGS = {
  tablet: { slug: 'jaisalmer-dunes-desert-camp', title: 'Jaisalmer Dunes & Desert Camp' },
  desktop: { slug: 'goa-coastal-escape', title: 'Goa Coastal Escape' },
};

test('a tour with bookings is unpublished instead of deleted', async ({ page }, testInfo) => {
  const { slug, title } = TOURS_WITH_BOOKINGS[testInfo.project.name];
  await open(page, `/tours?q=${encodeURIComponent(title.split(' ')[0])}`, 'light');

  await page.getByRole('button', { name: `Delete ${title}` }).click();
  await page
    .getByRole('dialog', { name: `Delete ${title}?` })
    .getByRole('button', { name: 'Delete' })
    .click();
  const dialog = page.getByRole('dialog', { name: `Unpublish ${title} instead?` });
  await expect(dialog).toContainText('This tour has bookings — unpublish it instead.');
  await screenshot(page, testInfo, 'light-unpublish-instead');
  await dialog.getByRole('button', { name: 'Unpublish instead' }).click();

  await expect(toast(page, `${title} is now a draft. Its bookings are kept.`)).toBeVisible();
  await expect(page.getByRole('switch', { name: `Published: ${title}` })).not.toBeChecked();
  expect((await fetchPublic(page, `/tours/${slug}`)).status()).toBe(404);

  // The harness is shared: publish it again from the list.
  await page.getByRole('switch', { name: `Published: ${title}` }).click();
  await expect(toast(page, `${title} is published.`)).toBeVisible();
  expect((await fetchPublic(page, `/tours/${slug}`)).status()).toBe(200);
});
