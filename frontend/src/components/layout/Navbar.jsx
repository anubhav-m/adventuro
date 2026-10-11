import { NavLink } from 'react-router';
import { useScrolled } from '../../hooks/useScrolled.js';
import { cn } from '../../lib/cn.js';
import { NAV_LINKS } from '../../lib/constants.js';
import { AccountMenu } from './AccountMenu.jsx';
import { LogoMenu } from './LogoMenu.jsx';
import { SearchOverlay } from './SearchOverlay.jsx';
import { ThemeSwitcher } from './ThemeSwitcher.jsx';

// The rule under a link draws in from the left on hover, and stays under the current page.
const NAV_LINK =
  'relative hidden min-h-11 items-center px-2 font-semibold whitespace-nowrap after:absolute after:inset-x-2 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-(--duration-base) after:ease-out hover:after:scale-x-100 aria-[current=page]:after:scale-x-100 md:flex';

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
        {NAV_LINKS.map(({ label, to }) => (
          <NavLink key={to} to={to} className={NAV_LINK}>
            {label}
          </NavLink>
        ))}
        <span className="flex-1" />
        <SearchOverlay />
        <ThemeSwitcher />
        <AccountMenu />
      </nav>
    </header>
  );
}
