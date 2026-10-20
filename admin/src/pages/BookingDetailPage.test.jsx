import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { captureDownloads } from '../test/downloads.js';
import { BOOKING, CANCELLED_BOOKING, COMPLETED_BOOKING, pageMeta } from '../test/fixtures.js';
import { renderRoutes } from '../test/render.jsx';
import { api, failure, record, server, success } from '../test/server.js';
import { BookingDetailPage } from './BookingDetailPage.jsx';
import { BookingsPage } from './BookingsPage.jsx';

const routes = [
  { path: '/bookings', element: <BookingsPage /> },
  { path: '/bookings/:bookingNumber', element: <BookingDetailPage /> },
  { path: '/users/:id', element: <h1>User page</h1> },
  { path: '/tours/:id', element: <h1>Tour editor</h1> },
];

// Answers the booking's page with whatever `current()` returns at the time.
const serveBooking = (current) =>
  server.use(
    http.get(api('/admin/bookings/:bookingNumber'), () => success({ booking: current() })),
  );

const setup = async (booking = BOOKING) => {
  serveBooking(() => booking);
  const view = renderRoutes(routes, { path: `/bookings/${booking.bookingNumber}` });
  // The heading shows while the booking loads, so wait for the booking itself.
  await screen.findByRole('region', { name: 'Trip' });
  return { user: userEvent.setup(), ...view };
};

const plate = (name) => screen.getByRole('region', { name });
const fact = (name, label) =>
  within(plate(name)).getByText(label, { selector: 'dt' }).nextElementSibling;
const statusButtons = () =>
  screen.queryAllByRole('button', { name: /^(Mark completed|Cancel booking)$/ });

const downloads = captureDownloads();

