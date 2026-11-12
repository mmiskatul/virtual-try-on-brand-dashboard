'use client';

import React, { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { Provider } from 'react-redux';
import { brandApi } from '../lib/api';
import { store } from '../store';
import { workspaceActions } from '../store/slices/workspaceSlice';
import {
  notifyWorkspaceHydrated,
  readPersistedWorkspaceState,
} from '../store/middleware/persistence';

function ReduxWorkspaceHydrator() {
  useEffect(() => {
    const persisted = readPersistedWorkspaceState();
    store.dispatch(workspaceActions.hydrateWorkspace(persisted));
    notifyWorkspaceHydrated();
  }, []);

  return null;
}

function SessionTokenSync() {
  const { data: session, status } = useSession();
  const syncedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('brand_token')) {
      localStorage.removeItem('brand_token');
    }

    if (status === 'unauthenticated') {
      syncedUserRef.current = null;
      return;
    }

    if (status !== 'authenticated' || !session?.user?.id) return;
    if (syncedUserRef.current === session.user.id) return;
    syncedUserRef.current = session.user.id;

    let cancelled = false;
    (async () => {
      try {
        const s = await brandApi.session();
        if (s?.authenticated || cancelled) return;

        const handoff = await fetch('/api/auth/cookie-handoff', {
          method: 'POST',
          credentials: 'include',
        });
        if (cancelled) return;
        if (handoff.status === 401) {
          const data = await handoff.json().catch(() => ({}));
          if (data?.needsReauth) {
            await brandApi.logout().catch(() => {});
            await signOut({ redirect: false });
          }
        }
      } catch {
        // Backend temporarily unreachable; keep current session state without wiping cookies
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, status]);

  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  );

  return (
    <Provider store={store}>
      <ReduxWorkspaceHydrator />
      <SessionProvider>
        <SessionTokenSync />
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SessionProvider>
    </Provider>
  );
}
