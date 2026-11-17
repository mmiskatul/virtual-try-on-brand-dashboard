import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

export const selectWorkspaceState = (state: RootState) => state.workspace;
export const selectUiState = (state: RootState) => state.ui;

export const selectProducts = createSelector(
  [selectWorkspaceState],
  (ws) => ws.products
);

export const selectActiveProducts = createSelector(
  [selectProducts],
  (products) => products.filter((p) => p.catalogStatus === 'ACTIVE' || p.marketplacePublished || p.brandStorefrontPublished)
);

export const selectLowStockProducts = createSelector(
  [selectProducts],
  (products) => products.filter((p) => p.stock > 0 && p.stock <= 10)
);

export const selectOrders = createSelector(
  [selectWorkspaceState],
  (ws) => ws.orders
);

export const selectOrderMetrics = createSelector(
  [selectOrders, (state: RootState) => state.workspace.returns],
  (orders, returns) => ({
    totalOrders: orders.length,
    totalRevenue: orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0),
    pendingReturns: returns.filter((r) => r.status === 'PENDING').length,
  })
);
