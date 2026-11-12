'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { brandApi } from '../lib/api';
import { brandWorkspaceApi, ServiceError } from '../services';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';

export function useBrandSync(preferredTenantId?: string, hasServerVerifiedUser = false) {
  const { data: session, status } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const [authInvalid, setAuthInvalid] = useState(false);
  const syncInFlightRef = useRef<Promise<boolean> | null>(null);

  const setLiveSync = useWorkspaceStore((s) => s.setLiveSync);
  const applySyncedProfile = useWorkspaceStore((s) => s.applySyncedProfile);
  const setProducts = useWorkspaceStore((s) => s.setProducts);
  const setOrders = useWorkspaceStore((s) => s.setOrders);
  const setFabrics = useWorkspaceStore((s) => s.setFabrics);
  const setBackendOnboardingStatus = useWorkspaceStore((s) => s.setBackendOnboardingStatus);

  const markOnboardingStatusForAliases = useCallback(
    (ids: Array<string | undefined | null>, value: boolean | null) => {
      const uniqueIds = Array.from(
        new Set(
          ids
            .map((id) => (typeof id === 'string' ? id.trim() : ''))
            .filter(Boolean)
        )
      );
      for (const id of uniqueIds) {
        setBackendOnboardingStatus(id, value);
      }
    },
    [setBackendOnboardingStatus]
  );

  const syncNow = useCallback(async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && localStorage.getItem('brand_token')) {
      localStorage.removeItem('brand_token');
    }

    if (status === 'loading' && !hasServerVerifiedUser) {
      return false;
    }

    if (syncInFlightRef.current) {
      return syncInFlightRef.current;
    }

    const run = (async () => {
      setIsSyncing(true);
      const fallbackTenantIds = [
        preferredTenantId,
        session?.user?.tenantId,
        useWorkspaceStore.getState().profile.id,
      ];

      let hasSession = hasServerVerifiedUser || Boolean(session?.user?.id);
      if (!hasSession) {
        try {
          const s = await brandApi.session();
          hasSession = Boolean(s?.authenticated);
        } catch {
          hasSession = false;
        }
      }

      if (!hasSession) {
        setLiveSync(false);
        markOnboardingStatusForAliases(fallbackTenantIds, null);
        return false;
      }

      try {
        const [profileRes, analyticsRes, productsRes, ordersRes, fabricsRes] =
          await Promise.allSettled([
            brandWorkspaceApi.getProfile(),
            brandWorkspaceApi.getAnalytics(),
            brandWorkspaceApi.getProducts(),
            brandWorkspaceApi.getOrders(),
            brandWorkspaceApi.getFabrics(),
          ]);

        if (profileRes.status === 'fulfilled') {
          const p = profileRes.value;
          const analytics =
            analyticsRes.status === 'fulfilled' ? analyticsRes.value : null;
          const completed = Boolean(p.onboardingCompleted);

          applySyncedProfile({
            ...p,
            owner: p.owner || session?.user?.name || '',
            quotaUsed: analytics?.tryOnUsage?.used ?? undefined,
            quotaMax: analytics?.tryOnUsage?.quota ?? undefined,
            plan: analytics?.tryOnUsage?.plan ?? undefined,
          });

          markOnboardingStatusForAliases(
            [p.id, preferredTenantId, session?.user?.tenantId],
            completed
          );

          if (productsRes.status === 'fulfilled' && productsRes.value.length > 0) {
            setProducts(productsRes.value);
          }
          if (ordersRes.status === 'fulfilled' && ordersRes.value.length > 0) {
            setOrders(ordersRes.value);
          }
          if (fabricsRes.status === 'fulfilled' && fabricsRes.value.length > 0) {
            setFabrics(fabricsRes.value);
          }

          setAuthInvalid(false);
          setLiveSync(true);
          return true;
        }

        if (
          profileRes.status === 'rejected' &&
          profileRes.reason instanceof ServiceError &&
          profileRes.reason.status === 401
        ) {
          setAuthInvalid(true);
        }
      } catch {
        // Fallback safely when backend is unreachable
      } finally {
        setIsSyncing(false);
      }

      markOnboardingStatusForAliases(fallbackTenantIds, null);
      setLiveSync(false);
      return false;
    })();

    syncInFlightRef.current = run;
    try {
      return await run;
    } finally {
      syncInFlightRef.current = null;
      setIsSyncing(false);
    }
  }, [
    hasServerVerifiedUser,
    markOnboardingStatusForAliases,
    preferredTenantId,
    session?.user?.id,
    session?.user?.name,
    session?.user?.tenantId,
    setFabrics,
    setLiveSync,
    setOrders,
    setProducts,
    status,
    applySyncedProfile,
  ]);

  useEffect(() => {
    void syncNow();
  }, [syncNow]);

  return { syncNow, isSyncing, authInvalid };
}

