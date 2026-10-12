import { Navigate, useLocation } from 'react-router';
import { forbiddenError } from '../api/ApiError.js';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton.jsx';
import { SessionBoundary } from '../components/auth/SessionBoundary.jsx';
import { Wordmark } from '../components/layout/Wordmark.jsx';
import { InlineError } from '../components/ui/InlineError.jsx';
import { SESSION_STATUS } from '../hooks/useAdminSession.js';
import { BRAND, ROUTES } from '../lib/constants.js';

// The only page outside the guard. An admin who is already signed in goes straight in. An
// account that was turned away, here or by the guard, is told why.
export function LoginPage() {
  const { state } = useLocation();

  return (
    <SessionBoundary>
      {({ status, denied }) =>
        status === SESSION_STATUS.ADMIN ? (
          <Navigate to={ROUTES.DASHBOARD} replace />
        ) : (
          <main className="mx-auto flex min-h-dvh w-full max-w-prose flex-col items-start justify-center gap-5 p-6">
            <title>{`Sign in · ${BRAND.APP}`}</title>
            <Wordmark />
            <h1 className="type-display text-h3">Sign in</h1>
            <p className="text-sm text-text-muted">
              Use the Google account that has been given admin access. There is no password to
              remember.
            </p>
            {(denied || state?.denied) && <InlineError error={forbiddenError()} />}
            <GoogleSignInButton />
          </main>
        )
      }
    </SessionBoundary>
  );
}
