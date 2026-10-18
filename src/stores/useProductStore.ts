import { create } from 'zustand';
import { Product } from '../types';
import { initialProducts } from '../lib/mock_data';

interface ProductState {
  items: Product[];
  selectedCategory: string;
  searchQuery: string;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  togglePublication: (payload: { id: string; channel: 'brandStorefrontPublished' | 'marketplacePublished' }) => void;
  updateStock: (payload: { id: string; delta: number }) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  items: initialProducts,
  selectedCategory: 'All',
  searchQuery: '',
  setProducts: (items) => set({ items }),
  addProduct: (product) => set((state) => ({ items: [product, ...state.items] })),
  deleteProduct: (id) => set((state) => ({ items: state.items.filter((p) => p.id !== id) })),
  togglePublication: ({ id, channel }) =>
    set((state) => ({
      items: state.items.map((p) =>
        p.id === id ? { ...p, [channel]: !p[channel] } : p
      )
    })),
  updateStock: ({ id, delta }) =>
    set((state) => ({
      items: state.items.map((p) =>
        p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      )
    })),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSearchQuery: (searchQuery) => set({ searchQuery })
}));
