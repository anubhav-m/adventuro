import { EmptyState } from './ui/EmptyState.jsx';
import { ErrorState } from './ui/ErrorState.jsx';
import { SkeletonText } from './ui/SkeletonText.jsx';

const isEmptyByDefault = (data) =>
  data === undefined || data === null || (Array.isArray(data) && data.length === 0);

// The one pattern for every data view: loading → error (with retry) → empty → content.
// Loading is always a skeleton: pass one in the shape of the content, or get lines of copy.
// <QueryBoundary query={query} skeleton={<Grid />} empty={<EmptyState … />}>
//   {(data) => <List items={data} />}
// </QueryBoundary>
// `stateClassName` frames the loading, error and empty states when the content itself is
// laid out differently (a full-bleed section, say).
export function QueryBoundary({
  query,
  isEmpty = isEmptyByDefault,
  skeleton = <SkeletonText />,
  empty,
  stateClassName,
  children,
}) {
  if (query.isPending) {
    return (
      <div aria-busy="true" className={stateClassName}>
        <span role="status" className="sr-only">
          Loading
        </span>
        {skeleton}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className={stateClassName}>
        <ErrorState error={query.error} onRetry={query.refetch} />
      </div>
    );
  }
  if (isEmpty(query.data)) {
    return (
      <div className={stateClassName}>
        {empty ?? <EmptyState title="Nothing to show here yet." />}
      </div>
    );
  }
  return children(query.data);
}
