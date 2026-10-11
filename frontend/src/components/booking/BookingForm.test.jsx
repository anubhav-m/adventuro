import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../../lib/constants.js';
import { getIstDateOnly } from '../../lib/format.js';
import { routes } from '../../router.jsx';
import {
  BOOKING,
  CUSTOMER,
  GEAR,
  GOA_TOUR,
  INCOMPLETE_CUSTOMER,
  mockGear,
  mockTour,
} from '../../test/fixtures.js';
import { installGoogleIdentity } from '../../test/googleIdentity.js';
import { currentUrl, renderRoutes } from '../../test/render.jsx';
import { api, failure, record, server, signedInAs, success } from '../../test/server.js';

const google = installGoogleIdentity();

// The modal lives in the layout, so it opens over any page. About needs no data of its own.
const BOOKING_URL = '/about?book=goa-coastal-escape';
const DATE_MESSAGE = 'Pick a start date from tomorrow up to a year ahead.';
const VALID_DATE = getIstDateOnly(30);

const openBooking = async ({ as = CUSTOMER, path = BOOKING_URL } = {}) => {
  if (as) signedInAs(as);
  mockTour();
  const gearRequests = mockGear();
  const view = renderRoutes(routes, { path });
  const dialog = within(await screen.findByRole('dialog', { name: 'Book this trip' }));
  await waitFor(() =>
    expect(dialog.getByRole('button', { name: 'Confirm Booking' })).toBeEnabled(),
  );
  return { ...view, dialog, gearRequests, user: userEvent.setup() };
};

const startDate = (dialog) => dialog.getByLabelText('Start date');
const pickDate = (dialog, value) => fireEvent.change(startDate(dialog), { target: { value } });
const travelers = (dialog) =>
  within(dialog.getByRole('group', { name: 'travelers' })).getByRole('status');
const total = (dialog) => dialog.getByRole('status', { name: 'Total' });
const confirm = (user, dialog) =>
  user.click(dialog.getByRole('button', { name: 'Confirm Booking' }));

// Explorer for three, a month from now.
const fillBooking = async (user, dialog) => {
  await user.click(dialog.getByRole('radio', { name: /Explorer/ }));
  await user.click(dialog.getByRole('button', { name: 'More travelers' }));
  await user.click(dialog.getByRole('button', { name: 'More travelers' }));
  pickDate(dialog, VALID_DATE);
};