describe('BookingDetailPage', () => {
  it('shows the trip, the customer’s contact, the reporting details and the record', async () => {
    await setup();

    expect(document.title).toBe(`${BOOKING.bookingNumber} · Adventuro Admin`);
    expect(screen.getByText('Goa Coastal Escape · Asha Customer')).toBeInTheDocument();
    expect(fact('Trip', 'Tour')).toHaveTextContent('Goa Coastal Escape');
    expect(within(fact('Trip', 'Tour')).getByRole('link')).toHaveAttribute(
      'href',
      `/tours/${BOOKING.tour.id}`,
    );
    expect(fact('Trip', 'Vertical')).toHaveTextContent('TideTrail');
    expect(fact('Trip', 'Package')).toHaveTextContent('Explorer');
    expect(fact('Trip', 'Start date')).toHaveTextContent('11 Nov 2026');
    expect(fact('Trip', 'Duration')).toHaveTextContent('4 days');
    expect(fact('Trip', 'Travelers')).toHaveTextContent('2');
    expect(fact('Trip', 'Total')).toHaveTextContent('₹37,498 (₹18,749 × 2)');

    expect(within(fact('Customer', 'Name')).getByRole('link')).toHaveAttribute(
      'href',
      `/users/${BOOKING.user}`,
    );
    expect(within(fact('Customer', 'Phone')).getByRole('link')).toHaveAttribute(
      'href',
      'tel:+919876543210',
    );
    expect(within(fact('Customer', 'Email')).getByRole('link')).toHaveAttribute(
      'href',
      'mailto:asha@example.com',
    );

    expect(fact('Reporting', 'Time')).toHaveTextContent('10:30');
    expect(fact('Reporting', 'Location')).toHaveTextContent('Dabolim Airport');
    expect(fact('Reporting', 'Address')).toHaveTextContent('Goa');

    expect(fact('Record', 'Status')).toHaveTextContent('Confirmed');
    expect(fact('Record', 'Booked')).toHaveTextContent('12 Oct 2026, 12:00 PM');
    expect(fact('Record', 'Status changed')).toHaveTextContent('Never');
  });

  it('says so when the tour no longer exists, and does not link to it', async () => {
    await setup({ ...BOOKING, tour: null, reporting: null });

    expect(within(fact('Trip', 'Tour')).queryByRole('link')).not.toBeInTheDocument();
    expect(plate('Reporting')).toHaveTextContent(
      'The tour no longer exists, so there are no details.',
    );
  });

  it.each([
    ['confirmed', BOOKING, ['Mark completed', 'Cancel booking']],
    ['completed', COMPLETED_BOOKING, []],
    ['cancelled', CANCELLED_BOOKING, []],
  ])('offers status changes for a %s booking: %j', async (_status, booking, labels) => {
    await setup(booking);

    expect(statusButtons().map((button) => button.textContent)).toEqual(labels);
    expect(screen.getByRole('button', { name: 'Download ticket PDF' })).toBeInTheDocument();
  });

  it('marks a booking completed after asking, then shows it everywhere without the actions', async () => {
    let current = BOOKING;
    const updated = {
      ...BOOKING,
      status: 'completed',
      statusUpdatedAt: '2026-10-20T04:30:00.000Z',
    };
    const patched = record('patch', `/admin/bookings/${BOOKING.bookingNumber}/status`, () => {
      current = updated;
      return success({ booking: updated });
    });
    const listed = [];
    server.use(
      http.get(api('/admin/bookings'), () => {
        listed.push(current.status);
        return success({ bookings: [current] }, { meta: pageMeta(1) });
      }),
    );
    const { user } = await setup();
    serveBooking(() => current);

    // The list is read once, so it is cached when the detail changes.
    await user.click(screen.getByRole('link', { name: 'All bookings' }));
    await screen.findByRole('link', { name: BOOKING.bookingNumber });
    await user.click(screen.getByRole('link', { name: BOOKING.bookingNumber }));
    await screen.findByRole('region', { name: 'Trip' });

    await user.click(screen.getByRole('button', { name: 'Mark completed' }));
    const dialog = screen.getByRole('dialog', { name: `Mark ${BOOKING.bookingNumber} completed?` });
    expect(dialog).toHaveTextContent('Asha Customer · Goa Coastal Escape');
    await user.click(within(dialog).getByRole('button', { name: 'Mark completed' }));

    expect(
      await screen.findByText(`${BOOKING.bookingNumber} is marked completed.`),
    ).toBeInTheDocument();
    expect(patched).toEqual([{ status: 'completed' }]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fact('Record', 'Status')).toHaveTextContent('Completed');
    expect(fact('Record', 'Status changed')).toHaveTextContent('20 Oct 2026, 10:00 AM');
    expect(statusButtons()).toEqual([]);

    // The cached list was marked stale, so going back reads it again.
    await user.click(screen.getByRole('link', { name: 'All bookings' }));
    await waitFor(() => expect(listed).toEqual(['confirmed', 'completed']));
    expect(
      within(screen.getByRole('table', { name: 'Bookings' })).getByText('Completed'),
    ).toBeInTheDocument();
  });

  it('cancels a booking after asking, and keeps it as it is when the admin backs out', async () => {
    const patched = record('patch', `/admin/bookings/${BOOKING.bookingNumber}/status`, () =>
      success({ booking: { ...BOOKING, status: 'cancelled' } }),
    );
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Cancel booking' }));
    await user.click(screen.getByRole('button', { name: 'Keep as it is' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(patched).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Cancel booking' }));
    const dialog = screen.getByRole('dialog', { name: `Cancel ${BOOKING.bookingNumber}?` });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel booking' }));

    expect(await screen.findByText(`${BOOKING.bookingNumber} is cancelled.`)).toBeInTheDocument();
    expect(patched).toEqual([{ status: 'cancelled' }]);
    expect(fact('Record', 'Status')).toHaveTextContent('Cancelled');
    expect(statusButtons()).toEqual([]);
  });

  it('says in our words, inside the dialog, when the change is refused', async () => {
    server.use(
      http.patch(api(`/admin/bookings/${BOOKING.bookingNumber}/status`), () =>
        failure(409, 'INVALID_STATUS_TRANSITION'),
      ),
    );
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Mark completed' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Mark completed' }));

    expect(
      await within(dialog).findByText("This booking's status can't be changed that way."),
    ).toBeInTheDocument();
    expect(dialog).not.toHaveTextContent('Raw server message');
    expect(fact('Record', 'Status')).toHaveTextContent('Confirmed');
  });

  it('downloads the ticket as a PDF named after the booking', async () => {
    const pdf = new Uint8Array([37, 80, 68, 70]);
    server.use(
      http.get(
        api(`/bookings/${BOOKING.bookingNumber}/ticket`),
        () => new HttpResponse(pdf, { headers: { 'Content-Type': 'application/pdf' } }),
      ),
    );
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Download ticket PDF' }));

    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloads[0].filename).toBe(`Adventuro-${BOOKING.bookingNumber}.pdf`);
    expect(downloads[0].blob.size).toBe(4);
  });

  it('says in our words when the ticket cannot be downloaded', async () => {
    server.use(
      http.get(api(`/bookings/${BOOKING.bookingNumber}/ticket`), () =>
        failure(500, 'INTERNAL_ERROR'),
      ),
    );
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Download ticket PDF' }));

    expect(
      await screen.findByText('Something went wrong on our side. Please try again in a moment.'),
    ).toBeInTheDocument();
  });

  it('keeps the booking number as the title when the booking is not found', async () => {
    server.use(http.get(api('/admin/bookings/:bookingNumber'), () => failure(404, 'NOT_FOUND')));
    renderRoutes(routes, { path: '/bookings/ADV-TT-2026-999999' });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'ADV-TT-2026-999999' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't find what you're looking for.",
    );
  });
});
