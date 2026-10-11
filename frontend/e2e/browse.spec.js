import {
  expect,
  hasHorizontalScroll,
  open,
  screenshot,
  test,
  THEMES,
  watchForErrors,
} from './fixtures.js';

const GOA = 'Goa Coastal Escape';

const PAGES = [
  { name: 'vertical', path: '/v/tidetrail', heading: 'TideTrail' },
  { name: 'tour', path: '/tours/goa-coastal-escape', heading: GOA },
  { name: 'gear-store', path: '/gear', heading: 'Gear store' },
];

// Photos below the fold load as they come into view. Walk the page so every one has loaded
// and faded in, then return to the top for the screenshot.
const loadEveryPhoto = async (page) => {
  await page.evaluate(async () => {
    for (let top = 0; top < document.documentElement.scrollHeight; top += window.innerHeight) {
      window.scrollTo(0, top);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.images].every((image) => image.complete && image.naturalWidth > 0),
      ),
    )
    .toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
};

for (const theme of THEMES) {
  for (const { name, path, heading } of PAGES) {
    test(`${name} page in the ${theme} theme`, async ({ page }, testInfo) => {
      const problems = watchForErrors(page);
      await open(page, path, theme);

      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page.getByRole('link', { name: /^Buy / }).first()).toBeVisible();
      await loadEveryPhoto(page);
      expect(await hasHorizontalScroll(page)).toBe(false);

      await screenshot(page, testInfo, `${theme}-${name}`, { fullPage: true });
      await screenshot(page, testInfo, `${theme}-${name}-fold`);
      expect(problems).toEqual([]);
    });
  }

  test(`search overlay in the ${theme} theme`, async ({ page }, testInfo) => {
    const problems = watchForErrors(page);
    await open(page, '/', theme);

    await page.getByRole('button', { name: 'Search' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await dialog.getByRole('searchbox').fill('dry');
    await expect(dialog.getByRole('region', { name: 'Gear' }).getByRole('link')).not.toHaveCount(0);
    expect(await hasHorizontalScroll(page)).toBe(false);

    await screenshot(page, testInfo, `${theme}-search`);
    expect(problems).toEqual([]);
  });
}

test('home → logo menu → TideTrail → the Goa card → its tour page', async ({ page }) => {
  const problems = watchForErrors(page);
  await open(page, '/', 'dark');

  await page.getByRole('button', { name: 'Browse verticals and gear' }).click();
  await page.getByRole('menuitem', { name: 'TideTrail' }).click();
  await expect(page).toHaveURL(/\/v\/tidetrail$/);
  await expect(page.getByRole('heading', { level: 1, name: 'TideTrail' })).toBeVisible();
  await expect(page).toHaveTitle('TideTrail · Adventuro');

  const card = page.getByRole('article').filter({ hasText: GOA });
  await expect(card.getByText('4 days · Easy')).toBeVisible();
  await card.getByRole('link', { name: `Explore ${GOA}` }).click();

  await expect(page).toHaveURL(/\/tours\/goa-coastal-escape$/);
  await expect(page.getByRole('heading', { level: 1, name: GOA })).toBeVisible();
  await expect(page).toHaveTitle(`${GOA} · Adventuro`);

  const packages = page.getByRole('region', { name: 'Choose your package' });
  await expect(packages.getByRole('radio')).toHaveCount(3);
  await expect(packages.getByRole('radio', { name: /Essential/ })).toBeChecked();
  await packages.getByText('Explorer').click();
  await expect(packages.getByRole('radio', { name: /Explorer/ })).toBeChecked();
  await expect(packages.getByText('₹18,749')).toBeVisible();

  const itinerary = page.getByRole('region', { name: 'Day by day' });
  await expect(itinerary.getByRole('listitem')).toHaveCount(4);
  await expect(itinerary.getByRole('heading', { name: 'Water sports day' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Parasailing over Calangute' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Where and when to report' }).getByText('10:30 AM'),
  ).toBeVisible();
  expect(problems).toEqual([]);
});

test('Book on a tour card opens the booking for that tour, over the same page', async ({
  page,
}) => {
  await open(page, '/v/tidetrail', 'dark');

  await page.getByRole('link', { name: `Book ${GOA}` }).click();

  await expect(page).toHaveURL('/v/tidetrail?book=goa-coastal-escape');
  const dialog = page.getByRole('dialog', { name: 'Book this trip' });
  await expect(dialog.getByText(GOA)).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Confirm Booking' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL('/v/tidetrail');
  await expect(page.getByRole('heading', { level: 1, name: 'TideTrail' })).toBeVisible();
});

test('a category chip filters the suggested gear on a vertical page', async ({ page }) => {
  await open(page, '/v/tidetrail', 'dark');
  const gear = page.getByRole('region', { name: 'Suggested gear' });
  await expect(gear.getByRole('article').first()).toBeVisible();

  const all = await gear.getByRole('article').count();
  await gear.getByRole('button', { name: 'Water Gear' }).click();

  await expect(gear.getByRole('article')).not.toHaveCount(all);
  await expect(gear.getByRole('list').last()).not.toHaveAttribute('aria-busy');
  const cards = await gear.getByRole('article').all();
  expect(cards.length).toBeGreaterThan(0);
  for (const card of cards) await expect(card).toContainText('Water Gear');
});

test('gear store: category, climate and sort show in the URL and the results', async ({ page }) => {
  const problems = watchForErrors(page);
  await open(page, '/gear', 'dark');
  const filters = page.getByRole('region', { name: 'Filters' });
  const results = page.getByRole('region', { name: 'Gear' });
  const prices = async () =>
    (await results.locator('article span.font-extrabold').allTextContents()).map((text) =>
      Number(text.replace(/\D/g, '')),
    );

  await filters.getByRole('button', { name: 'Water Gear' }).click();
  await expect(page).toHaveURL(/\/gear\?category=water-gear$/);
  await filters.getByRole('button', { name: 'Tropical/Beach' }).click();
  await expect(page).toHaveURL(/category=water-gear&climate=tropical-beach$/);
  await filters.getByRole('combobox', { name: 'Sort by' }).selectOption('price_asc');
  await expect(page).toHaveURL(/category=water-gear&climate=tropical-beach&sort=price_asc$/);

  await expect(results.getByRole('list')).not.toHaveAttribute('aria-busy');
  const cards = await results.getByRole('article').all();
  expect(cards.length).toBeGreaterThan(0);
  for (const card of cards) await expect(card).toContainText('Water Gear');
  await expect(results.getByRole('status')).toContainText(`${cards.length} item`);
  const listed = await prices();
  expect(listed).toEqual([...listed].sort((a, b) => a - b));

  // The back button undoes one filter at a time, and a shared URL opens the same list.
  await page.goBack();
  await expect(page).toHaveURL(/category=water-gear&climate=tropical-beach$/);
  await expect(filters.getByRole('combobox', { name: 'Sort by' })).toHaveValue('newest');
  await page.goForward();
  await page.reload();
  await expect(filters.getByRole('button', { name: 'Water Gear' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(results.getByRole('article')).toHaveCount(cards.length);
  expect(problems).toEqual([]);
});

test('gear store: search, pages and clearing the filters', async ({ page }) => {
  await open(page, '/gear', 'dark');
  const results = page.getByRole('region', { name: 'Gear' });
  await expect(results.getByRole('article')).toHaveCount(12);

  await results.getByRole('button', { name: 'Next page' }).click();
  await expect(page).toHaveURL(/\/gear\?page=2$/);
  await expect(results.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await page.getByRole('searchbox', { name: 'Search gear' }).fill('no such gear anywhere');
  await expect(page).toHaveURL(/\/gear\?q=no\+such\+gear\+anywhere$/);
  await expect(results.getByText('No gear matches these filters.')).toBeVisible();
  await results.getByRole('button', { name: 'Clear filters' }).click();

  await expect(page).toHaveURL(/\/gear$/);
  await expect(page.getByRole('searchbox', { name: 'Search gear' })).toHaveValue('');
  await expect(results.getByRole('article')).toHaveCount(12);
});

test('search "goa" from the keyboard finds the Goa tour and opens it', async ({ page }) => {
  const problems = watchForErrors(page);
  await open(page, '/', 'dark');

  await page.keyboard.press('/');
  const dialog = page.getByRole('dialog', { name: 'Search' });
  const box = dialog.getByRole('searchbox', { name: 'Search tours and gear' });
  await expect(box).toBeFocused();
  await expect(box).toHaveValue('');

  await page.keyboard.type('goa');
  const result = dialog.getByRole('region', { name: 'Tours' }).getByRole('link', { name: GOA });
  await expect(result).toBeVisible();

  await page.keyboard.press('ArrowDown');
  await expect(result).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/tours\/goa-coastal-escape$/);
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { level: 1, name: GOA })).toBeVisible();

  // Escape closes it without going anywhere.
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(problems).toEqual([]);
});

test('a gear search result opens the store searched for it', async ({ page }) => {
  await open(page, '/', 'dark');

  await page.getByRole('button', { name: 'Search' }).click();
  const dialog = page.getByRole('dialog', { name: 'Search' });
  await dialog.getByRole('searchbox').fill('dry bag');
  await dialog.getByRole('link', { name: /DryTide 20L Roll-Top Dry Bag/ }).click();

  await expect(page).toHaveURL(/\/gear\?q=DryTide\+20L\+Roll-Top\+Dry\+Bag$/);
  await expect(page.getByRole('searchbox', { name: 'Search gear' })).toHaveValue(
    'DryTide 20L Roll-Top Dry Bag',
  );
  await expect(page.getByRole('region', { name: 'Gear' }).getByRole('article')).toHaveCount(1);
});

test('Buy opens a new tab that goes through /gear/:id/go to the seller', async ({
  page,
  context,
}) => {
  await open(page, '/gear?q=DryTide', 'dark');
  const buy = page.getByRole('link', { name: /^Buy DryTide/ });
  await expect(buy).toHaveAttribute('target', '_blank');
  await expect(buy).toHaveAttribute('rel', 'noopener noreferrer sponsored');

  // The seller is a placeholder host; answer for it here so the test needs no outside network.
  await context.route('https://example.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Seller</h1>' }),
  );
  const redirects = [];
  context.on('response', (response) => {
    if (/\/api\/v1\/gear\/[a-f\d]{24}\/go$/.test(response.url())) {
      redirects.push([response.status(), response.headers().location]);
    }
  });

  const [tab] = await Promise.all([context.waitForEvent('page'), buy.click()]);
  await tab.waitForURL('https://example.com/drytide-20l-dry-bag');

  expect(redirects).toEqual([[302, 'https://example.com/drytide-20l-dry-bag']]);
  await expect(page).toHaveURL(/\/gear\?q=DryTide$/);
});

test('an unknown vertical and an unknown tour show the not-found page', async ({ page }) => {
  for (const path of ['/v/moonwalk', '/tours/no-such-tour']) {
    await open(page, path, 'dark');
    await expect(
      page.getByRole('heading', { level: 1, name: 'This trail isn’t on the map.' }),
    ).toBeVisible();
  }
});

test('the navbar fits a 360px phone with search in it', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await open(page, '/gear', 'dark');

  const navbar = page.getByRole('navigation', { name: 'Main' });
  await expect(navbar.getByRole('button', { name: 'Search' })).toBeVisible();
  await expect(navbar.getByRole('link', { name: 'Sign in' })).toBeVisible();
  expect(await hasHorizontalScroll(page)).toBe(false);
});
