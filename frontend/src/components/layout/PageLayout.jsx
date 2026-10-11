import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { BookingModal } from '../booking/BookingModal.jsx';
import { Footer } from './Footer.jsx';
import { InPageScroll } from './InPageScroll.jsx';
import { Navbar } from './Navbar.jsx';
import { ParticleField } from './ParticleField.jsx';

export function PageLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh flex-col">
      <ParticleField />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-pill focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-on-primary"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1">
        {/* Keyed by the path, so each page arrives with the same rise; a change of search
            params (filters, the booking modal) is the same page and does not replay it. */}
        <div key={pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>
      <Footer />
      <BookingModal />
      <InPageScroll />
      <ScrollRestoration />
    </div>
  );
}
