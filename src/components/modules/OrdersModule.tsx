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
        <h3 className="font-bold text-base text-white">Tenant-Scoped Orders ({orders.length})</h3>

        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-400">{order.id}</span>
                  <span className="text-xs text-slate-400">• {order.date}</span>
                </div>
                <p className="text-xs text-white mt-1">Customer: <span className="font-semibold">{order.customerName}</span> ({order.customerEmail})</p>
                <p className="text-xs text-slate-400">Total: <span className="text-white font-bold">${order.total}</span> ({order.itemCount} item)</p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.status === 'CONFIRMED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  order.status === 'SHIPPED' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {order.status}
                </span>

                {order.status === 'CONFIRMED' && (
                  <button
                    onClick={() => onUpdateStatus(order.id, 'SHIPPED')}
                    className="px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400"
                  >
                    Mark Shipped
                  </button>
                )}
                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
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
