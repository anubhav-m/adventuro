import { Link } from 'react-router';
import { useScrolled } from '../../hooks/useScrolled.js';
import { cn } from '../../lib/cn.js';
import { ROUTES } from '../../lib/constants.js';
import { AccountMenu } from './AccountMenu.jsx';
import { LogoMenu } from './LogoMenu.jsx';
import { SearchOverlay } from './SearchOverlay.jsx';
import { ThemeSwitcher } from './ThemeSwitcher.jsx';

export function Navbar() {
  const scrolled = useScrolled();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b bg-bg transition-colors duration-(--duration-base) ease-out',
        scrolled ? 'border-border' : 'border-transparent',
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-content items-center gap-0.5 px-(--space-gutter) min-[420px]:gap-1 sm:h-20 sm:gap-4"
      >
        <LogoMenu />
        <Link
          to={ROUTES.ABOUT}
          className="hidden min-h-11 items-center px-2 font-semibold underline-offset-4 hover:underline sm:flex"
        >
          About Us
        </Link>
        <span className="flex-1" />
        <SearchOverlay />
        <ThemeSwitcher />
        <AccountMenu />
      </nav>
    </header>
  );
}
