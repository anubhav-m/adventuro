import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DASHBOARD, EMPTY_DASHBOARD } from '../test/fixtures.js';
import { currentUrl, renderApp } from '../test/render.jsx';
import { api, failure, server, success } from '../test/server.js';
import { DashboardPage } from './DashboardPage.jsx';

// 12 Oct 2026, 11:30 in India.
const NOW = new Date('2026-10-12T06:00:00.000Z');

// Answers the dashboard with `data` and records the range each request asked for.
const serveDashboard = (data = DASHBOARD) => {
  const ranges = [];
  server.use(
    http.get(api('/admin/dashboard'), ({ request }) => {
      const { searchParams } = new URL(request.url);
      ranges.push(Object.fromEntries(searchParams));
      return success(data);
    }),
  );
  return ranges;
};

const setup = (path = '/') => {
  const view = renderApp(<DashboardPage />, { path });
  // The clock is faked (for "today"), so user-event must advance it itself.
  return { user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime }), ...view };
};

const loaded = () => screen.findByText('Total users');
const section = (name) => screen.getByRole('region', { name });
const table = (name) => screen.getByRole('table', { name });
const rowTexts = (name) =>
  within(table(name))
    .getAllByRole('row')
    .slice(1)
    .map((row) => [...row.cells].map((cell) => cell.textContent));
