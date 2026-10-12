import { Navigate, Outlet } from 'react-router';
import { SESSION_STATUS } from '../../hooks/useAdminSession.js';
import { ROUTES } from '../../lib/constants.js';
import { SessionBoundary } from './SessionBoundary.jsx';

// Route guard for everything but the login page. Nobody but an admin gets past it: a signed-out
// visitor goes to login, and so does an account without the role, once it has been signed out,
// with `denied` in the navigation state so the login page can explain.
export function RequireAdmin() {
  return (
    <SessionBoundary>
      {({ status, denied }) =>
        status === SESSION_STATUS.ADMIN ? (
          <Outlet />
        ) : (
          <Navigate to={ROUTES.LOGIN} state={{ denied }} replace />
        )
      }
    </SessionBoundary>
  );
}
