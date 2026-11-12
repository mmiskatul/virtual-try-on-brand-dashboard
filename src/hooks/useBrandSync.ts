'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { brandApi } from '../lib/api';
import { brandWorkspaceApi } from '../services';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';

export function useBrandSync(preferredTenantId?: string) {
  const { data: session, status } = useSession();
  const setLiveSync = useWorkspaceStore((s) => s.setLiveSync);
  const updateProfile = useWorkspaceStore((s) => s.updateProfile);
  const setProducts = useWorkspaceStore((s) => s.setProducts);
  const setOrders = useWorkspaceStore((s) => s.setOrders);
  const setFabrics = useWorkspaceStore((s) => s.setFabrics);
  const setBackendOnboardingStatus = useWorkspaceStore((s) => s.setBackendOnboardingStatus);

  const syncNow = async () => {
    if (typeof window !== 'undefined' && localStorage.getItem('brand_token')) {
      localStorage.removeItem('brand_token');
    }

    if (status === 'loading') {
      return false;
    }

    const fallbackTenantId =
      preferredTenantId ||
      session?.user?.tenantId ||
      useWorkspaceStore.getState().profile.id ||
      '';

    let hasSession = Boolean(session?.user?.id);
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
      if (fallbackTenantId) {
        setBackendOnboardingStatus(fallbackTenantId, null);
      }
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

        updateProfile({
          ...p,
          owner: p.owner || session?.user?.name || '',
          quotaUsed: analytics?.tryOnUsage?.used ?? undefined,
          quotaMax: analytics?.tryOnUsage?.quota ?? undefined,
          plan: analytics?.tryOnUsage?.plan ?? undefined,
        });

        setBackendOnboardingStatus(p.id, Boolean(p.onboardingCompleted));

        if (productsRes.status === 'fulfilled' && productsRes.value.length > 0) {
          setProducts(productsRes.value);
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value.length > 0) {
          setOrders(ordersRes.value);
        }
        if (fabricsRes.status === 'fulfilled' && fabricsRes.value.length > 0) {
          setFabrics(fabricsRes.value);
        }

        setLiveSync(true);
        return true;
      }
    } catch {
      // Fallback safely when backend is unreachable
    }
    if (fallbackTenantId) {
      setBackendOnboardingStatus(fallbackTenantId, null);
    }
    setLiveSync(false);
    return false;
  };

  useEffect(() => {
    syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, status]);

  return { syncNow };
}

