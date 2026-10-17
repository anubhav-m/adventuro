import { createBrowserRouter } from 'react-router';
import { RequireAdmin } from './components/auth/RequireAdmin.jsx';
import { AdminLayout } from './components/layout/AdminLayout.jsx';
import { RouteFallback } from './components/layout/RouteFallback.jsx';
import { ROUTES } from './lib/constants.js';

// Every page's code is loaded when its route is first visited.
const page = (load, name) => ({
  lazy: async () => {
    const module = await load();
    return { Component: module[name] };
  },
});

// Login is the only route outside the guard. Everything else sits inside RequireAdmin and the
// layout shell, and the catch-all must stay last.
export const routes = [
  {
    HydrateFallback: RouteFallback,
    children: [
      { path: ROUTES.LOGIN, ...page(() => import('./pages/LoginPage.jsx'), 'LoginPage') },
      {
        Component: RequireAdmin,
        children: [
          {
            Component: AdminLayout,
            children: [
              {
                index: true,
                ...page(() => import('./pages/DashboardPage.jsx'), 'DashboardPage'),
              },
              {
                path: 'verticals',
                ...page(() => import('./pages/VerticalsPage.jsx'), 'VerticalsPage'),
              },
              {
                path: 'verticals/:id',
                ...page(() => import('./pages/VerticalEditPage.jsx'), 'VerticalEditPage'),
              },
              { path: 'tours', ...page(() => import('./pages/ToursPage.jsx'), 'ToursPage') },
              // New and edit share one page; the static segment wins over `:id`.
              {
                path: 'tours/new',
                ...page(() => import('./pages/TourEditPage.jsx'), 'TourEditPage'),
              },
              {
                path: 'tours/:id',
                ...page(() => import('./pages/TourEditPage.jsx'), 'TourEditPage'),
              },
              { path: 'gear', ...page(() => import('./pages/GearPage.jsx'), 'GearPage') },
              {
                path: 'gear/new',
                ...page(() => import('./pages/GearEditPage.jsx'), 'GearEditPage'),
              },
              {
                path: 'gear/:id',
                ...page(() => import('./pages/GearEditPage.jsx'), 'GearEditPage'),
              },
              {
                path: 'taxonomies',
                ...page(() => import('./pages/TaxonomiesPage.jsx'), 'TaxonomiesPage'),
              },
              { path: '*', ...page(() => import('./pages/NotFoundPage.jsx'), 'NotFoundPage') },
            ],
          },
        ],
      },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
