import { useQuery } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { listTours } from '../api/tours.api.js';
import { renderApp } from '../test/render.jsx';
import { api, failure, server, success } from '../test/server.js';
import { QueryBoundary } from './QueryBoundary.jsx';
import { EmptyState } from './ui/EmptyState.jsx';
import { Skeleton } from './ui/Skeleton.jsx';

function Tours({ skeleton, empty }) {
  const query = useQuery({
    queryKey: ['tours'],
    queryFn: async () => (await listTours()).tours,
  });
  return (
    <QueryBoundary query={query} skeleton={skeleton} empty={empty}>
      {(tours) => (
        <ul>
          {tours.map((tour) => (
            <li key={tour.slug}>{tour.title}</li>
          ))}
        </ul>
      )}
    </QueryBoundary>
  );
}

const respondWithTours = (tours) => server.use(http.get(api('/tours'), () => success({ tours })));

describe('QueryBoundary', () => {
  it('shows the skeleton while loading, then the content', async () => {
    respondWithTours([{ slug: 'goa', title: 'Goa Coastal Escape' }]);
    renderApp(<Tours skeleton={<Skeleton className="h-10" />} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.getByRole('status').parentElement).toHaveAttribute('aria-busy', 'true');

    expect(await screen.findByText('Goa Coastal Escape')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('falls back to lines of copy when no skeleton is given, never a spinner', () => {
    respondWithTours([]);
    const { container } = renderApp(<Tours />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('shows our own error text with a retry that refetches', async () => {
    const user = userEvent.setup();
    server.use(http.get(api('/tours'), () => failure(500, 'INTERNAL_ERROR')));
    renderApp(<Tours />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Something went wrong on our side. Please try again in a moment.',
    );
    expect(alert).not.toHaveTextContent('Raw server message');

    respondWithTours([{ slug: 'goa', title: 'Goa Coastal Escape' }]);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Goa Coastal Escape')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the empty state for an empty list', async () => {
    respondWithTours([]);
    renderApp(<Tours empty={<EmptyState title="No trips here yet." />} />);
    expect(await screen.findByRole('heading', { name: 'No trips here yet.' })).toBeInTheDocument();
  });

  it('has a default empty state and accepts a custom emptiness test', async () => {
    respondWithTours([]);
    const { unmount } = renderApp(<Tours />);
    expect(await screen.findByText('Nothing to show here yet.')).toBeInTheDocument();
    unmount();

    function Wrapped() {
      const query = useQuery({ queryKey: ['wrapped'], queryFn: () => listTours() });
      return (
        <QueryBoundary query={query} isEmpty={(data) => data.tours.length === 0}>
          {() => <p>Has tours</p>}
        </QueryBoundary>
      );
    }
    renderApp(<Wrapped />);
    expect(await screen.findByText('Nothing to show here yet.')).toBeInTheDocument();
  });
});
