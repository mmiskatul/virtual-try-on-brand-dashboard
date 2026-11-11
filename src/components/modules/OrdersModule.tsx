'use client';

import React from 'react';
import { Order } from '../../types';

interface OrdersProps {
  orders: Order[];
  onUpdateStatus: (id: string, nextStatus: 'SHIPPED' | 'DELIVERED') => void;
}

export function OrdersModule({ orders, onUpdateStatus }: OrdersProps) {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-base text-gray-900">Tenant-Scoped Orders ({orders.length})</h3>

        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="p-4 rounded-xl bg-white border border-gray-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-black">{order.id}</span>
                  <span className="text-xs text-gray-500">• {order.date}</span>
                </div>
                <p className="text-xs text-gray-900 mt-1">Customer: <span className="font-semibold">{order.customerName}</span> ({order.customerEmail})</p>
                <p className="text-xs text-gray-500">Total: <span className="text-gray-900 font-bold">${order.total}</span> ({order.itemCount} item)</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.status === 'CONFIRMED' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                  order.status === 'SHIPPED' ? 'bg-gray-100 text-black border border-gray-300' :
                  'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                }`}>
                  {order.status}
                </span>

                {order.status === 'CONFIRMED' && (
                  <button
                    onClick={() => onUpdateStatus(order.id, 'SHIPPED')}
                    className="px-3 py-1.5 rounded-lg bg-black text-white font-bold text-xs hover:bg-gray-800"
                  >
                    Mark Shipped
                  </button>
                )}
                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-400"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
