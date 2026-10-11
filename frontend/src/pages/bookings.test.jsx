import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../router.jsx';
import { BOOKING, CUSTOMER, pageMeta } from '../test/fixtures.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, failure, server, signedInAs, success } from '../test/server.js';

const NUMBER = BOOKING.bookingNumber;
const TICKET_URL = `/bookings/${NUMBER}`;

const mockBooking = (booking = BOOKING) =>
  server.use(http.get(api(`/bookings/${NUMBER}`), () => success({ booking })));

const openTicket = async (booking) => {
  signedInAs(CUSTOMER);
  mockBooking(booking);
  const view = renderRoutes(routes, { path: TICKET_URL });
  await screen.findByRole('heading', { level: 1, name: NUMBER });
  return { ...view, ticket: within(screen.getByRole('article')), user: userEvent.setup() };
};

// The text of the <dd>s that follow a <dt>, up to the next one.
const valuesOf = (scope, term) => {
  const values = [];
  let node = scope.getByText(term).nextElementSibling;
  while (node?.tagName === 'DD') {
    values.push(node.textContent);
    node = node.nextElementSibling;
  }
  return values;
};

describe('TicketPage', () => {
  it('shows every field of the booking', async () => {
    const { ticket } = await openTicket();

    expect(document.title).toBe(`Ticket ${NUMBER} · Adventuro`);
    expect(screen.getByRole('article')).toHaveAttribute('data-vertical', 'tidetrail');
    expect(ticket.getByText('TideTrail')).toBeInTheDocument();
    expect(ticket.getByText('Confirmed')).toBeInTheDocument();
    expect(valuesOf(ticket, 'Reporting location')).toEqual([
      'Dabolim Airport',
      'Arrivals gate 2, Dabolim',
    ]);
    expect(valuesOf(ticket, 'Reporting time')[0]).toBe('10:30 AM');
    expect(valuesOf(ticket, 'Tour')).toEqual(['Goa Coastal Escape']);
    expect(ticket.getByRole('link', { name: 'Goa Coastal Escape' })).toHaveAttribute(
      'href',
      '/tours/goa-coastal-escape',
    );
    expect(valuesOf(ticket, 'Package')).toEqual(['Explorer']);
    expect(valuesOf(ticket, 'Travelers')).toEqual(['2']);
    expect(valuesOf(ticket, 'Start date')).toEqual(['20 Dec 2026']);
    expect(valuesOf(ticket, 'Duration')).toEqual(['4 days']);
    expect(valuesOf(ticket, 'Total')).toEqual(['₹37,498', '₹18,749 × 2']);
    expect(valuesOf(ticket, 'Traveler contact')).toEqual([
      'Asha Customer',
      '+91 9876543210',
      'asha@example.com',
    ]);
    expect(screen.getByRole('link', { name: 'My bookings' })).toHaveAttribute(
      'href',
      '/account/bookings',
    );
  });

  it.each([
    ['completed', 'Completed'],
    ['cancelled', 'Cancelled'],
    ['on-hold', 'on-hold'],
  ])('names a %s booking’s status in words', async (status, label) => {
    const { ticket } = await openTicket({ ...BOOKING, status });

    expect(ticket.getByText(label)).toBeInTheDocument();
  });

  it('holds when the tour and its reporting details are gone', async () => {
    const { ticket } = await openTicket({
      ...BOOKING,
      tour: null,
      vertical: null,
      reporting: null,
    });

    expect(
      ticket.getByText('Reporting details for this trip are not available right now.'),
    ).toBeInTheDocument();
    expect(valuesOf(ticket, 'Tour')).toEqual(['Goa Coastal Escape']);
    expect(ticket.queryByRole('link', { name: 'Goa Coastal Escape' })).not.toBeInTheDocument();
    expect(ticket.getByText('TideTrail')).toBeInTheDocument();
  });

  describe('Download PDF', () => {
    const saved = [];

    beforeEach(() => {
      saved.length = 0;
      URL.createObjectURL = vi.fn(() => 'blob:ticket');
      URL.revokeObjectURL = vi.fn();
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
        saved.push({ href: this.href, download: this.download });
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      delete URL.createObjectURL;
      delete URL.revokeObjectURL;
    });

    it('fetches the ticket as a blob and saves it under the booking number', async () => {
      const requested = [];
      server.use(
        http.get(api(`/bookings/${NUMBER}/ticket`), ({ request }) => {
          requested.push(request.url);
          return new HttpResponse('%PDF-1.7', { headers: { 'Content-Type': 'application/pdf' } });
        }),
      );
      const { ticket, user } = await openTicket();

      await user.click(ticket.getByRole('button', { name: 'Download PDF' }));

      await waitFor(() =>
        expect(saved).toEqual([{ href: 'blob:ticket', download: `Adventuro-${NUMBER}.pdf` }]),
      );
      expect(requested).toHaveLength(1);
      const [[blob]] = URL.createObjectURL.mock.calls;
      expect(await blob.text()).toBe('%PDF-1.7');
      await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:ticket'));
      expect(document.querySelector('a[download]')).not.toBeInTheDocument();
    });

    it('says so beside the button when the download fails', async () => {
      server.use(http.get(api(`/bookings/${NUMBER}/ticket`), () => failure(500, 'INTERNAL_ERROR')));
      const { ticket, user } = await openTicket();

      await user.click(ticket.getByRole('button', { name: 'Download PDF' }));

      expect(await ticket.findByRole('alert')).toHaveTextContent(
        'Something went wrong on our side. Please try again in a moment.',
      );
      expect(saved).toEqual([]);
    });
  });

  it.each([
    ['another user’s or an unknown booking', 404, 'NOT_FOUND'],
    ['a number the API rejects', 400, 'VALIDATION_ERROR'],
  ])('shows the not-found page for %s', async (_case, status, code) => {
    signedInAs(CUSTOMER);
    server.use(http.get(api('/bookings/:bookingNumber'), () => failure(status, code)));
    renderRoutes(routes, { path: '/bookings/ADV-XX-2026-000001' });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'This trail isn’t on the map.' }),
    ).toBeInTheDocument();
  });

  it('shows an error with a retry when the booking fails to load', async () => {
    signedInAs(CUSTOMER);
    server.use(http.get(api('/bookings/:bookingNumber'), () => failure(500, 'INTERNAL_ERROR')));
    renderRoutes(routes, { path: TICKET_URL });
    const user = userEvent.setup();

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on our side.');

    mockBooking();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: NUMBER })).toBeInTheDocument();
  });

  it('sends a signed-out visitor to sign in, and back to the ticket', async () => {
    const { router } = renderRoutes(routes, { path: TICKET_URL });

    await screen.findByRole('heading', { level: 1, name: 'Sign in to Adventuro' });
    expect(currentUrl(router)).toBe(`/signin?next=${encodeURIComponent(TICKET_URL)}`);
  });
});

