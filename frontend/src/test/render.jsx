import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppToaster } from '../components/layout/AppToaster.jsx';
import { SessionThemeProvider } from '../components/SessionThemeProvider.jsx';
import { ThemeProvider } from '../components/ThemeProvider.jsx';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

// Renders routes inside the app's providers on an in-memory router. Passing `onThemeChange`
// swaps the app's session-aware theme provider for the bare one, to observe its callback.
export const renderRoutes = (routes, { path = '/', onThemeChange } = {}) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = createTestQueryClient();
  const app = (
    <>
      <RouterProvider router={router} />
      <AppToaster />
    </>
  );
  const view = render(
    <QueryClientProvider client={queryClient}>
      {onThemeChange ? (
        <ThemeProvider onChange={onThemeChange}>{app}</ThemeProvider>
      ) : (
        <SessionThemeProvider>{app}</SessionThemeProvider>
      )}
    </QueryClientProvider>,
  );
  return { router, queryClient, ...view };
};

// Renders one element at every path.
export const renderApp = (ui, options) => renderRoutes([{ path: '*', element: ui }], options);

// The router's current URL, as the address bar would show it.
export const currentUrl = (router) => {
  const { pathname, search, hash } = router.state.location;
  return `${pathname}${search}${hash}`;
};
