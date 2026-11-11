'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { brandWorkspaceApi } from '../services';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';

export function useBrandSync() {
  const { data: session } = useSession();
  const setLiveSync = useWorkspaceStore((s) => s.setLiveSync);
  const updateProfile = useWorkspaceStore((s) => s.updateProfile);
  const setProducts = useWorkspaceStore((s) => s.setProducts);
  const setOrders = useWorkspaceStore((s) => s.setOrders);
  const setFabrics = useWorkspaceStore((s) => s.setFabrics);

  const syncNow = async () => {
    const token =
      session?.backendToken ||
      (typeof window !== 'undefined' ? localStorage.getItem('brand_token') : null);
    if (!token) {
      setLiveSync(false);
      return false;
    }

    if (typeof window !== 'undefined' && session?.backendToken) {
      localStorage.setItem('brand_token', session.backendToken);
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
          owner: session?.user?.name || p.owner,
          quotaUsed: analytics?.tryOnUsage?.used ?? undefined,
          quotaMax: analytics?.tryOnUsage?.quota ?? undefined,
          plan: analytics?.tryOnUsage?.plan ?? undefined,
        });

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
      // Fallback safely to demo mode
    }
    setLiveSync(false);
    return false;
  };

  useEffect(() => {
    syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.backendToken]);

  return { syncNow };
}

