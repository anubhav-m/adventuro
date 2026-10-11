import { useEffect, useRef, useState } from 'react';
import { useGoogleSignIn } from '../../hooks/mutations/useGoogleSignIn.js';
import { useTheme } from '../../hooks/useTheme.js';
import { THEME } from '../../lib/constants.js';
import { loadGoogleIdentity, setCredentialHandler } from '../../lib/googleIdentity.js';
import { ErrorState } from '../ui/ErrorState.jsx';
import { InlineError } from '../ui/InlineError.jsx';
import { Spinner } from '../ui/Spinner.jsx';

const BUTTON_WIDTH = 300;

// Google's own button. Its ID token goes to the backend, which sets the session cookie.
// Where the visitor lands afterwards is decided by the page, from the session.
export function GoogleSignInButton() {
  const containerRef = useRef(null);
  const { resolved } = useTheme();
  const { mutate, isPending, error } = useGoogleSignIn();
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    setCredentialHandler((credential) => mutate(credential));
    return () => setCredentialHandler(null);
  }, [mutate]);

  useEffect(() => {
    if (loadError) return undefined;
    let active = true;
    const renderButton = async () => {
      try {
        const identity = await loadGoogleIdentity();
        if (!active) return;
        identity.renderButton(containerRef.current, {
          type: 'standard',
          theme: resolved === THEME.DARK ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: BUTTON_WIDTH,
        });
      } catch (failure) {
        if (active) setLoadError(failure);
      }
    };
    renderButton();
    return () => {
      active = false;
    };
  }, [resolved, loadError]);

  if (loadError) {
    return <ErrorState error={loadError} onRetry={() => setLoadError(null)} className="py-0" />;
  }

  return (
    <div className="flex flex-col items-start gap-4">
      {/* Google's frame is opaque unless its container keeps the light colour scheme. */}
      <div ref={containerRef} className="min-h-11 scheme-light" />
      {isPending && <Spinner label="Signing you in" />}
      {error && <InlineError error={error} />}
    </div>
  );
}
