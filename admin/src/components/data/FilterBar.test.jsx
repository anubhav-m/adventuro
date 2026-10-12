import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useUrlFilters } from '../../hooks/useUrlFilters.js';
import { currentUrl, renderApp } from '../../test/render.jsx';
import { FILTER_TYPE, FilterBar } from './FilterBar.jsx';

const DEFAULTS = Object.freeze({ q: '', status: '', from: '', sort: 'newest', page: '1' });

const FIELDS = [
  { key: 'q', label: 'Search', type: FILTER_TYPE.SEARCH, placeholder: 'Booking number, name…' },
  {
    key: 'status',
    label: 'Status',
    type: FILTER_TYPE.SELECT,
    placeholder: 'Any status',
    options: [
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
  { key: 'from', label: 'Booked from', type: FILTER_TYPE.DATE },
];

// What a list page would read: the same params, through its own call to the hook.
function ListProbe() {
  const { filters } = useUrlFilters(DEFAULTS);
  return <output>{JSON.stringify(filters)}</output>;
}

const setup = (path = '/bookings') => {
  const view = renderApp(
    <>
      <FilterBar label="Booking filters" defaults={DEFAULTS} fields={FIELDS} />
      <ListProbe />
    </>,
    { path },
  );
  return { user: userEvent.setup(), ...view };
};

const seenByList = () => JSON.parse(screen.getByRole('status').textContent);
const search = () => screen.getByRole('searchbox', { name: 'Search' });
const status = () => screen.getByRole('combobox', { name: 'Status' });
const from = () => screen.getByLabelText('Booked from');

describe('FilterBar', () => {
  it('renders a labelled control per field inside a named group', () => {
    setup();

    expect(screen.getByRole('group', { name: 'Booking filters' })).toBeInTheDocument();
    expect(search()).toHaveAttribute('placeholder', 'Booking number, name…');
    expect(screen.getByRole('option', { name: 'Any status' })).toHaveValue('');
    expect(from()).toHaveAttribute('type', 'date');
  });

  it('fills its controls from the URL', () => {
    setup('/bookings?q=asha&status=cancelled&from=2026-10-01');

    expect(search()).toHaveValue('asha');
    expect(status()).toHaveValue('cancelled');
    expect(from()).toHaveValue('2026-10-01');
  });

  it('writes a select and a date to the URL as they change, where the list reads them', async () => {
    const { user, router } = setup();

    await user.selectOptions(status(), 'confirmed');
    expect(currentUrl(router)).toBe('/bookings?status=confirmed');

    await user.type(from(), '2026-10-05');
    expect(currentUrl(router)).toBe('/bookings?status=confirmed&from=2026-10-05');
    expect(seenByList()).toMatchObject({ status: 'confirmed', from: '2026-10-05', q: '' });
  });

  it('removes a param when its filter goes back to the unfiltered choice', async () => {
    const { user, router } = setup('/bookings?status=confirmed');

    await user.selectOptions(status(), '');

    expect(currentUrl(router)).toBe('/bookings');
  });

  it('returns the list to its first page when a filter changes', async () => {
    const { user, router } = setup('/bookings?status=confirmed&page=3');

    await user.selectOptions(status(), 'cancelled');

    expect(currentUrl(router)).toBe('/bookings?status=cancelled');
    expect(seenByList().page).toBe('1');
  });

  it('writes a search term once typing pauses, replacing the history entry', async () => {
    const { user, router } = setup('/bookings?status=confirmed');

    await user.type(search(), '  ADV-TT ');
    expect(currentUrl(router)).toBe('/bookings?status=confirmed');

    await waitFor(() => expect(currentUrl(router)).toBe('/bookings?status=confirmed&q=ADV-TT'));
    expect(router.state.historyAction).toBe('REPLACE');
    await waitFor(() => expect(seenByList().q).toBe('ADV-TT'));
  });

  it('follows the URL when it changes elsewhere, as on Back', async () => {
    const { user, router } = setup();
    await user.selectOptions(status(), 'confirmed');
    await user.selectOptions(status(), 'cancelled');

    await act(() => router.navigate(-1));
    await waitFor(() => expect(status()).toHaveValue('confirmed'));

    await act(() => router.navigate('/bookings?q=goa'));
    await waitFor(() => expect(search()).toHaveValue('goa'));
    expect(status()).toHaveValue('');
  });

  it('offers Clear filters only when something is filtered, and it empties everything', async () => {
    const { user, router } = setup('/bookings?q=asha&status=cancelled&page=2');
    expect(search()).toHaveValue('asha');

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(currentUrl(router)).toBe('/bookings');
    expect(search()).toHaveValue('');
    expect(status()).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('does not count a param the bar has no field for as a filter', () => {
    setup('/bookings?sort=oldest&page=2');
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });
});
