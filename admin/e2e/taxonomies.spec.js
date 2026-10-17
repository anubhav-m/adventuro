import { randomUUID } from 'node:crypto';
import { expect, open, screenshot, test, watchForErrors } from './fixtures.js';

const toast = (page, text) => page.locator('[data-sonner-toast]', { hasText: text });

test.beforeEach(async ({ signInAs }) => {
  await signInAs('admin');
});

test('add, rename and delete a tag', async ({ page }, testInfo) => {
  const problems = watchForErrors(page);
  const name = `E2E ${testInfo.project.name} ${randomUUID().slice(0, 8)}`;
  await open(page, '/taxonomies?type=tag', 'dark');
  const panel = page.getByRole('tabpanel');

  await panel.getByRole('textbox', { name: 'New tag' }).fill(name);
  await panel.getByRole('button', { name: 'Add' }).click();
  await expect(toast(page, `${name} added.`)).toBeVisible();
  await expect(panel.getByRole('cell', { name, exact: true })).toBeVisible();

  await panel.getByRole('button', { name: `Rename ${name}` }).click();
  await panel.getByRole('textbox', { name: `New name for ${name}` }).fill(`${name} Renamed`);
  await page.keyboard.press('Enter');
  await expect(toast(page, `Renamed to ${name} Renamed.`)).toBeVisible();
  await expect(panel.getByRole('cell', { name: `${name} Renamed`, exact: true })).toBeVisible();

  await panel.getByRole('button', { name: `Delete ${name} Renamed` }).click();
  await page
    .getByRole('dialog', { name: `Delete ${name} Renamed?` })
    .getByRole('button', { name: 'Delete' })
    .click();
  await expect(toast(page, `${name} Renamed deleted.`)).toBeVisible();
  await expect(panel.getByRole('cell', { name: `${name} Renamed`, exact: true })).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('a category that gear still uses cannot be deleted', async ({ page }, testInfo) => {
  await open(page, '/taxonomies', 'light');

  await page.getByRole('button', { name: 'Delete Backpacks' }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete Backpacks?' });
  await dialog.getByRole('button', { name: 'Delete' }).click();

  await expect(dialog).toContainText(
    'Some gear still uses this, so it can’t be deleted. Take it off that gear first.',
  );
  await screenshot(page, testInfo, 'light-taxonomy-in-use');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(
    page.getByRole('tabpanel').getByRole('cell', { name: 'Backpacks', exact: true }),
  ).toBeVisible();
});
