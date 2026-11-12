import { Order } from '../types';
import { store } from '../store';
import { createSliceFacadeHook } from '../store/hooks';
import { selectOrderState } from '../store/selectors';
import { orderActions } from '../store/slices/legacyBrandSlices';

const orderBoundActions = {
  setOrders: (orders: Order[]) => {
    store.dispatch(orderActions.setOrders(orders));
  },
  updateOrderStatus: (payload: {
    orderId: string;
    status: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';
  }) => {
    store.dispatch(orderActions.updateOrderStatus(payload));
  },
};

export const useOrderStore = createSliceFacadeHook(selectOrderState, orderBoundActions);
