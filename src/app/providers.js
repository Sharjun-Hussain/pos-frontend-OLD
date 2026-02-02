'use client';
import { signOut, SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './providers/theme-provider';
import { SWRProvider } from './providers/swr-provider';
import SessionGuard from '@/components/auth/SessionGuard';
import { useEffect } from 'react';

export default function Providers({ children }) {
  useEffect(() => {
    const { fetch: originalFetch } = window;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        // Prevent redirect loop if we're already on login/me/session pages
        const url = args[0]?.toString() || "";
        if (!url.includes('/login') && !url.includes('/session') && !url.includes('/me')) {
          signOut({ callbackUrl: '/login' });
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <SessionProvider>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"

      disableTransitionOnChange
    >
      <SWRProvider>
        <SessionGuard>
          {children}
        </SessionGuard>
      </SWRProvider>
    </ThemeProvider></SessionProvider>;
}