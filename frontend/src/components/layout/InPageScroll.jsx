import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router';

// Makes a link to a section of the page the visitor is already on (Book Now, View packages)
// scroll there instead of jumping. A new page, and the first one, still open in place. It must
// be rendered before `ScrollRestoration`: the router scrolls in a layout effect, and this one
// has to run first. With reduced motion the base styles keep every scroll instant.
export function InPageScroll() {
  const { pathname, hash, key } = useLocation();
  const previousPath = useRef(null);

  useLayoutEffect(() => {
    const samePage = previousPath.current === pathname;
    previousPath.current = pathname;
    document.documentElement.style.scrollBehavior = samePage && hash ? 'smooth' : '';
  }, [pathname, hash, key]);

  return null;
}
