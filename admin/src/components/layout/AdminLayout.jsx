import { useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

// The shell around every signed-in page: sidebar, topbar, and the page with 24px of padding.
export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-pill focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-on-primary"
      >
        Skip to content
      </a>
      <Sidebar drawerOpen={drawerOpen} onDrawerClose={() => setDrawerOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuOpen={() => setDrawerOpen(true)} />
        <main id="main" tabIndex={-1} className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </div>
  );
}
