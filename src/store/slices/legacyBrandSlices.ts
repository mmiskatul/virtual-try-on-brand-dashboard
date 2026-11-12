import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BrandProfile, Fabric, Order, Product } from '../../types';
import { initialBrands, initialFabrics, initialOrders, initialProducts } from '../../lib/mock_data';

export interface BrandSliceState {
  profile: BrandProfile;
}

export const brandSlice = createSlice({
  name: 'brand',
  initialState: { profile: initialBrands.aura } as BrandSliceState,
  reducers: {
    setProfile: (state, action: PayloadAction<BrandProfile>) => {
      state.profile = action.payload;
    },
    updateStorefrontSettings: (
      state,
      action: PayloadAction<{ announcement: string; primaryColor: string }>
    ) => {
      state.profile = {
        ...state.profile,
        announcement: action.payload.announcement,
        primaryColor: action.payload.primaryColor,
      };
    },
    incrementTryOnUsed: (state) => {
      state.profile = {
        ...state.profile,
        quotaUsed: state.profile.quotaUsed + 1,
      };
    },
  },
});

export interface ProductSliceState {
  items: Product[];
  selectedCategory: string;
  searchQuery: string;
}

export const productSlice = createSlice({
  name: 'product',
  initialState: {
    items: initialProducts,
    selectedCategory: 'All',
    searchQuery: '',
  } as ProductSliceState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
    },
    addProduct: (state, action: PayloadAction<Product>) => {
      state.items = [action.payload, ...state.items];
    },
    deleteProduct: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
    togglePublication: (
      state,
      action: PayloadAction<{ id: string; channel: 'brandStorefrontPublished' | 'marketplacePublished' }>
    ) => {
      const { id, channel } = action.payload;
      state.items = state.items.map((p) => (p.id === id ? { ...p, [channel]: !p[channel] } : p));
    },
    updateStock: (state, action: PayloadAction<{ id: string; delta: number }>) => {
      const { id, delta } = action.payload;
      state.items = state.items.map((p) =>
        p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      );
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export interface OrderSliceState {
  items: Order[];
}

export const orderSlice = createSlice({
  name: 'order',
  initialState: { items: initialOrders } as OrderSliceState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.items = action.payload;
    },
    updateOrderStatus: (
      state,
      action: PayloadAction<{ orderId: string; status: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' }>
    ) => {
      const { orderId, status } = action.payload;
      state.items = state.items.map((o) => (o.id === orderId ? { ...o, status } : o));
    },
  },
});

export interface FabricSliceState {
  items: Fabric[];
}

export const fabricSlice = createSlice({
  name: 'fabric',
  initialState: { items: initialFabrics } as FabricSliceState,
  reducers: {
    setFabrics: (state, action: PayloadAction<Fabric[]>) => {
      state.items = action.payload;
    },
    addFabric: (state, action: PayloadAction<Fabric>) => {
      state.items.push(action.payload);
    },
  },
});

export const brandActions = brandSlice.actions;
export const productActions = productSlice.actions;
export const orderActions = orderSlice.actions;
export const fabricActions = fabricSlice.actions;

