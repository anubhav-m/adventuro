import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { BOOKING, CANCELLED_BOOKING, CUSTOMER_USER, INCOMPLETE_USER } from '../test/fixtures.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, failure, server, success } from '../test/server.js';
import { UserDetailPage } from './UserDetailPage.jsx';

const routes = [
  { path: '/users', element: <h1>All users</h1> },
  { path: '/users/:id', element: <UserDetailPage /> },
  { path: '/bookings/:bookingNumber', element: <h1>Booking page</h1> },
];

// The plain booking object: GET /admin/users/:id does not repeat the user on each booking.
const plain = ({ user: _user, ...booking }) => booking;

const setup = async (user, bookings) => {
  server.use(
    http.get(api(`/admin/users/${user.id}`), () =>
      success({ user, bookings: bookings.map(plain) }),
    ),
  );
  const view = renderRoutes(routes, { path: `/users/${user.id}` });
  await screen.findByRole('heading', { level: 1, name: user.name });
  return { user: userEvent.setup(), ...view };
};

const fact = (plate, label) =>
  within(screen.getByRole('region', { name: plate })).getByText(label, { selector: 'dt' })
    .nextElementSibling;

describe('UserDetailPage', () => {
  it('shows the profile and the user’s bookings, without a customer column', async () => {
    const { user, router } = await setup(CUSTOMER_USER, [BOOKING, CANCELLED_BOOKING]);

    expect(document.title).toBe('Asha Customer · Adventuro Admin');
    expect(fact('Account', 'Email')).toHaveTextContent('asha@example.com');
    expect(fact('Account', 'Phone')).toHaveTextContent('9876543210');
    expect(fact('Account', 'Role')).toHaveTextContent('Customer');
    expect(fact('Account', 'Profile')).toHaveTextContent('Complete');
    expect(fact('Activity', 'Joined')).toHaveTextContent('2 Oct 2026, 12:00 PM');
    expect(fact('Activity', 'Last sign-in')).toHaveTextContent('15 Oct 2026, 10:00 AM');
    expect(fact('Activity', 'Theme')).toHaveTextContent('System');
    expect(fact('Activity', 'User ID')).toHaveTextContent(CUSTOMER_USER.id);

    const table = screen.getByRole('table', { name: 'Asha Customer’s bookings' });
    const header = within(table).getAllByRole('columnheader');
    expect(header.map((cell) => cell.textContent)).not.toContain('Customer');
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).getByText('Cancelled')).toBeInTheDocument();

    await user.click(within(table).getByRole('link', { name: BOOKING.bookingNumber }));
    expect(await screen.findByRole('heading', { name: 'Booking page' })).toBeInTheDocument();
    expect(currentUrl(router)).toBe(`/bookings/${BOOKING.bookingNumber}`);
  });

  it('shows what a user has not filled in, and an empty bookings table', async () => {
    await setup(INCOMPLETE_USER, []);

    expect(fact('Account', 'Phone')).toHaveTextContent('Not set');
    expect(fact('Account', 'Profile')).toHaveTextContent('Incomplete');
    expect(fact('Activity', 'Last sign-in')).toHaveTextContent('Never');
    expect(fact('Activity', 'Theme')).toHaveTextContent('Dark');
    expect(screen.getByText('No bookings yet.')).toBeInTheDocument();
  });

  it('has no way to change anything', async () => {
    await setup(CUSTOMER_USER, [BOOKING]);

    expect(screen.queryAllByRole('button')).toEqual([]);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All users' })).toHaveAttribute('href', '/users');
  });

  it('keeps a title and says so when the user is not found', async () => {
    server.use(http.get(api('/admin/users/:id'), () => failure(404, 'NOT_FOUND')));
    renderRoutes(routes, { path: '/users/6acb6f4b2fce015e85729999' });

    expect(await screen.findByRole('heading', { level: 1, name: 'User' })).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't find what you're looking for.",
    );
  });
});
