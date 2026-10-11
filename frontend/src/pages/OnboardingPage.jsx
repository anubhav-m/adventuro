import { Navigate, useSearchParams } from 'react-router';
import { ProfileForm } from '../components/auth/ProfileForm.jsx';
import { useMe } from '../hooks/queries/useMe.js';
import { BRAND } from '../lib/constants.js';
import { getSignedInPath, readNext } from '../lib/next.js';

// Rendered inside RequireAuth. Saving the form completes the profile, which sends the user on.
export function OnboardingPage() {
  const { data: user } = useMe();
  const [searchParams] = useSearchParams();

  if (user.profileComplete) {
    return <Navigate to={getSignedInPath(user, readNext(searchParams))} replace />;
  }

  return (
    <section className="mx-auto flex max-w-content flex-col items-start gap-5 px-(--space-gutter) pt-(--space-section)">
      <title>{`Complete your profile · ${BRAND.NAME}`}</title>
      <h1 className="type-display text-h1">One last step</h1>
      <p className="type-lead text-text-muted">Tell us who is travelling.</p>
      <p className="max-w-prose text-text-muted">
        Your name and mobile number go on your tickets, so the trip leader can reach you on the day.
      </p>
      <div className="mt-2 w-full">
        <ProfileForm user={user} submitLabel="Save and continue" />
      </div>
    </section>
  );
}
