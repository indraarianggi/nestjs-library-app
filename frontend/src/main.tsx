import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NuqsAdapter } from 'nuqs/adapters/react';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/sonner';
import { queryClient } from './lib/react-query';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ThemeProvider defaultTheme="light" storageKey="library-ui-theme">
          <App />
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </NuqsAdapter>
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  </StrictMode>,
);