const range = (name) =>
  within(screen.getByRole('group', { name: 'Date range' })).getByRole('button', { name });

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  });

  afterEach(() => vi.useRealTimers());

  it('asks for the last 30 days by default and says which days those are', async () => {
    const ranges = serveDashboard();
    setup();
    await loaded();

    expect(ranges).toEqual([{ from: '2026-09-13', to: '2026-10-12' }]);
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('13 Sep 2026 to 12 Oct 2026, by Indian time.')).toBeInTheDocument();
    expect(range('30 days')).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(document.title).toBe('Dashboard · Adventuro Admin'));
  });

  it('shows the five stat cards, with money labelled as booking value', async () => {
    serveDashboard();
    setup();
    await loaded();

    const stat = (label) => screen.getByText(label, { selector: 'p' }).parentElement;
    expect(stat('Total users')).toHaveTextContent('1,234');
    expect(stat('Total users')).toHaveTextContent('All time');
    expect(stat('New users')).toHaveTextContent('3');
    expect(stat('Bookings')).toHaveTextContent('4');
    expect(stat('Booking value')).toHaveTextContent('₹97,496');
    expect(stat('Booking value')).toHaveTextContent('Confirmed and completed, in this range');
    expect(stat('Newsletter subscribers')).toHaveTextContent('56');
    expect(screen.queryByText(/revenue/i)).not.toBeInTheDocument();
  });

  it('gives each day-by-day chart its figures as a table', async () => {
    serveDashboard();
    setup();
    await loaded();

    expect(section('New users per day')).toBeInTheDocument();
    expect(rowTexts('New users per day')).toEqual([
      ['10 Oct 2026', '0'],
      ['11 Oct 2026', '1'],
      ['12 Oct 2026', '2'],
    ]);
    expect(rowTexts('Bookings per day')).toEqual([
      ['10 Oct 2026', '0', '₹0'],
      ['11 Oct 2026', '1', '₹37,498'],
      ['12 Oct 2026', '3', '₹59,998'],
    ]);
  });

  it('breaks bookings down by vertical, count and value, and by status', async () => {
    serveDashboard();
    setup();
    await loaded();

    expect(rowTexts('Bookings by vertical')).toEqual([
      ['TideTrail', '3'],
      ['GoldenSaga', '1'],
      ['PeakPulse', '0'],
      ['EliteScape', '0'],
      ['UrbanEcho', '0'],
      ['Grand India Tour', '0'],
    ]);
    expect(rowTexts('Booking value by vertical').slice(0, 2)).toEqual([
      ['TideTrail', '₹59,998'],
      ['GoldenSaga', '₹37,498'],
    ]);
    expect(rowTexts('Bookings by status')).toEqual([
      ['Confirmed', '2'],
      ['Completed', '1'],
      ['Cancelled', '1'],
    ]);
  });

  it('lists the top tours and the top gear', async () => {
    serveDashboard();
    setup();
    await loaded();

    expect(rowTexts('Top tours by bookings')).toEqual([
      ['Goa Coastal Escape', '3', '₹59,998'],
      ['Jaisalmer Dunes Desert Camp', '1', '₹37,498'],
    ]);
    expect(rowTexts('Top gear by affiliate clicks')).toEqual([
      ['Trailhead 45L Trek Backpack', '12'],
      ['DryTide 20L Dry Bag', '7'],
    ]);
  });

  it('lists the recent bookings with their vertical and a worded status', async () => {
    serveDashboard();
    setup();
    await loaded();

    expect(rowTexts('Recent bookings')).toEqual([
      [
        'ADV-TT-2026-000002',
        'Asha Customer',
        'Goa Coastal Escape',
        'TideTrail',
        '2',
        '₹37,498',
        'Confirmed',
        '12 Oct 2026, 12:00 PM',
      ],
      [
        'ADV-GS-2026-000001',
        'Asha Customer',
        'Jaisalmer Dunes Desert Camp',
        'GoldenSaga',
        '4',
        '₹37,496',
        'Cancelled',
        '12 Oct 2026, 12:00 PM',
      ],
    ]);
  });

  it('says so in every chart and table when the range has nothing in it', async () => {
    serveDashboard(EMPTY_DASHBOARD);
    setup();
    await loaded();

    expect(screen.getAllByText('Nothing in this range yet.')).toHaveLength(5);
    expect(screen.getAllByText('No bookings in this range.')).toHaveLength(2);
    expect(screen.getByText('No affiliate clicks in this range.')).toBeInTheDocument();
    expect(rowTexts('Bookings by status')).toEqual([
      ['Confirmed', '0'],
      ['Completed', '0'],
      ['Cancelled', '0'],
    ]);
  });

  it('refetches with the new from and to when a preset is chosen, and keeps it in the URL', async () => {
    const ranges = serveDashboard();
    const { user, router } = setup();
    await loaded();

    await user.click(range('7 days'));
    await waitFor(() => expect(ranges).toHaveLength(2));
    expect(ranges[1]).toEqual({ from: '2026-10-06', to: '2026-10-12' });
    expect(currentUrl(router)).toBe('/?range=7');
    expect(range('7 days')).toHaveAttribute('aria-pressed', 'true');

    await user.click(range('90 days'));
    await waitFor(() => expect(ranges).toHaveLength(3));
    expect(ranges[2]).toEqual({ from: '2026-07-15', to: '2026-10-12' });
    expect(currentUrl(router)).toBe('/?range=90');

    await user.click(range('30 days'));
    expect(currentUrl(router)).toBe('/');
  });

  it('reads the range from the URL on arrival', async () => {
    const ranges = serveDashboard();
    setup('/?range=custom&from=2026-08-01&to=2026-08-31');
    await loaded();

    expect(ranges).toEqual([{ from: '2026-08-01', to: '2026-08-31' }]);
    expect(range('Custom')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('From')).toHaveValue('2026-08-01');
    expect(screen.getByLabelText('To')).toHaveValue('2026-08-31');
    expect(screen.getByText('1 Aug 2026 to 31 Aug 2026, by Indian time.')).toBeInTheDocument();
  });

  it('starts a custom range from the one showing, and refetches as its dates change', async () => {
    const ranges = serveDashboard();
    const { user, router } = setup('/?range=7');
    await loaded();
    expect(screen.queryByLabelText('From')).not.toBeInTheDocument();

    await user.click(range('Custom'));
    expect(currentUrl(router)).toBe('/?range=custom&from=2026-10-06&to=2026-10-12');
    expect(screen.getByLabelText('From')).toHaveAttribute('max', '2026-10-12');
    expect(ranges).toHaveLength(1);

    await user.clear(screen.getByLabelText('From'));
    await user.type(screen.getByLabelText('From'), '2026-10-01');
    await waitFor(() => expect(ranges.at(-1)).toEqual({ from: '2026-10-01', to: '2026-10-12' }));
    expect(Object.fromEntries(new URLSearchParams(router.state.location.search))).toEqual({
      range: 'custom',
      from: '2026-10-01',
      to: '2026-10-12',
    });
  });

  it('does not ask for a range that cannot be shown, and says what is wrong with it', async () => {
    const ranges = serveDashboard();
    setup('/?range=custom&from=2026-10-12&to=2026-10-01');

    expect(await screen.findByText('That range can’t be shown.')).toBeInTheDocument();
    expect(screen.getByLabelText('From')).toBeInvalid();
    expect(screen.getByLabelText('From')).toHaveAccessibleDescription(
      'Pick a start date on or before the end date.',
    );
    expect(screen.queryByText('Total users')).not.toBeInTheDocument();
    expect(ranges).toEqual([]);
  });

  it('shows a skeleton while loading, then our own error text with a retry', async () => {
    server.use(http.get(api('/admin/dashboard'), () => failure(500, 'INTERNAL_ERROR')));
    const { user } = setup();
    expect(screen.getByRole('status')).toHaveTextContent('Loading');

    const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(alert).toHaveTextContent(
      'Something went wrong on our side. Please try again in a moment.',
    );
    expect(alert).not.toHaveTextContent('Raw server message');

    serveDashboard();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await loaded()).toBeInTheDocument();
  });
});
