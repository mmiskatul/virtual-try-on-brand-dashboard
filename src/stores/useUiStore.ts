import { create } from 'zustand';
import { TabType } from '../types';

interface UiState {
  activeTab: TabType;
  toastMessage: string | null;
  isAddProductModalOpen: boolean;
  setActiveTab: (tab: TabType) => void;
  showToast: (message: string) => void;
  hideToast: () => void;
  openAddProductModal: () => void;
  closeAddProductModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'overview',
  toastMessage: null,
  isAddProductModalOpen: false,
  setActiveTab: (activeTab) => set({ activeTab }),
  showToast: (toastMessage) => set({ toastMessage }),
  hideToast: () => set({ toastMessage: null }),
  openAddProductModal: () => set({ isAddProductModalOpen: true }),
  closeAddProductModal: () => set({ isAddProductModalOpen: false })
}));
