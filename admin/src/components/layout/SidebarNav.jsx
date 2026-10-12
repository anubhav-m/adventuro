import { NavLink } from 'react-router';
import { NAV_SECTIONS } from '../../lib/constants.js';

// The list of sections, shared by the sidebar and the drawer. The current section is inverted.
export function SidebarNav({ onNavigate }) {
  return (
    <nav aria-label="Sections">
      <ul className="flex flex-col gap-1">
        {NAV_SECTIONS.map(({ label, to, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className="flex h-10 items-center gap-3 rounded-pill px-3.5 text-sm font-bold text-text transition-colors duration-(--duration-fast) ease-out hover:bg-surface-raised aria-[current=page]:bg-text aria-[current=page]:text-bg"
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
