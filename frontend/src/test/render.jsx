import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppToaster } from '../components/layout/AppToaster.jsx';
import { ThemeProvider } from '../components/ThemeProvider.jsx';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

// Renders routes inside the app's providers on an in-memory router.
export const renderRoutes = (routes, { path = '/', onThemeChange } = {}) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(
    <QueryClientProvider client={createTestQueryClient()}>
      <ThemeProvider onChange={onThemeChange}>
        <RouterProvider router={router} />
        <AppToaster />
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return { router, ...view };
};

// Renders one element at every path.
export const renderApp = (ui, options) => renderRoutes([{ path: '*', element: ui }], options);
