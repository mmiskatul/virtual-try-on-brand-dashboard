'use client';

import React from 'react';
import { DollarSign, Sparkles, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-react';
import { Product, Order, BrandProfile } from '../../types';

interface OverviewProps {
  brand: BrandProfile;
  products: Product[];
  orders: Order[];
  onNavigateTab: (tab: any) => void;
}

export function OverviewModule({ brand, products, orders, onNavigateTab }: OverviewProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-black text-gray-900 mt-2">$2,840.00</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-600 font-semibold gap-1">
            <span>+18.4%</span>
            <span className="text-gray-500 font-normal">vs last month</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">Try-On Conversion Rate</p>
              <p className="text-2xl font-black text-gray-900 mt-2">32.8%</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-100 text-black border border-gray-300">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-black font-semibold gap-1">
            <span>3.2x higher</span>
            <span className="text-gray-500 font-normal">than non-tryon items</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">Published Garments</p>
              <p className="text-2xl font-black text-gray-900 mt-2">{products.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-100 text-black border border-gray-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <span className="text-gray-900 font-medium">{products.filter(p => p.marketplacePublished).length}</span> synced to Marketplace
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500">AI Try-On Sessions</p>
              <p className="text-2xl font-black text-gray-900 mt-2">{brand.quotaUsed}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-100 text-black border border-gray-300">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Quota remaining: <span className="text-gray-900 font-semibold">{brand.quotaMax - brand.quotaUsed}</span>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Alert */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-800">Low Stock Alert: Aura Tailored Pleat Trousers (3 remaining)</h4>
            <p className="text-xs text-amber-700/80">Inventory levels have fallen below safety threshold (5 units). Restock recommended to prevent overselling.</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('inventory')}
          className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-400 transition-colors"
        >
          Manage Stock
        </button>
      </div>

      {/* Recent Orders Overview */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-gray-900">Recent Seller Orders</h3>
          <button onClick={() => onNavigateTab('orders')} className="text-xs font-semibold text-black hover:text-gray-700">
            View All Orders →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-500 border-b border-gray-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-100/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-black">{o.id}</td>
                  <td className="py-3 px-4 text-gray-900">{o.customerName}</td>
                  <td className="py-3 px-4">{o.itemCount} item(s)</td>
                  <td className="py-3 px-4 font-bold text-gray-900">${o.total}</td>
                  <td className="py-3 px-4 text-gray-500">{o.date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      o.status === 'CONFIRMED' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                      o.status === 'SHIPPED' ? 'bg-gray-100 text-black border border-gray-300' :
                      'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
