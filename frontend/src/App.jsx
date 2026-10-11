import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { AppToaster } from './components/layout/AppToaster.jsx';
import { ThemeProvider } from './components/ThemeProvider.jsx';
import { createQueryClient } from './lib/queryClient.js';
import { createAppRouter } from './router.jsx';

const queryClient = createQueryClient();
const router = createAppRouter();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
        <AppToaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
