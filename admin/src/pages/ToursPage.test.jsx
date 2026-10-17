import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { serveContentLists } from '../test/contentApi.js';
import { DRAFT_TOUR, pageMeta, TOUR, TOUR_LIST } from '../test/fixtures.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, failure, record, server, success } from '../test/server.js';
import { ToursPage } from './ToursPage.jsx';

const routes = [
  { path: '/tours', element: <ToursPage /> },
  { path: '/tours/new', element: <h1>New tour page</h1> },
  { path: '/tours/:id', element: <h1>Tour page</h1> },
];

// Answers the list with `tours`, and keeps the query of every request.
const serveTours = (tours = TOUR_LIST, meta = pageMeta(tours.length)) => {
  const queries = [];
  server.use(
    http.get(api('/admin/tours'), ({ request }) => {
      queries.push(Object.fromEntries(new URL(request.url).searchParams));
      return success({ tours }, { meta });
    }),
  );
  return queries;
};

beforeEach(() => serveContentLists());

const setup = async (path = '/tours') => {
  const view = renderRoutes(routes, { path });
  await screen.findByRole('table', { name: 'Tours' });
  await screen.findByText(TOUR.title);
  return { user: userEvent.setup(), ...view };
};

const row = (title) => screen.getByText(title).closest('tr');

describe('ToursPage', () => {
  it('lists every tour with its vertical, price and state', async () => {
    serveTours();
    await setup();

    expect(screen.getByRole('heading', { level: 1, name: 'Tours' })).toBeInTheDocument();
    const goa = within(row(TOUR.title));
    expect(goa.getByText('TideTrail')).toBeInTheDocument();
    expect(goa.getByText('₹14,999')).toBeInTheDocument();
    expect(goa.getByRole('switch', { name: `Published: ${TOUR.title}` })).toBeChecked();
    expect(goa.getByRole('link', { name: `Edit ${TOUR.title}` })).toHaveAttribute(
      'href',
      `/tours/${TOUR.id}`,
    );
    expect(
      within(row(DRAFT_TOUR.title)).getByRole('switch', { name: `Published: ${DRAFT_TOUR.title}` }),
    ).not.toBeChecked();
    expect(screen.getByRole('link', { name: 'New tour' })).toHaveAttribute('href', '/tours/new');
  });

  it('filters by vertical, status and search, from the URL', async () => {
    const queries = serveTours();
    const { user, router } = await setup();
    expect(queries[0]).toEqual({ page: '1', limit: '20' });

    await waitFor(() =>
      expect(within(screen.getByRole('combobox', { name: 'Vertical' })).getByText('PeakPulse')),
    );
    await user.selectOptions(screen.getByRole('combobox', { name: 'Vertical' }), 'PeakPulse');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'Draft');
    // One letter is too short to search by; two are enough.
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 's');
    await waitFor(() => expect(currentUrl(router)).toContain('q=s'));
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'p');

    await waitFor(() =>
      expect(queries.at(-1)).toEqual({
        vertical: 'peakpulse',
        isPublished: 'false',
        q: 'sp',
        page: '1',
        limit: '20',
      }),
    );
    expect(queries.some((query) => query.q === 's')).toBe(false);
  });

  it('turns the page', async () => {
    const queries = serveTours(TOUR_LIST, { page: 1, limit: 20, total: 45, totalPages: 3 });
    const { user, router } = await setup();

    await user.click(screen.getByRole('button', { name: 'Page 2' }));

    await waitFor(() => expect(queries.at(-1)).toMatchObject({ page: '2' }));
    expect(currentUrl(router)).toBe('/tours?page=2');
  });

  it('publishes and unpublishes from the list', async () => {
    serveTours();
    const patched = record('patch', `/admin/tours/${TOUR.id}`, (body) =>
      success({ tour: { ...TOUR, ...body } }),
    );
    const { user } = await setup();

    await user.click(screen.getByRole('switch', { name: `Published: ${TOUR.title}` }));

    expect(await screen.findByText(`${TOUR.title} is now a draft.`)).toBeInTheDocument();
    expect(patched).toEqual([{ isPublished: false }]);
  });

  it('says why a publish change failed, in our words', async () => {
    serveTours();
    server.use(
      http.patch(api(`/admin/tours/${DRAFT_TOUR.id}`), () => failure(500, 'INTERNAL_ERROR')),
    );
    const { user } = await setup();

    await user.click(screen.getByRole('switch', { name: `Published: ${DRAFT_TOUR.title}` }));

    expect(
      await screen.findByText('Something went wrong on our side. Please try again in a moment.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: `Published: ${DRAFT_TOUR.title}` }),
    ).not.toBeChecked();
  });

  it('deletes a tour after asking, naming it', async () => {
    const queries = serveTours();
    server.use(http.delete(api(`/admin/tours/${DRAFT_TOUR.id}`), () => success()));
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: `Delete ${DRAFT_TOUR.title}` }));
    const dialog = screen.getByRole('dialog', { name: `Delete ${DRAFT_TOUR.title}?` });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText(`${DRAFT_TOUR.title} deleted.`)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(queries).toHaveLength(2));
  });

  it('offers to unpublish a tour that has bookings instead of deleting it', async () => {
    serveTours();
    server.use(http.delete(api(`/admin/tours/${TOUR.id}`), () => failure(409, 'RESOURCE_IN_USE')));
    const patched = record('patch', `/admin/tours/${TOUR.id}`, (body) =>
      success({ tour: { ...TOUR, ...body } }),
    );
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: `Delete ${TOUR.title}` }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    const dialog = await screen.findByRole('dialog', { name: `Unpublish ${TOUR.title} instead?` });
    expect(dialog).toHaveTextContent('This tour has bookings — unpublish it instead.');
    expect(dialog).not.toHaveTextContent('Raw server message');
    await user.click(within(dialog).getByRole('button', { name: 'Unpublish instead' }));

    expect(
      await screen.findByText(`${TOUR.title} is now a draft. Its bookings are kept.`),
    ).toBeInTheDocument();
    expect(patched).toEqual([{ isPublished: false }]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('only explains when a draft with bookings cannot be deleted', async () => {
    serveTours();
    server.use(
      http.delete(api(`/admin/tours/${DRAFT_TOUR.id}`), () => failure(409, 'RESOURCE_IN_USE')),
    );
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: `Delete ${DRAFT_TOUR.title}` }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    const dialog = await screen.findByRole('dialog', {
      name: `${DRAFT_TOUR.title} can’t be deleted`,
    });
    expect(dialog).toHaveTextContent('It is already a draft, so customers can’t see it.');
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the dialog open with the reason when a delete fails otherwise', async () => {
    serveTours();
    server.use(http.delete(api(`/admin/tours/${TOUR.id}`), () => failure(500, 'INTERNAL_ERROR')));
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: `Delete ${TOUR.title}` }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    const dialog = screen.getByRole('dialog', { name: `Delete ${TOUR.title}?` });
    expect(
      await within(dialog).findByText(
        'Something went wrong on our side. Please try again in a moment.',
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
