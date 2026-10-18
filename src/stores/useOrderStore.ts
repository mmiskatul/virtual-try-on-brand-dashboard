import { create } from 'zustand';
import { Order } from '../types';
import { initialOrders } from '../lib/mock_data';

interface OrderState {
  items: Order[];
  setOrders: (orders: Order[]) => void;
  updateOrderStatus: (payload: { orderId: string; status: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' }) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  items: initialOrders,
  setOrders: (items) => set({ items }),
  updateOrderStatus: ({ orderId, status }) =>
    set((state) => ({
      items: state.items.map((o) =>
        o.id === orderId ? { ...o, status } : o
      )
    }))
}));
