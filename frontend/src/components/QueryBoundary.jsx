import { EmptyState } from './ui/EmptyState.jsx';
import { ErrorState } from './ui/ErrorState.jsx';
import { Spinner } from './ui/Spinner.jsx';

const isEmptyByDefault = (data) =>
  data === undefined || data === null || (Array.isArray(data) && data.length === 0);

// The one pattern for every data view: loading → error (with retry) → empty → content.
// <QueryBoundary query={query} skeleton={<Grid />} empty={<EmptyState … />}>
//   {(data) => <List items={data} />}
// </QueryBoundary>
export function QueryBoundary({ query, isEmpty = isEmptyByDefault, skeleton, empty, children }) {
  if (query.isPending) {
    return (
      <div aria-busy="true">
        {skeleton ? (
          <>
            <span role="status" className="sr-only">
              Loading
            </span>
            {skeleton}
          </>
        ) : (
          <Spinner label="Loading" />
        )}
      </div>
    );
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;
  if (isEmpty(query.data)) return empty ?? <EmptyState title="Nothing to show here yet." />;
  return children(query.data);
}
