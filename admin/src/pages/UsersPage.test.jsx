import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { CUSTOMER_USER, INCOMPLETE_USER, pageMeta, USER_LIST } from '../test/fixtures.js';
import { currentUrl, renderRoutes } from '../test/render.jsx';
import { api, server, success } from '../test/server.js';
import { UsersPage } from './UsersPage.jsx';

const routes = [
  { path: '/users', element: <UsersPage /> },
  { path: '/users/:id', element: <h1>User page</h1> },
];

const serveUsers = () => {
  const queries = [];
  server.use(
    http.get(api('/admin/users'), ({ request }) => {
      queries.push(Object.fromEntries(new URL(request.url).searchParams));
      return success({ users: USER_LIST }, { meta: pageMeta(USER_LIST.length) });
    }),
  );
  return queries;
};

const setup = async (path = '/users') => {
  const view = renderRoutes(routes, { path });
  await screen.findByRole('link', { name: CUSTOMER_USER.name });
  return { user: userEvent.setup(), ...view };
};

const cells = (name) =>
  [...screen.getByRole('link', { name }).closest('tr').cells].map((cell) => cell.textContent);

describe('UsersPage', () => {
  it('lists each user with their contact, role and activity, read-only', async () => {
    serveUsers();
    await setup();

    expect(screen.getByRole('heading', { level: 1, name: 'Users' })).toBeInTheDocument();
    expect(cells('Aditya Admin').slice(1)).toEqual([
      'Aditya Admin',
      'aditya@example.com',
      '9876543211',
      'Admin',
      '1 Oct 2026, 12:00 PM',
      '15 Oct 2026, 10:00 AM',
    ]);
    expect(cells(CUSTOMER_USER.name)[4]).toBe('Customer');
    expect(cells(INCOMPLETE_USER.name).slice(3)).toEqual([
      '—',
      'Customer',
      '3 Oct 2026, 12:00 PM',
      '—',
    ]);
    expect(screen.queryByRole('button', { name: /edit|delete|role/i })).not.toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Users · Adventuro Admin'));
  });

  it('searches and filters by role through the URL', async () => {
    const queries = serveUsers();
    const { user, router } = await setup();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Role' }), 'Admin');
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), '98765');

    await waitFor(() =>
      expect(queries.at(-1)).toEqual({ role: 'admin', q: '98765', page: '1', limit: '20' }),
    );
    expect(currentUrl(router)).toBe('/users?role=admin&q=98765');
  });

  it('does not send a one-letter search', async () => {
    const queries = serveUsers();
    await setup('/users?q=a');

    expect(queries).toEqual([{ page: '1', limit: '20' }]);
  });

  it('opens a user’s page from their name', async () => {
    serveUsers();
    const { user, router } = await setup();

    await user.click(screen.getByRole('link', { name: CUSTOMER_USER.name }));

    expect(await screen.findByRole('heading', { name: 'User page' })).toBeInTheDocument();
    expect(currentUrl(router)).toBe(`/users/${CUSTOMER_USER.id}`);
  });

  it('says when no user matches', async () => {
    server.use(http.get(api('/admin/users'), () => success({ users: [] }, { meta: pageMeta(0) })));
    renderRoutes(routes, { path: '/users?q=nobody' });

    expect(await screen.findByText('No users match these filters.')).toBeInTheDocument();
  });
});