describe('BookingForm', () => {
  it('opens on the tour named in the URL, with its first package and one traveler', async () => {
    const { dialog } = await openBooking();

    expect(dialog.getByText('Goa Coastal Escape')).toBeInTheDocument();
    expect(dialog.getByText('TideTrail')).toBeInTheDocument();
    expect(dialog.getByText('4 days · North Goa, Goa')).toBeInTheDocument();
    expect(dialog.getByRole('group', { name: 'Package' })).toBeInTheDocument();
    expect(dialog.getByRole('radio', { name: /Essential/ })).toBeChecked();
    expect(travelers(dialog)).toHaveTextContent('1');
    expect(startDate(dialog)).toHaveValue('');
    expect(total(dialog)).toHaveTextContent('₹14,999');
    expect(dialog.getByText('Nothing is charged when you confirm.')).toBeInTheDocument();
    expect(dialog.queryByRole('button', { name: /pay/i })).not.toBeInTheDocument();
  });

  it('starts on the package the Book link named', async () => {
    const { dialog } = await openBooking({ path: `${BOOKING_URL}&tier=tier-3` });

    expect(dialog.getByRole('radio', { name: /VIP Palace/ })).toBeChecked();
    expect(total(dialog)).toHaveTextContent('₹25,498');
  });

  it('keeps the total at package price × travelers as either changes', async () => {
    const { dialog, user } = await openBooking();

    await user.click(dialog.getByRole('button', { name: 'More travelers' }));
    await user.click(dialog.getByRole('button', { name: 'More travelers' }));
    expect(total(dialog)).toHaveTextContent('₹44,997');
    expect(dialog.getByText('Essential · ₹14,999 × 3 travelers')).toBeInTheDocument();

    await user.click(dialog.getByRole('radio', { name: /Explorer/ }));
    expect(total(dialog)).toHaveTextContent('₹56,247');

    await user.click(dialog.getByRole('button', { name: 'Fewer travelers' }));
    await user.click(dialog.getByRole('button', { name: 'Fewer travelers' }));
    expect(total(dialog)).toHaveTextContent('₹18,749');
    expect(dialog.getByText('Explorer · ₹18,749 × 1 traveler')).toBeInTheDocument();
  });

  it('keeps travelers between 1 and 20', async () => {
    const { dialog, user } = await openBooking();
    const fewer = dialog.getByRole('button', { name: 'Fewer travelers' });
    const more = dialog.getByRole('button', { name: 'More travelers' });

    expect(fewer).toBeDisabled();
    for (let count = 1; count < 20; count += 1) await user.click(more);

    expect(travelers(dialog)).toHaveTextContent('20');
    expect(more).toBeDisabled();
    expect(fewer).toBeEnabled();
    expect(total(dialog)).toHaveTextContent('₹2,99,980');
  });

  it('offers start dates from tomorrow (IST) to 365 days ahead', async () => {
    const { dialog } = await openBooking();

    expect(startDate(dialog)).toHaveAttribute('type', 'date');
    expect(startDate(dialog)).toHaveAttribute('min', getIstDateOnly(1));
    expect(startDate(dialog)).toHaveAttribute('max', getIstDateOnly(365));
  });

  it.each([
    ['no date', ''],
    ['today', getIstDateOnly(0)],
    ['a day past the window', getIstDateOnly(366)],
  ])('rejects %s without calling the API', async (_label, value) => {
    const received = record('post', '/bookings', () => success({ booking: BOOKING }));
    const { dialog, user } = await openBooking();

    if (value) pickDate(dialog, value);
    await confirm(user, dialog);

    expect(await dialog.findByRole('alert')).toHaveTextContent(DATE_MESSAGE);
    expect(startDate(dialog)).toBeInvalid();
    expect(received).toEqual([]);
  });

  it.each([
    ['tomorrow', getIstDateOnly(1)],
    ['the last day of the window', getIstDateOnly(365)],
  ])('accepts %s', async (_label, value) => {
    const received = record('post', '/bookings', () => failure(500, 'INTERNAL_ERROR'));
    const { dialog, user } = await openBooking();

    pickDate(dialog, value);
    await confirm(user, dialog);

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0].startDate).toBe(value);
  });

  it('books the chosen package and opens the ticket', async () => {
    const received = record('post', '/bookings', () => success({ booking: BOOKING }));
    server.use(http.get(api('/bookings/:bookingNumber'), () => success({ booking: BOOKING })));
    const { dialog, user, router } = await openBooking();

    await fillBooking(user, dialog);
    await confirm(user, dialog);

    expect(
      await screen.findByRole('heading', { level: 1, name: BOOKING.bookingNumber }),
    ).toBeInTheDocument();
    expect(currentUrl(router)).toBe('/bookings/ADV-TT-2026-000123');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(received).toEqual([
      { tourId: GOA_TOUR.id, tierId: 'tier-2', travelers: 3, startDate: VALID_DATE },
    ]);
  });

  it('disables Confirm while the booking is being made', async () => {
    let finish;
    server.use(
      http.post(api('/bookings'), async () => {
        await new Promise((resolve) => {
          finish = resolve;
        });
        return failure(500, 'INTERNAL_ERROR');
      }),
    );
    const { dialog, user } = await openBooking();
    const button = dialog.getByRole('button', { name: 'Confirm Booking' });

    pickDate(dialog, VALID_DATE);
    await confirm(user, dialog);

    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveAttribute('aria-busy', 'true');

    await act(async () => finish());
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('says so inline when the trip or package is no longer available', async () => {
    record('post', '/bookings', () => failure(409, 'TOUR_UNAVAILABLE'));
    const { dialog, user, router } = await openBooking();

    pickDate(dialog, VALID_DATE);
    await confirm(user, dialog);

    const alert = await dialog.findByRole('alert');
    expect(alert).toHaveTextContent(
      "This trip or package isn't available right now. Please pick another.",
    );
    expect(alert).not.toHaveTextContent('Raw server message');
    expect(currentUrl(router)).toBe(BOOKING_URL);
  });

  it('shows our own wording on a start date the server rejects', async () => {
    record('post', '/bookings', () =>
      failure(400, 'VALIDATION_ERROR', {
        errors: [{ field: 'startDate', message: 'Start date must be between…' }],
      }),
    );
    const { dialog, user } = await openBooking();

    pickDate(dialog, VALID_DATE);
    await confirm(user, dialog);

    expect(await dialog.findByRole('alert')).toHaveTextContent(DATE_MESSAGE);
    expect(dialog.getAllByRole('alert')).toHaveLength(1);
    expect(startDate(dialog)).toHaveAccessibleDescription(DATE_MESSAGE);
  });

  it('lists the recommended gear as affiliate links, outside the total', async () => {
    const { dialog, gearRequests } = await openBooking();
    const gear = within(dialog.getByRole('region', { name: 'Recommended gear' }));
    const links = await gear.findAllByRole('link');

    expect(gearRequests).toContainEqual({ tour: 'goa-coastal-escape', limit: '4' });
    expect(links).toHaveLength(GEAR.length);
    expect(links[0]).toHaveAccessibleName(
      'DryTide 20L Roll-Top Dry Bag, ₹899 (opens in a new tab)',
    );
    expect(links[0]).toHaveAttribute('href', `/api/v1/gear/${GEAR[0].id}/go`);
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer sponsored');
    expect(gear.getByText(/not part of this booking or its\s+total/)).toBeInTheDocument();
    expect(total(dialog)).toHaveTextContent('₹14,999');
  });

  it('says when no gear has been picked for the trip', async () => {
    signedInAs(CUSTOMER);
    mockTour();
    mockGear(() => ({ gear: [] }));
    renderRoutes(routes, { path: BOOKING_URL });

    expect(await screen.findByText('No gear picked for this trip yet.')).toBeInTheDocument();
  });

  it('closes back to the page it was opened on', async () => {
    const { dialog, user, router } = await openBooking({ path: `${BOOKING_URL}&tier=tier-2` });

    await user.click(dialog.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(currentUrl(router)).toBe('/about');
  });

  it('explains a tour that cannot be found instead of a form', async () => {
    server.use(http.get(api('/tours/:slug'), () => failure(404, 'NOT_FOUND')));
    renderRoutes(routes, { path: '/about?book=no-such-tour' });
    const dialog = within(await screen.findByRole('dialog', { name: 'Book this trip' }));

    expect(await dialog.findByRole('alert')).toHaveTextContent(
      "We couldn't find what you're looking for.",
    );
    expect(dialog.queryByRole('button', { name: 'Confirm Booking' })).not.toBeInTheDocument();
  });
});

describe('booking intent', () => {
  const savedIntent = () => window.sessionStorage.getItem(STORAGE_KEYS.BOOKING_INTENT);
  const expectSelectionsKept = async () => {
    const dialog = within(await screen.findByRole('dialog', { name: 'Book this trip' }));
    expect(await dialog.findByRole('radio', { name: /Explorer/ })).toBeChecked();
    expect(travelers(dialog)).toHaveTextContent('3');
    expect(startDate(dialog)).toHaveValue(VALID_DATE);
    expect(total(dialog)).toHaveTextContent('₹56,247');
    return dialog;
  };

  it('takes a signed-out visitor through sign-in and back to the same booking', async () => {
    const posted = record('post', '/bookings', () => success({ booking: BOOKING }));
    const { dialog, user, router } = await openBooking({ as: null });

    await fillBooking(user, dialog);
    await confirm(user, dialog);

    await screen.findByText('Continue with Google');
    expect(currentUrl(router)).toBe('/signin?next=%2Fabout%3Fbook%3Dgoa-coastal-escape');
    expect(JSON.parse(savedIntent())).toEqual({
      tourSlug: 'goa-coastal-escape',
      tierId: 'tier-2',
      travelers: 3,
      startDate: VALID_DATE,
    });
    expect(posted).toEqual([]);

    record('post', '/auth/google', () => success({ user: CUSTOMER }));
    act(() => google.signInWith('google-id-token'));

    await expectSelectionsKept();
    expect(currentUrl(router)).toBe(BOOKING_URL);
    expect(savedIntent()).toBeNull();
  });

  it('takes an incomplete profile through onboarding and back to the same booking', async () => {
    const { dialog, user, router } = await openBooking({ as: INCOMPLETE_CUSTOMER });

    await fillBooking(user, dialog);
    await confirm(user, dialog);

    await screen.findByRole('heading', { level: 1, name: 'One last step' });
    expect(currentUrl(router)).toBe('/onboarding?next=%2Fabout%3Fbook%3Dgoa-coastal-escape');

    record('patch', '/users/me', (body) =>
      success({ user: { ...INCOMPLETE_CUSTOMER, ...body, profileComplete: true } }),
    );
    await user.type(screen.getByRole('textbox', { name: 'Mobile number' }), '9123456780');
    await user.click(screen.getByRole('button', { name: 'Save and continue' }));

    const reopened = await expectSelectionsKept();
    expect(savedIntent()).toBeNull();

    const posted = record('post', '/bookings', () => failure(500, 'INTERNAL_ERROR'));
    await confirm(user, reopened);
    await waitFor(() =>
      expect(posted).toEqual([
        { tourId: GOA_TOUR.id, tierId: 'tier-2', travelers: 3, startDate: VALID_DATE },
      ]),
    );
  });

  it('ignores an intent left for another tour, and still clears it', async () => {
    window.sessionStorage.setItem(
      STORAGE_KEYS.BOOKING_INTENT,
      JSON.stringify({
        tourSlug: 'another-tour',
        tierId: 'tier-9',
        travelers: 7,
        startDate: VALID_DATE,
      }),
    );
    const { dialog } = await openBooking();

    expect(dialog.getByRole('radio', { name: /Essential/ })).toBeChecked();
    expect(travelers(dialog)).toHaveTextContent('1');
    expect(startDate(dialog)).toHaveValue('');
    expect(savedIntent()).toBeNull();
  });
});
