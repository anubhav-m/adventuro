import { ProfileForm } from '../components/auth/ProfileForm.jsx';
import { ChipGroup } from '../components/ui/ChipGroup.jsx';
import { useMe } from '../hooks/queries/useMe.js';
import { useTheme } from '../hooks/useTheme.js';
import { BRAND, THEME_OPTIONS } from '../lib/constants.js';

const SECTION = 'flex flex-col gap-5 border-t border-border pt-8';
const HEADING = 'text-h3 font-extrabold';

// Rendered inside RequireAuth and RequireCompleteProfile, so there is always a complete user.
export function AccountPage() {
  const { data: user } = useMe();
  const { preference, setPreference } = useTheme();

  return (
    <div className="mx-auto flex max-w-content flex-col gap-10 px-(--space-gutter) pt-(--space-section)">
      <title>{`Your account · ${BRAND.NAME}`}</title>
      <header className="flex flex-col gap-3">
        <h1 className="type-display text-h1">Your account</h1>
        <p className="text-text-muted">
          Signed in as <span className="font-bold text-text">{user.email}</span>
        </p>
      </header>

      <section aria-labelledby="account-profile" className={SECTION}>
        <h2 id="account-profile" className={HEADING}>
          Profile
        </h2>
        <ProfileForm user={user} submitLabel="Save changes" />
        <p className="text-xs font-medium text-text-muted">
          User ID <span className="font-semibold text-text tabular-nums">{user.id}</span>
        </p>
      </section>

      <section aria-labelledby="account-theme" className={SECTION}>
        <h2 id="account-theme" className={HEADING}>
          Theme
        </h2>
        <p className="max-w-prose text-text-muted">
          System follows your device. Your choice is saved to your account.
        </p>
        <ChipGroup
          label="Theme"
          options={THEME_OPTIONS}
          value={preference}
          onChange={(value) => value && setPreference(value)}
        />
      </section>
    </div>
  );
}
