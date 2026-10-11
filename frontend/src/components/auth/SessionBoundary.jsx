import { useMe } from '../../hooks/queries/useMe.js';
import { ErrorState } from '../ui/ErrorState.jsx';
import { Spinner } from '../ui/Spinner.jsx';

const FRAME = 'mx-auto flex max-w-content px-(--space-gutter) pt-(--space-section)';

// Waits for the session to be known, then renders `children(user)`; user is null when signed out.
export function SessionBoundary({ children }) {
  const me = useMe();
  if (me.isPending) {
    return (
      <div aria-busy="true" className={FRAME}>
        <Spinner label="Loading" />
      </div>
    );
  }
  if (me.isError) {
    return (
      <div className={FRAME}>
        <ErrorState error={me.error} onRetry={me.refetch} />
      </div>
    );
  }
  return children(me.data);
}
