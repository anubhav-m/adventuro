import { LogOut, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { useSignOut } from '../../hooks/mutations/useSignOut.js';
import { useMe } from '../../hooks/queries/useMe.js';
import { getErrorMessage } from '../../lib/errors.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { IconButton } from '../ui/IconButton.jsx';
import { ThemeSwitcher } from './ThemeSwitcher.jsx';

// The bar above every page: the drawer's menu button on narrow screens, the theme, who is
// signed in, and sign out. Signing out empties the session, and the route guard does the rest.
export function Topbar({ onMenuOpen }) {
  const { data: user } = useMe();
  const signOut = useSignOut();
  const name = user?.name || user?.email || '';

  const handleSignOut = () =>
    signOut.mutate(undefined, { onError: (error) => toast.error(getErrorMessage(error)) });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg px-4 sm:px-6">
      <IconButton icon={Menu} label="Open menu" onClick={onMenuOpen} className="lg:hidden" />
      <div className="ml-auto flex items-center gap-3">
        <ThemeSwitcher />
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar name={name} src={user?.avatarUrl} />
          <span className="max-w-48 truncate text-sm font-bold max-sm:sr-only">{name}</span>
        </span>
        <Button
          variant="secondary"
          icon={LogOut}
          loading={signOut.isPending}
          onClick={handleSignOut}
          className="max-sm:w-10 max-sm:px-0"
        >
          <span className="max-sm:sr-only">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
