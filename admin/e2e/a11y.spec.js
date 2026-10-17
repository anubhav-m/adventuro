import {
  adminApi,
  expect,
  findA11yViolations,
  open,
  stubGoogleSignIn,
  test,
  THEMES,
} from './fixtures.js';

// Every route of the admin app that needs no id.
const ADMIN_ROUTES = [
  '/',
  '/?range=custom&from=2026-01-01&to=2020-01-01',
  '/no/such/page',
  '/verticals',
  '/tours',
  '/tours/new',
  '/gear',
  '/gear/new',
  '/taxonomies',
  '/taxonomies?type=tag',
];

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

// Ids of demo content to open the editors on.
const ids = {};

test.beforeAll(async () => {
  const api = await adminApi();
  const read = async (path) => (await (await api.get(`/api/v1/admin${path}`)).json()).data;
  ids.vertical = (await read('/verticals')).verticals[0].id;
  ids.tour = (await read('/tours?q=Goa Coastal')).tours[0].id;
  ids.gear = (await read('/gear?q=DryTide')).gear[0].id;
  await api.dispose();
});

for (const theme of THEMES) {
  test.describe(`accessibility in the ${theme} theme`, () => {
    for (const path of ADMIN_ROUTES) {
      test(`${path} has no serious or critical violations`, async ({ page, signInAs }) => {
        await signInAs('admin');
        await open(page, path, theme);

        expect(await findA11yViolations(page)).toEqual([]);
      });
    }

    test('every tab of the tour editor has no serious or critical violations', async ({
      page,
      signInAs,
    }) => {
      await signInAs('admin');
      await open(page, `/tours/${ids.tour}`, theme);

      for (const tab of TOUR_TABS) {
        await page.getByRole('tab', { name: tab }).click();
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
        expect(await findA11yViolations(page), tab).toEqual([]);
      }
    });

    test('the tour editor with fields to fix has no serious or critical violations', async ({
      page,
      signInAs,
    }) => {
      await signInAs('admin');
      await open(page, '/tours/new', theme);

      await page.getByRole('textbox', { name: 'Title' }).fill('Unfinished tour');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByRole('tab', { name: /Packages \(needs attention\)/ })).toBeVisible();

      expect(await findA11yViolations(page)).toEqual([]);
    });

    test('the gear and vertical editors have no serious or critical violations', async ({
      page,
      signInAs,
    }) => {
      await signInAs('admin');
      await open(page, `/gear/${ids.gear}`, theme);
      await page.getByRole('button', { name: 'Linked tours' }).click();
      expect(await findA11yViolations(page)).toEqual([]);

      await open(page, `/verticals/${ids.vertical}`, theme);
      expect(await findA11yViolations(page)).toEqual([]);
    });

    test('the delete and unsaved-changes dialogs have no serious or critical violations', async ({
      page,
      signInAs,
    }) => {
      await signInAs('admin');
      await open(page, '/gear', theme);
      await page
        .getByRole('button', { name: /^Delete / })
        .first()
        .click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await findA11yViolations(page)).toEqual([]);

      await open(page, `/verticals/${ids.vertical}`, theme);
      await page.getByRole('textbox', { name: 'Subtitle' }).fill('Unsaved words');
      await page.getByRole('link', { name: 'All verticals' }).click();
      await expect(page.getByRole('dialog', { name: 'Leave without saving?' })).toBeVisible();
      expect(await findA11yViolations(page)).toEqual([]);
    });

    test('/login has no serious or critical violations', async ({ page }) => {
      await stubGoogleSignIn(page);
      await open(page, '/login', theme);
      await expect(page.getByText('Continue with Google')).toBeVisible();

      expect(await findA11yViolations(page)).toEqual([]);
    });

    test('the open drawer has no serious or critical violations', async ({
      page,
      signInAs,
    }, testInfo) => {
      test.skip(testInfo.project.name !== 'tablet', 'The drawer exists below 1024px only.');
      await signInAs('admin');
      await open(page, '/', theme);

      await page.getByRole('button', { name: 'Open menu' }).click();
      await expect(page.getByRole('dialog', { name: 'Adventuro Admin' })).toBeVisible();

      expect(await findA11yViolations(page)).toEqual([]);
    });
  });
}
