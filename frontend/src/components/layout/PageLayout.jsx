import { Outlet, ScrollRestoration } from 'react-router';
import { BookingModal } from '../booking/BookingModal.jsx';
import { Footer } from './Footer.jsx';
import { Navbar } from './Navbar.jsx';

export function PageLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-pill focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-on-primary"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BookingModal />
      <ScrollRestoration />
    </div>
  );
}
