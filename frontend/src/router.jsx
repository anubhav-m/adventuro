import { createBrowserRouter } from 'react-router';
import { PageLayout } from './components/layout/PageLayout.jsx';
import { RouteFallback } from './components/layout/RouteFallback.jsx';

// Every page is a lazy route inside the layout shell. The catch-all must stay last.
export const routes = [
  {
    Component: PageLayout,
    HydrateFallback: RouteFallback,
    children: [
      {
        path: '*',
        lazy: async () => {
          const { NotFoundPage } = await import('./pages/NotFoundPage.jsx');
          return { Component: NotFoundPage };
        },
      },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
