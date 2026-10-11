import { createBrowserRouter } from 'react-router';
import { RequireAuth } from './components/auth/RequireAuth.jsx';
import { RequireCompleteProfile } from './components/auth/RequireCompleteProfile.jsx';
import { PageLayout } from './components/layout/PageLayout.jsx';
import { RouteFallback } from './components/layout/RouteFallback.jsx';
import { ROUTES } from './lib/constants.js';

// Every page's code is loaded when its route is first visited.
const page = (load, name) => ({
  lazy: async () => {
    const module = await load();
    return { Component: module[name] };
  },
});

// Every page is a lazy route inside the layout shell. The catch-all must stay last.
export const routes = [
  {
    Component: PageLayout,
    HydrateFallback: RouteFallback,
    children: [
      { index: true, ...page(() => import('./pages/HomePage.jsx'), 'HomePage') },
      { path: ROUTES.SIGN_IN, ...page(() => import('./pages/SignInPage.jsx'), 'SignInPage') },
      {
        Component: RequireAuth,
        children: [
          {
            path: ROUTES.ONBOARDING,
            ...page(() => import('./pages/OnboardingPage.jsx'), 'OnboardingPage'),
          },
          {
            Component: RequireCompleteProfile,
            children: [
              {
                path: ROUTES.ACCOUNT,
                ...page(() => import('./pages/AccountPage.jsx'), 'AccountPage'),
              },
            ],
          },
        ],
      },
      { path: '*', ...page(() => import('./pages/NotFoundPage.jsx'), 'NotFoundPage') },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
