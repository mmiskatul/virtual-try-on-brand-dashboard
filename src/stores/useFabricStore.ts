import { create } from 'zustand';
import { Fabric } from '../types';
import { initialFabrics } from '../lib/mock_data';

interface FabricState {
  items: Fabric[];
  setFabrics: (fabrics: Fabric[]) => void;
  addFabric: (fabric: Fabric) => void;
}

export const useFabricStore = create<FabricState>((set) => ({
  items: initialFabrics,
  setFabrics: (items) => set({ items }),
  addFabric: (fabric) => set((state) => ({ items: [...state.items, fabric] }))
}));
