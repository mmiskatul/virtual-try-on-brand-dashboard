'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '../types';
import { useProductStore } from '../stores/useProductStore';
import { revalidateBrandCatalog } from '../app/actions/revalidate';

interface TogglePublicationPayload {
  id: string;
  channel: 'brandStorefrontPublished' | 'marketplacePublished';
}

interface UpdateStockPayload {
  id: string;
  delta: number;
}

export function useOptimisticProducts(onToast: (msg: string) => void) {
  const queryClient = useQueryClient();
  const togglePublicationStore = useProductStore((s) => s.togglePublication);
  const updateStockStore = useProductStore((s) => s.updateStock);
  const items = useProductStore((s) => s.items);

  // 1. Optimistic Mutation: Toggle Publication Visibility
  const togglePublicationMutation = useMutation({
    mutationFn: async ({ id, channel }: TogglePublicationPayload) => {
      // In production, sends PATCH to brand-api
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { id, channel, success: true };
    },
    onMutate: async ({ id, channel }) => {
      // Cancel outgoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['brand-products'] });

      // Snapshot previous products
      const previousProducts = queryClient.getQueryData<Product[]>(['brand-products']) || items;

      // Optimistically update the UI instantly (0ms)
      togglePublicationStore({ id, channel });

      // Update TanStack Query cache optimistically
      queryClient.setQueryData<Product[]>(['brand-products'], (old) => {
        if (!old) return old;
        return old.map((p) => {
          if (p.id === id) {
            return {
              ...p,
              [channel]: !p[channel],
            };
          }
          return p;
        });
      });

      onToast(`Optimistically updated ${channel === 'brandStorefrontPublished' ? 'Storefront' : 'Marketplace'} visibility.`);

      return { previousProducts };
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous state on error
      if (context?.previousProducts) {
        queryClient.setQueryData(['brand-products'], context.previousProducts);
      }
      onToast('Sync failed! Reverting visibility changes.');
    },
    onSettled: () => {
      // Invalidate query and trigger server tag revalidation in background
      queryClient.invalidateQueries({ queryKey: ['brand-products'] });
      revalidateBrandCatalog('brand-products').catch(() => {});
    },
  });

  // 2. Optimistic Mutation: Update Stock Quantity
  const updateStockMutation = useMutation({
    mutationFn: async ({ id, delta }: UpdateStockPayload) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { id, delta, success: true };
    },
    onMutate: async ({ id, delta }) => {
      await queryClient.cancelQueries({ queryKey: ['brand-products'] });

      const previousProducts = queryClient.getQueryData<Product[]>(['brand-products']) || items;

      // Update state instantly
      updateStockStore({ id, delta });

      queryClient.setQueryData<Product[]>(['brand-products'], (old) => {
        if (!old) return old;
        return old.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p));
      });

      return { previousProducts };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(['brand-products'], context.previousProducts);
      }
      onToast('Stock sync failed! Reverting inventory count.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-products'] });
      revalidateBrandCatalog('brand-inventory').catch(() => {});
    },
  });

  return {
    optimisticTogglePublication: (id: string, channel: 'brandStorefrontPublished' | 'marketplacePublished') =>
      togglePublicationMutation.mutate({ id, channel }),
    optimisticUpdateStock: (id: string, delta: number) =>
      updateStockMutation.mutate({ id, delta }),
    isSyncing: togglePublicationMutation.isPending || updateStockMutation.isPending,
  };
}
