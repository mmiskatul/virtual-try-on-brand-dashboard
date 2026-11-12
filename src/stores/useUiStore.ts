import { TabType } from '../types';
import { store } from '../store';
import { createSliceFacadeHook } from '../store/hooks';
import { selectUiState } from '../store/selectors';
import { uiActions } from '../store/slices/uiSlice';

const uiBoundActions = {
  setActiveTab: (tab: TabType) => {
    store.dispatch(uiActions.setActiveTab(tab));
  },
  showToast: (message: string) => {
    store.dispatch(uiActions.showToast(message));
  },
  hideToast: () => {
    store.dispatch(uiActions.hideToast());
  },
  openAddProductModal: () => {
    store.dispatch(uiActions.openAddProductModal());
  },
  closeAddProductModal: () => {
    store.dispatch(uiActions.closeAddProductModal());
  },
};

export const useUiStore = createSliceFacadeHook(selectUiState, uiBoundActions);