describe('MyBookingsPage', () => {
  const SECOND = {
    ...BOOKING,
    id: 'booking-2',
    bookingNumber: 'ADV-GS-2026-000007',
    status: 'cancelled',
    travelers: 4,
    startDate: '2027-01-05',
    totalAmount: 51996,
    snapshot: { ...BOOKING.snapshot, tourTitle: 'Jaisalmer Dunes Desert Camp' },
  };
  const THIRD = { ...BOOKING, id: 'booking-3', bookingNumber: 'ADV-PP-2026-000002' };

  // Two bookings on page 1, one on page 2.
  const mockMyBookings = (resolve) => {
    const requests = [];
    server.use(
      http.get(api('/bookings/me'), ({ request }) => {
        const params = Object.fromEntries(new URL(request.url).searchParams);
        requests.push(params);
        return resolve(params);
      }),
    );
    return requests;
  };
  const twoPages = ({ page }) =>
    success(
      { bookings: page === '2' ? [THIRD] : [BOOKING, SECOND] },
      { meta: pageMeta({ page: Number(page), limit: 10, total: 3, totalPages: 2 }) },
    );

  const openMyBookings = async (resolve = twoPages, path = '/account/bookings') => {
    signedInAs(CUSTOMER);
    const requests = mockMyBookings(resolve);
    const view = renderRoutes(routes, { path });
    await screen.findByRole('heading', { level: 1, name: 'My bookings' });
    return { ...view, requests, user: userEvent.setup() };
  };

  const rows = async () => {
    const list = screen.getByRole('list', { name: 'Bookings' });
    await waitFor(() => expect(list).not.toHaveAttribute('aria-busy'));
    return within(list).getAllByRole('listitem');
  };

  it('lists each booking with its number, tour, date, travelers, total and status', async () => {
    const { requests } = await openMyBookings();
    await screen.findByRole('link', { name: NUMBER });
    const [first, second] = await rows();

    expect(document.title).toBe('My bookings · Adventuro');
    expect(requests).toEqual([{ page: '1', limit: '10' }]);
    expect(first).toHaveTextContent(
      'BookingADV-TT-2026-000123TourGoa Coastal EscapeStart date20 Dec 2026Travelers2Total₹37,498StatusConfirmed',
    );
    expect(second).toHaveTextContent(
      'BookingADV-GS-2026-000007TourJaisalmer Dunes Desert CampStart date5 Jan 2027Travelers4Total₹51,996StatusCancelled',
    );
    expect(within(first).getByRole('link', { name: NUMBER })).toHaveAttribute('href', TICKET_URL);
  });

  it('opens a booking’s ticket from its row', async () => {
    const { user, router } = await openMyBookings();
    mockBooking();

    await user.click(await screen.findByRole('link', { name: NUMBER }));

    expect(await screen.findByRole('heading', { level: 1, name: NUMBER })).toBeInTheDocument();
    expect(currentUrl(router)).toBe(TICKET_URL);
  });

  it('turns the page through the URL', async () => {
    const { user, router, requests } = await openMyBookings();
    await screen.findByRole('link', { name: NUMBER });

    await user.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(await screen.findByRole('link', { name: THIRD.bookingNumber })).toBeInTheDocument();
    expect(await rows()).toHaveLength(1);
    expect(currentUrl(router)).toBe('/account/bookings?page=2');
    expect(requests.at(-1)).toEqual({ page: '2', limit: '10' });
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });

  it('opens on the page in the URL', async () => {
    const { requests } = await openMyBookings(twoPages, '/account/bookings?page=2');

    expect(await screen.findByRole('link', { name: THIRD.bookingNumber })).toBeInTheDocument();
    expect(requests).toEqual([{ page: '2', limit: '10' }]);
  });

  it('invites a customer with no bookings to explore', async () => {
    await openMyBookings(() =>
      success({ bookings: [] }, { meta: pageMeta({ limit: 10, total: 0, totalPages: 0 }) }),
    );

    expect(await screen.findByText('No trips booked yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore trips' })).toHaveAttribute(
      'href',
      '/#choose-your-adventure',
    );
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('shows an error with a retry when the list fails to load', async () => {
    await openMyBookings(() => failure(500, 'INTERNAL_ERROR'));
    const user = userEvent.setup();

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on our side.');

    mockMyBookings(twoPages);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('link', { name: NUMBER })).toBeInTheDocument();
  });

  it('sends a signed-out visitor to sign in', async () => {
    const { router } = renderRoutes(routes, { path: '/account/bookings?page=2' });

    await screen.findByRole('heading', { level: 1, name: 'Sign in to Adventuro' });
    expect(currentUrl(router)).toBe('/signin?next=%2Faccount%2Fbookings%3Fpage%3D2');
  });
});
