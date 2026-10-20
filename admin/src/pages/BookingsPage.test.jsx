import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { serveContentLists } from '../test/contentApi.js';
import { BOOKING, BOOKING_LIST, CANCELLED_BOOKING, pageMeta, TOUR } from '../test/fixtures.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, failure, server, success } from '../test/server.js';
import { BookingsPage } from './BookingsPage.jsx';

const routes = [
  { path: '/bookings', element: <BookingsPage /> },
  { path: '/bookings/:bookingNumber', element: <h1>Booking page</h1> },
];

// Answers the list with `meta` and records the query of every request.
const serveBookings = (meta = pageMeta(BOOKING_LIST.length)) => {
  const queries = [];
  server.use(
    http.get(api('/admin/bookings'), ({ request }) => {
      queries.push(Object.fromEntries(new URL(request.url).searchParams));
      return success({ bookings: BOOKING_LIST }, { meta });
    }),
  );
  return queries;
};

beforeEach(() => serveContentLists());

const setup = async (path = '/bookings') => {
  const view = renderRoutes(routes, { path });
  await screen.findByRole('heading', { level: 1, name: 'Bookings' });
  return { user: userEvent.setup(), ...view };
};

const rows = () => within(screen.getByRole('table', { name: 'Bookings' })).getAllByRole('row');
const cells = (row) => [...row.cells].map((cell) => cell.textContent);

describe('BookingsPage', () => {
  it('lists each booking with every column, newest first as the server sends them', async () => {
    serveBookings();
    await setup();
    await screen.findByText(BOOKING.bookingNumber);

    expect(cells(rows()[0])).toEqual([
      'Booking',
      'Customer',
      'Tour',
      'Package',
      'Travelers',
      'Start date',
      'Total',
      'Status',
      'Booked',
    ]);
    expect(cells(rows()[1])).toEqual([
      'ADV-TT-2026-000002',
      'Asha Customer',
      'Goa Coastal EscapeTideTrail',
      'Explorer',
      '2',
      '11 Nov 2026',
      '₹37,498',
      'Confirmed',
      '12 Oct 2026',
    ]);
    expect(within(rows()[2]).getByText('Cancelled')).toBeInTheDocument();
    expect(within(rows()[3]).getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–3 of 3')).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Bookings · Adventuro Admin'));
  });

  it('opens a booking from its number', async () => {
    serveBookings();
    const { user, router } = await setup();

    await user.click(await screen.findByRole('link', { name: CANCELLED_BOOKING.bookingNumber }));

    expect(await screen.findByRole('heading', { name: 'Booking page' })).toBeInTheDocument();
    expect(currentUrl(router)).toBe(`/bookings/${CANCELLED_BOOKING.bookingNumber}`);
  });

  it('writes each filter to the URL and sends it to the server', async () => {
    const queries = serveBookings();
    const { user, router } = await setup();
    await screen.findByText(BOOKING.bookingNumber);
    expect(queries).toEqual([{ page: '1', limit: '20' }]);

    const status = screen.getByRole('combobox', { name: 'Status' });
    await user.selectOptions(status, 'Confirmed');
    const vertical = screen.getByRole('combobox', { name: 'Vertical' });
    await waitFor(() => expect(within(vertical).getByText('TideTrail')).toBeInTheDocument());
    await user.selectOptions(vertical, 'TideTrail');
    const tour = screen.getByRole('combobox', { name: 'Tour' });
    await waitFor(() => expect(within(tour).getByText(TOUR.title)).toBeInTheDocument());
    await user.selectOptions(tour, TOUR.title);
    await user.type(screen.getByLabelText('Booked from'), '2026-10-01');
    await user.type(screen.getByLabelText('Booked to'), '2026-10-31');
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'asha');

    const expected = {
      status: 'confirmed',
      vertical: 'tidetrail',
      tour: TOUR.id,
      from: '2026-10-01',
      to: '2026-10-31',
      q: 'asha',
    };
    await waitFor(() => expect(queries.at(-1)).toEqual({ ...expected, page: '1', limit: '20' }));
    expect(Object.fromEntries(new URLSearchParams(router.state.location.search))).toEqual(expected);
  });

  it('reads the filters and page from the URL on arrival', async () => {
    const queries = serveBookings(pageMeta(45, { page: 2 }));
    await setup('/bookings?status=cancelled&q=ADV-GS&from=2026-10-01&page=2');
    await screen.findByText(BOOKING.bookingNumber);

    expect(queries).toEqual([
      { status: 'cancelled', q: 'ADV-GS', from: '2026-10-01', page: '2', limit: '20' },
    ]);
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('cancelled');
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('ADV-GS');
    expect(screen.getByLabelText('Booked from')).toHaveValue('2026-10-01');
    expect(screen.getByText('Showing 21–23 of 45')).toBeInTheDocument();
  });

  it('turns the page through the URL and keeps the filters', async () => {
    const queries = serveBookings(pageMeta(45));
    const { user, router } = await setup('/bookings?status=confirmed');
    await screen.findByText(BOOKING.bookingNumber);

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() =>
      expect(queries.at(-1)).toEqual({ status: 'confirmed', page: '2', limit: '20' }),
    );
    expect(currentUrl(router)).toBe('/bookings?status=confirmed&page=2');
  });

  it('does not ask for a range that ends before it starts, and says so', async () => {
    const queries = serveBookings();
    await setup('/bookings?from=2026-10-31&to=2026-10-01');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Pick a “Booked from” day on or before the “Booked to” day.',
    );
    expect(screen.queryByRole('table', { name: 'Bookings' })).not.toBeInTheDocument();
    expect(queries).toEqual([]);
  });

  it('says when no booking matches', async () => {
    server.use(
      http.get(api('/admin/bookings'), () => success({ bookings: [] }, { meta: pageMeta(0) })),
    );
    await setup('/bookings?q=nobody');

    expect(await screen.findByText('No bookings match these filters.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('shows our own words when the list fails', async () => {
    server.use(http.get(api('/admin/bookings'), () => failure(500, 'INTERNAL_ERROR')));
    await setup();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong on our side.');
    expect(alert).not.toHaveTextContent('Raw server message');
  });
});
