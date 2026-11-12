import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TabType } from '../../types';

export interface UiSliceState {
  activeTab: TabType;
  toastMessage: string | null;
  isAddProductModalOpen: boolean;
}

const initialState: UiSliceState = {
  activeTab: 'overview',
  toastMessage: null,
  isAddProductModalOpen: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<TabType>) => {
      state.activeTab = action.payload;
    },
    showToast: (state, action: PayloadAction<string>) => {
      state.toastMessage = action.payload;
    },
    hideToast: (state) => {
      state.toastMessage = null;
    },
    openAddProductModal: (state) => {
      state.isAddProductModalOpen = true;
    },
    closeAddProductModal: (state) => {
      state.isAddProductModalOpen = false;
    },
  },
});

export const uiActions = uiSlice.actions;
export default uiSlice.reducer;

