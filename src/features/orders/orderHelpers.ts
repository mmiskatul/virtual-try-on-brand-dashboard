'use client';

import { useCallback, useState } from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services/brandService';
import type { Order } from '../../types';

export type OrderStatusValue = Order['status'];

/** The steps an order moves through, in plain words. */
export const ORDER_STEPS: Array<{ key: 'NEW' | 'PACKED' | 'SHIPPED' | 'DELIVERED'; label: string }> = [
  { key: 'NEW', label: 'Placed' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
];

/** Friendly group for each raw status. */
export type OrderGroup = 'NEW' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export function groupOf(status: OrderStatusValue): OrderGroup {
  switch (status) {
    case 'PROCESSING':
      return 'PACKED';
    case 'SHIPPED':
      return 'SHIPPED';
    case 'DELIVERED':
      return 'DELIVERED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'REFUNDED':
      return 'REFUNDED';
    default:
      return 'NEW'; // PENDING, CONFIRMED
  }
}

export const GROUP_LABEL: Record<OrderGroup, string> = {
  NEW: 'New',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const GROUP_STYLE: Record<OrderGroup, string> = {
  NEW: 'bg-amber-50 text-amber-800 border-amber-200',
  PACKED: 'bg-sky-50 text-sky-800 border-sky-200',
  SHIPPED: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  REFUNDED: 'bg-rose-50 text-rose-700 border-rose-200',
};

/** What the main button does for an order in each state. */
export function nextStep(status: OrderStatusValue): { to: OrderStatusValue; label: string } | null {
  switch (groupOf(status)) {
    case 'NEW':
      return { to: 'PROCESSING', label: 'Mark as packed' };
    case 'PACKED':
      return { to: 'SHIPPED', label: 'Mark as shipped' };
    case 'SHIPPED':
      return { to: 'DELIVERED', label: 'Mark as delivered' };
    default:
      return null;
  }
}

export function canCancel(status: OrderStatusValue): boolean {
  const g = groupOf(status);
  return g === 'NEW' || g === 'PACKED';
}

/** Order dates are text; return a timestamp or null when it cannot be read. */
export function orderTime(order: Order): number | null {
  const t = Date.parse(order.date);
  return Number.isNaN(t) ? null : t;
}

export const money = (n: number) => `৳${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Changing an order's status (saved on the server) and its tracking number. */
export function useOrderActions() {
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);
  const updateOrder = useWorkspaceStore((s) => s.updateOrder);
  const recordAudit = useWorkspaceStore((s) => s.recordAudit);
  const showToast = useUiStore((s) => s.showToast);
  const [savingId, setSavingId] = useState<string | null>(null);

  const setStatus = useCallback(
    async (order: Order, next: OrderStatusValue, quiet = false): Promise<boolean> => {
      setSavingId(order.id);
      try {
        if (isLiveBackend) {
          await brandWorkspaceApi.updateOrderStatus(order.id, next);
        }
        updateOrder(order.id, {
          status: next,
          timeline: [
            ...(order.timeline || []),
            { label: `Marked as ${GROUP_LABEL[groupOf(next)].toLowerCase()}`, at: new Date().toLocaleString() },
          ],
        });
        if (!quiet) showToast(`Order ${order.id} is now ${GROUP_LABEL[groupOf(next)].toLowerCase()}.`);
        return true;
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : `Could not update order ${order.id}. Please try again.`);
        return false;
      } finally {
        setSavingId(null);
      }
    },
    [isLiveBackend, updateOrder, showToast]
  );

  const saveTracking = useCallback(
    (order: Order, tracking: string) => {
      const value = tracking.trim();
      if (!value) return;
      updateOrder(order.id, {
        trackingNumber: value,
        timeline: [...(order.timeline || []), { label: `Tracking number added: ${value}`, at: new Date().toLocaleString() }],
      });
      recordAudit('ORDER_TRACKING_UPDATED', order.id, `Tracking set to ${value}`);
      showToast(`Saved tracking number ${value}.`);
    },
    [updateOrder, recordAudit, showToast]
  );

  return { setStatus, saveTracking, savingId };
}
