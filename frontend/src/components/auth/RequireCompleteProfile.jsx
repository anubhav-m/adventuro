import { Navigate, Outlet, useLocation } from 'react-router';
import { useMe } from '../../hooks/queries/useMe.js';
import { ROUTES } from '../../lib/constants.js';
import { withNext } from '../../lib/next.js';

// Route guard, used inside RequireAuth: a profile without name and phone goes to onboarding.
export function RequireCompleteProfile() {
  const { data: user } = useMe();
  const { pathname, search } = useLocation();
  if (!user?.profileComplete) {
    return <Navigate to={withNext(ROUTES.ONBOARDING, `${pathname}${search}`)} replace />;
  }
  return <Outlet />;
}
