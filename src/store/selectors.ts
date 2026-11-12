import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

export const selectWorkspaceState = (state: RootState) => state.workspace;
export const selectUiState = (state: RootState) => state.ui;
export const selectBrandState = (state: RootState) => state.brand;
export const selectProductState = (state: RootState) => state.product;
export const selectOrderState = (state: RootState) => state.order;
export const selectFabricState = (state: RootState) => state.fabric;

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

export const selectFilteredCatalogProducts = createSelector(
  [selectProductState],
  ({ items, selectedCategory, searchQuery }) => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const catMatch = selectedCategory === 'All' || item.category === selectedCategory;
      const queryMatch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      return catMatch && queryMatch;
    });
  }
);
