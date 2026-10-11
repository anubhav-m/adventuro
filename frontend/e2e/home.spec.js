import {
  expect,
  hasHorizontalScroll,
  open,
  screenshot,
  test,
  THEMES,
  watchForErrors,
} from './fixtures.js';

const BANDS = ['TideTrail', 'GoldenSaga', 'UrbanEcho', 'PeakPulse', 'EliteScape'];

const picker = (page) => page.getByRole('region', { name: 'Choose your adventure' });

// Every section has its data, the banner photo has loaded and nothing is still moving, so the
// screenshot is complete.
const waitForHome = async (page) => {
  await expect(picker(page).getByRole('link')).toHaveCount(BANDS.length + 1);
  await expect(page.getByRole('link', { name: 'Backpacks' })).toBeVisible();
  const photo = page.getByRole('img', { name: 'Grand India Tour' });
  await photo.scrollIntoViewIfNeeded();
  await expect
    .poll(() => photo.evaluate((image) => image.complete && image.naturalWidth > 0))
    .toBe(true);
  // Every timed animation has finished. The parallax ones follow the scroll and never do.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.timeline === document.timeline)
        .map((animation) => animation.finished),
    ),
  );
  await page.evaluate(() => window.scrollTo(0, 0));
};

for (const theme of THEMES) {
  test(`home in the ${theme} theme`, async ({ page }, testInfo) => {
    const problems = watchForErrors(page);
    await open(page, '/', theme);
    await waitForHome(page);

    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.getByRole('heading', { level: 1, name: 'Adventuro' })).toBeVisible();
    await expect(picker(page).getByRole('link').nth(0)).toContainText('Grand India Tour');
    for (const [index, name] of BANDS.entries()) {
      await expect(
        picker(page)
          .getByRole('link')
          .nth(index + 1),
      ).toContainText(name);
    }
    await expect(page.getByRole('link', { name: 'View Itinerary' })).toHaveAttribute(
      'href',
      /^\/tours\/grand-india-/,
    );
    await expect(page.getByRole('link', { name: 'Water Gear' })).toHaveAttribute(
      'href',
      '/gear?category=water-gear',
    );
    expect(await hasHorizontalScroll(page)).toBe(false);

    await screenshot(page, testInfo, `${theme}-home`, { fullPage: true });
    await screenshot(page, testInfo, `${theme}-home-fold`);
    expect(problems).toEqual([]);
  });
}

test('a signed-out visitor sees Sign in, and Book Now scrolls to the vertical picker', async ({
  page,
}) => {
  await open(page, '/', 'dark');
  const navbar = page.getByRole('navigation', { name: 'Main' });
  await expect(navbar.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin');
  await expect(navbar.getByRole('button', { name: 'Account' })).toHaveCount(0);

  await waitForHome(page);
  await page.getByRole('link', { name: 'Book Now' }).click();
  await expect(page).toHaveURL(/#choose-your-adventure$/);
  await expect(page.getByRole('heading', { name: 'Choose your adventure' })).toBeInViewport();
});

test('a terrain band opens its vertical from the keyboard', async ({ page }) => {
  await open(page, '/', 'dark');
  await waitForHome(page);
  await picker(page)
    .getByRole('link', { name: /PeakPulse/ })
    .focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/v\/peakpulse$/);
});
