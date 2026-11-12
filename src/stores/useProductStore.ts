import { Product } from '../types';
import { store } from '../store';
import { createSliceFacadeHook } from '../store/hooks';
import { selectProductState } from '../store/selectors';
import { productActions } from '../store/slices/legacyBrandSlices';

const productBoundActions = {
  setProducts: (products: Product[]) => {
    store.dispatch(productActions.setProducts(products));
  },
  addProduct: (product: Product) => {
    store.dispatch(productActions.addProduct(product));
  },
  deleteProduct: (id: string) => {
    store.dispatch(productActions.deleteProduct(id));
  },
  togglePublication: (payload: {
    id: string;
    channel: 'brandStorefrontPublished' | 'marketplacePublished';
  }) => {
    store.dispatch(productActions.togglePublication(payload));
  },
  updateStock: (payload: { id: string; delta: number }) => {
    store.dispatch(productActions.updateStock(payload));
  },
  setSelectedCategory: (category: string) => {
    store.dispatch(productActions.setSelectedCategory(category));
  },
  setSearchQuery: (query: string) => {
    store.dispatch(productActions.setSearchQuery(query));
  },
};

export const useProductStore = createSliceFacadeHook(selectProductState, productBoundActions);
