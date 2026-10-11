import { Navigate, Outlet, useLocation } from 'react-router';
import { ROUTES } from '../../lib/constants.js';
import { withNext } from '../../lib/next.js';
import { SessionBoundary } from './SessionBoundary.jsx';

// Route guard: a signed-out visitor goes to sign-in and comes back to this page afterwards.
export function RequireAuth() {
  const { pathname, search } = useLocation();
  return (
    <SessionBoundary>
      {(user) =>
        user ? (
          <Outlet />
        ) : (
          <Navigate to={withNext(ROUTES.SIGN_IN, `${pathname}${search}`)} replace />
        )
      }
    </SessionBoundary>
  );
}
