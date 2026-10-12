import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { AppToaster } from './components/layout/AppToaster.jsx';
import { SessionThemeProvider } from './components/SessionThemeProvider.jsx';
import { createQueryClient } from './lib/queryClient.js';
import { createAppRouter } from './router.jsx';

const queryClient = createQueryClient();
const router = createAppRouter();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionThemeProvider>
        <RouterProvider router={router} />
        <AppToaster />
      </SessionThemeProvider>
    </QueryClientProvider>
  );
}
