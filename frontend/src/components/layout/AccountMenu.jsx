import { Copy, LogOut, Ticket, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useSignOut } from '../../hooks/mutations/useSignOut.js';
import { useMe } from '../../hooks/queries/useMe.js';
import { ROUTES } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { Dropdown } from '../ui/Dropdown.jsx';
import { IconButton } from '../ui/IconButton.jsx';
import { AccountSummary } from './AccountSummary.jsx';

// The navbar's account control: Sign in for a guest, the avatar menu for a signed-in user.
export function AccountMenu() {
  const me = useMe();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const user = me.data;

  // Holds the control's place while the session is being restored, so the bar does not jump.
  if (me.isPending) return <span className="size-11" />;
  if (!user) {
    return (
      <Button to={ROUTES.SIGN_IN} size="sm">
        Sign in
      </Button>
    );
  }

  const copyUserId = async () => {
    try {
      await navigator.clipboard.writeText(user.id);
      toast.success('User ID copied');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // Leave for home first: a guarded page would otherwise send the now signed-out user to sign-in.
  const handleSignOut = async () => {
    await navigate(ROUTES.HOME, { flushSync: true });
    signOut.mutate(undefined, {
      onSuccess: () => toast.success('Signed out'),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  const items = [
    { key: 'bookings', label: 'My Bookings', icon: Ticket, to: ROUTES.MY_BOOKINGS },
    { key: 'profile', label: 'Profile', icon: UserRound, to: ROUTES.ACCOUNT },
    { key: 'copy-id', label: 'Copy user ID', icon: Copy, onSelect: copyUserId },
    { key: 'sign-out', label: 'Sign out', icon: LogOut, onSelect: handleSignOut },
  ];

  return (
    <Dropdown
      label="Account"
      items={items}
      header={<AccountSummary user={user} />}
      trigger={(triggerProps) => (
        <IconButton label="Account" {...triggerProps}>
          <Avatar name={user.name || user.email} src={user.avatarUrl} />
        </IconButton>
      )}
    />
  );
}
