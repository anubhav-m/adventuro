import { Link } from 'react-router';
import { BRAND, ROUTES } from '../../lib/constants.js';
import { Modal } from '../ui/Modal.jsx';
import { SidebarNav } from './SidebarNav.jsx';
import { Wordmark } from './Wordmark.jsx';

// The app's navigation. From 1024px it is a column fixed beside the page; below that it is a
// drawer, opened from the topbar's menu button and closed by choosing a section.
export function Sidebar({ drawerOpen, onDrawerClose }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        <div className="sticky top-0 flex h-dvh flex-col gap-8 p-5">
          <Link to={ROUTES.DASHBOARD} aria-label={`${BRAND.APP} home`}>
            <Wordmark />
          </Link>
          <SidebarNav />
        </div>
      </aside>
      <Modal open={drawerOpen} onClose={onDrawerClose} title={BRAND.APP} placement="left">
        <SidebarNav onNavigate={onDrawerClose} />
      </Modal>
    </>
  );
}
