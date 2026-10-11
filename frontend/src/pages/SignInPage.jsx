import { Link, Navigate, useSearchParams } from 'react-router';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton.jsx';
import { SessionBoundary } from '../components/auth/SessionBoundary.jsx';
import { BRAND, ROUTES } from '../lib/constants.js';
import { getSignedInPath, readNext } from '../lib/next.js';

const TEXT_LINK = 'text-brand-text underline underline-offset-[0.2em]';

export function SignInPage() {
  const [searchParams] = useSearchParams();
  const next = readNext(searchParams);

  return (
    <SessionBoundary>
      {(user) =>
        user ? (
          <Navigate to={getSignedInPath(user, next)} replace />
        ) : (
          <section className="mx-auto flex max-w-content flex-col items-start gap-5 px-(--space-gutter) pt-(--space-section)">
            <title>{`Sign in · ${BRAND.NAME}`}</title>
            <h1 className="type-display text-h1">Sign in to {BRAND.NAME}</h1>
            <p className="type-lead text-text-muted">One account for your trips and tickets.</p>
            <p className="max-w-prose text-text-muted">
              Use your Google account to sign in or sign up. There is no password to remember, and
              we only read your name, email address and profile photo.
            </p>
            <div className="mt-2">
              <GoogleSignInButton />
            </div>
            <p className="max-w-prose text-xs font-medium text-text-muted">
              By continuing you agree to our{' '}
              <Link to={ROUTES.PRIVACY_TERMS} className={TEXT_LINK}>
                Privacy &amp; Terms
              </Link>
              .
            </p>
          </section>
        )
      }
    </SessionBoundary>
  );
}
