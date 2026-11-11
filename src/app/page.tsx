'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Product } from '../types';
import { brandApi } from '../lib/api';

import { BrandSidebar } from '../components/layout/BrandSidebar';
import { BrandHeader } from '../components/layout/BrandHeader';
import { ToastNotification } from '../components/ui/ToastNotification';
import { AddProductModal } from '../components/ui/AddProductModal';

import { OverviewModule } from '../components/modules/OverviewModule';
import { ProductsModule } from '../components/modules/ProductsModule';
import { FabricsModule } from '../components/modules/FabricsModule';
import { InventoryModule } from '../components/modules/InventoryModule';
import { StorefrontModule } from '../components/modules/StorefrontModule';
import { OrdersModule } from '../components/modules/OrdersModule';
import { AiStudioModule } from '../components/modules/AiStudioModule';

import { useBrandStore } from '../stores/useBrandStore';
import { useProductStore } from '../stores/useProductStore';
import { useFabricStore } from '../stores/useFabricStore';
import { useOrderStore } from '../stores/useOrderStore';
import { useUiStore } from '../stores/useUiStore';
import { useOptimisticProducts } from '../hooks/useOptimisticProducts';

export default function BrandDashboardPage() {
  // Zustand Client State
  const brand = useBrandStore((state) => state.profile);
  const updateStorefrontSettings = useBrandStore((state) => state.updateStorefrontSettings);
  const products = useProductStore((state) => state.items);
  const addProduct = useProductStore((state) => state.addProduct);
  const deleteProduct = useProductStore((state) => state.deleteProduct);
  const togglePublication = useProductStore((state) => state.togglePublication);
  const updateStock = useProductStore((state) => state.updateStock);
  const setProducts = useProductStore((state) => state.setProducts);

  const fabrics = useFabricStore((state) => state.items);
  const addFabric = useFabricStore((state) => state.addFabric);
  const setFabrics = useFabricStore((state) => state.setFabrics);

  const orders = useOrderStore((state) => state.items);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const setOrders = useOrderStore((state) => state.setOrders);

  const {
    activeTab,
    toastMessage,
    isAddProductModalOpen,
    setActiveTab,
    showToast,
    hideToast,
    openAddProductModal,
    closeAddProductModal
  } = useUiStore();

  // Server State via TanStack Query (queries brand-api)
  const { refetch: refetchProducts } = useQuery({
    queryKey: ['brand-products'],
    queryFn: async () => {
      try {
        const liveProducts = await brandApi.getProducts();
        if (Array.isArray(liveProducts) && liveProducts.length > 0) {
          setProducts(liveProducts);
        }
        return liveProducts;
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
    retry: false
  });

  const { refetch: refetchFabrics } = useQuery({
    queryKey: ['brand-fabrics'],
    queryFn: async () => {
      try {
        const liveFabrics = await brandApi.getFabrics();
        if (Array.isArray(liveFabrics) && liveFabrics.length > 0) {
          setFabrics(liveFabrics);
        }
        return liveFabrics;
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
    retry: false
  });

  const { refetch: refetchOrders } = useQuery({
    queryKey: ['brand-orders'],
    queryFn: async () => {
      try {
        const liveOrders = await brandApi.getOrders();
        if (Array.isArray(liveOrders) && liveOrders.length > 0) {
          setOrders(liveOrders);
        }
        return liveOrders;
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
    retry: false
  });

  const triggerToast = (msg: string) => {
    showToast(msg);
    setTimeout(() => {
      hideToast();
    }, 3000);
  };

  // TanStack Query Optimistic UI Mutations with Background Sync
  const { optimisticTogglePublication, optimisticUpdateStock, isSyncing } = useOptimisticProducts(triggerToast);

  const handleRefresh = async () => {
    triggerToast('Synchronizing tenant catalog with brand-api...');
    await Promise.allSettled([refetchProducts(), refetchFabrics(), refetchOrders()]);
    triggerToast('Tenant catalog refreshed.');
  };

  const handleTogglePublication = (id: string, field: 'brandStorefrontPublished' | 'marketplacePublished') => {
    optimisticTogglePublication(id, field);
  };

  const handleAddProduct = (newProd: Product) => {
    addProduct(newProd);
    closeAddProductModal();
    triggerToast('New product created with dual publication configuration!');
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to remove this garment from your catalog?')) {
      deleteProduct(id);
      triggerToast('Product deleted from tenant catalog.');
    }
  };

  const handleAddFabric = () => {
    const name = prompt('Fabric Name (e.g., Japanese Raw Denim):');
    if (name) {
      addFabric({
        id: `fab_${Date.now()}`,
        name,
        composition: '100% Selvedge Cotton',
        stretch: 'NONE',
        thickness: 'HEAVY',
        care: 'Cold soak only, hang dry.'
      });
      triggerToast(`Fabric '${name}' registered in tenant library.`);
    }
  };

  const handleAddStock = (id: string, delta: number) => {
    optimisticUpdateStock(id, delta);
  };

  const handleDeductStock = (id: string, delta: number) => {
    optimisticUpdateStock(id, -delta);
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: 'SHIPPED' | 'DELIVERED') => {
    updateOrderStatus({ orderId, status: nextStatus });
    triggerToast(`Order ${orderId} status updated to ${nextStatus}`);
  };

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      <ToastNotification message={toastMessage} />

      <BrandSidebar
        brand={brand}
        currentBrand="aura"
        setCurrentBrand={() => {}}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ordersCount={orders.length}
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        <BrandHeader
          activeTab={activeTab}
          brand={brand}
          onRefresh={handleRefresh}
        />

        {activeTab === 'overview' && (
          <OverviewModule
            brand={brand}
            products={products}
            orders={orders}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'products' && (
          <ProductsModule
            products={products}
            onTogglePublication={handleTogglePublication}
            onDeleteProduct={handleDeleteProduct}
            onOpenAddModal={openAddProductModal}
          />
        )}

        {activeTab === 'fabrics' && (
          <FabricsModule
            fabrics={fabrics}
            onAddFabric={handleAddFabric}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryModule
            products={products}
            onAddStock={handleAddStock}
            onDeductStock={handleDeductStock}
          />
        )}

        {activeTab === 'storefront' && (
          <StorefrontModule
            brand={brand}
            onSave={(data) => {
              updateStorefrontSettings(data);
              triggerToast('Storefront theme preferences saved.');
            }}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersModule
            orders={orders}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === 'ai' && <AiStudioModule brand={brand} />}
      </main>

      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={closeAddProductModal}
        onAdd={handleAddProduct}
      />
    </div>
  );
}
