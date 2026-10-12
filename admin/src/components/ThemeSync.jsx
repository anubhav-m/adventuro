import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useUpdateProfile } from '../hooks/mutations/useUpdateProfile.js';
import { useMe } from '../hooks/queries/useMe.js';
import { useTheme } from '../hooks/useTheme.js';
import { getErrorMessage } from '../lib/errors.js';

// Keeps the theme and the signed-in user's saved preference together. A choice is applied at
// once and then saved; whenever no save is in flight the server's value wins, which is what
// applies it on sign-in and what rolls a failed save back. Guests never reach the server.
export function ThemeSync({ saveRef }) {
  const { setPreference } = useTheme();
  const { data: user } = useMe();
  const { mutate, isPending } = useUpdateProfile();
  const applyRef = useRef(setPreference);
  const userId = user?.id;
  const savedPreference = user?.themePreference;

  useEffect(() => {
    applyRef.current = setPreference;
    saveRef.current = (themePreference) => {
      if (!userId) return;
      mutate({ themePreference }, { onError: (error) => toast.error(getErrorMessage(error)) });
    };
  });

  useEffect(() => {
    if (userId && !isPending) applyRef.current(savedPreference, { notify: false });
  }, [userId, savedPreference, isPending]);

  return null;
}
