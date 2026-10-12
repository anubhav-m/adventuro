import { SESSION_STATUS, useAdminSession } from '../../hooks/useAdminSession.js';
import { RouteFallback } from '../layout/RouteFallback.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';

const FRAME = 'mx-auto w-full max-w-prose p-6 pt-16';

// Waits for the session to be known, then renders `children(session)`: its status is then
// either signed out or admin.
export function SessionBoundary({ children }) {
  const session = useAdminSession();
  if (session.status === SESSION_STATUS.LOADING) return <RouteFallback />;
  if (session.status === SESSION_STATUS.ERROR) {
    return (
      <div className={FRAME}>
        <ErrorState error={session.error} onRetry={session.retry} />
      </div>
    );
  }
  return children(session);
}
