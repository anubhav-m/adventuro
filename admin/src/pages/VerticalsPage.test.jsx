import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { FIELD_MESSAGES } from '../lib/schemas.js';
import { serveContentLists } from '../test/contentApi.js';
import { TIDETRAIL_ITEM, VERTICAL_LIST } from '../test/fixtures.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, failure, record, server, success } from '../test/server.js';
import { VerticalEditPage } from './VerticalEditPage.jsx';
import { VerticalsPage } from './VerticalsPage.jsx';

const routes = [
  { path: '/verticals', element: <VerticalsPage /> },
  { path: '/verticals/:id', element: <VerticalEditPage /> },
];

beforeEach(() => serveContentLists());

const serveVertical = (vertical = TIDETRAIL_ITEM) =>
  server.use(http.get(api(`/admin/verticals/${vertical.id}`), () => success({ vertical })));

describe('VerticalsPage', () => {
  it('lists the six verticals with a link to edit each, and nothing to add or remove', async () => {
    renderRoutes(routes, { path: '/verticals' });

    // The loading table has the same name, so wait for the rows first.
    await screen.findByText('TideTrail');
    const table = screen.getByRole('table', { name: 'Verticals' });
    expect(within(table).getAllByRole('row')).toHaveLength(VERTICAL_LIST.length + 1);
    expect(within(table).getByText('Beaches • Islands • Coastal escapes')).toBeInTheDocument();
    expect(within(table).getAllByText('None yet')).toHaveLength(5);
    expect(within(table).getByRole('link', { name: 'Edit PeakPulse' })).toHaveAttribute(
      'href',
      `/verticals/${VERTICAL_LIST[2].id}`,
    );
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
  });
});

describe('VerticalEditPage', () => {
  it('saves the subtitle, description and hero image', async () => {
    serveVertical();
    const patched = record('patch', `/admin/verticals/${TIDETRAIL_ITEM.id}`, (body) =>
      success({ vertical: { ...TIDETRAIL_ITEM, ...body } }),
    );
    const user = userEvent.setup();
    renderRoutes(routes, { path: `/verticals/${TIDETRAIL_ITEM.id}` });

    expect(await screen.findByRole('heading', { level: 1, name: 'TideTrail' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Hero image, current image' })).toHaveAttribute(
      'src',
      TIDETRAIL_ITEM.heroImage.url,
    );
    await user.type(screen.getByRole('textbox', { name: 'Subtitle' }), ' • Surf');
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('TideTrail saved.')).toBeInTheDocument();
    expect(patched).toEqual([
      {
        subtitle: 'Beaches • Islands • Coastal escapes • Surf',
        description: TIDETRAIL_ITEM.description,
        heroImage: null,
      },
    ]);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled());
  });

  it('keeps the subtitle within its limit', async () => {
    serveVertical();
    const user = userEvent.setup();
    renderRoutes(routes, { path: `/verticals/${TIDETRAIL_ITEM.id}` });
    const subtitle = await screen.findByRole('textbox', { name: 'Subtitle' });

    // The field stops typing at the limit; a longer value can only arrive pasted past it.
    subtitle.removeAttribute('maxlength');
    await user.clear(subtitle);
    await user.click(subtitle);
    await user.paste('x'.repeat(301));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(subtitle).toHaveAccessibleDescription(FIELD_MESSAGES.subtitle));
  });

  it('shows why a save failed, and goes back to the list', async () => {
    serveVertical();
    server.use(
      http.patch(api(`/admin/verticals/${TIDETRAIL_ITEM.id}`), () =>
        failure(500, 'INTERNAL_ERROR'),
      ),
    );
    const user = userEvent.setup();
    const { router } = renderRoutes(routes, { path: `/verticals/${TIDETRAIL_ITEM.id}` });

    await user.type(await screen.findByRole('textbox', { name: 'Description' }), '!');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      await screen.findByText('Something went wrong on our side. Please try again in a moment.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'All verticals' }));
    await user.click(await screen.findByRole('button', { name: 'Leave' }));
    await waitFor(() => expect(currentUrl(router)).toBe('/verticals'));
  });
});
