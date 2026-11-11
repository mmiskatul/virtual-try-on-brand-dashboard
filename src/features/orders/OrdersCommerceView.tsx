'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  Mail,
  Package,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services/brandService';
import { useMounted } from '../../hooks/useMounted';
import { Order, OrderStatus, ReturnRequest } from '../../types';
import {
  ConfirmDialog,
  EmptyState,
  KpiCard,
  PageHeader,
  PermissionGate,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { canPerform } from '../../config/permissions';

export type OrdersTab = 'orders' | 'abandoned' | 'returns' | 'refunds';

const ORDER_TABS: Array<{ id: OrdersTab; label: string; href: string }> = [
  { id: 'orders', label: 'Orders', href: '/dashboard/orders' },
  { id: 'abandoned', label: 'Abandoned Carts', href: '/dashboard/orders/abandoned' },
  { id: 'returns', label: 'Returns', href: '/dashboard/orders/returns' },
  { id: 'refunds', label: 'Refunds & Ledger', href: '/dashboard/orders/refunds' },
];

const BACKEND_COMPATIBLE_STATUSES = new Set([
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

function exportCsvFile(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function OrdersCommerceView({
  initialTab = 'orders',
  orderId,
}: {
  initialTab?: OrdersTab;
  orderId?: string;
}) {
  const mounted = useMounted();
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const orders = useWorkspaceStore((s) => s.orders);
  const returns = useWorkspaceStore((s) => s.returns);
  const abandonedCarts = useWorkspaceStore((s) => s.abandonedCarts);
  const updateOrder = useWorkspaceStore((s) => s.updateOrder);
  const updateReturnStatus = useWorkspaceStore((s) => s.updateReturnStatus);
  const markAbandonedRecovered = useWorkspaceStore((s) => s.markAbandonedRecovered);
  const recordAudit = useWorkspaceStore((s) => s.recordAudit);
  const showToast = useUiStore((s) => s.showToast);

  const [tab, setTab] = useState<OrdersTab>(initialTab);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onRun: () => void;
  } | null>(null);
  const [trackingDraft, setTrackingDraft] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const canEditOrders = canPerform(activeRole, 'orders', 'edit', roleOverrides);
  const canExportOrders = canPerform(activeRole, 'orders', 'export', roleOverrides);

  const safeOrders = mounted ? orders : [];
  const safeReturns = mounted ? returns : [];
  const safeAbandoned = mounted ? abandonedCarts : [];

  const handleStatusUpdate = async (order: Order, nextStatus: Order['status']) => {
    setSavingId(order.id);
    try {
      if (isLiveBackend && BACKEND_COMPATIBLE_STATUSES.has(nextStatus)) {
        await brandWorkspaceApi.updateOrderStatus(order.id, nextStatus);
      }
      const nextTimeline = [
        ...(order.timeline || []),
        { label: `Status updated to ${nextStatus}`, at: new Date().toLocaleString() },
      ];
      updateOrder(order.id, {
        status: nextStatus,
        paymentStatus: nextStatus === 'REFUNDED' ? 'REFUNDED' : order.paymentStatus,
        timeline: nextTimeline,
      });
      showToast(`Order ${order.id} updated to ${nextStatus}.`);
    } catch (err: any) {
      // Keep error honest when backend rejects or is unreachable
      showToast(err?.message || `Failed to update order ${order.id} on backend.`);
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveTracking = (order: Order) => {
    if (!trackingDraft.trim()) return;
    const nextTimeline = [
      ...(order.timeline || []),
      { label: `Tracking assigned: ${trackingDraft.trim()}`, at: new Date().toLocaleString() },
    ];
    updateOrder(order.id, { trackingNumber: trackingDraft.trim(), timeline: nextTimeline });
    recordAudit('ORDER_TRACKING_UPDATED', order.id, `Tracking set to ${trackingDraft.trim()}`);
    showToast(`Saved tracking number ${trackingDraft.trim()}.`);
    setTrackingDraft('');
  };

  // Single Order Detail Page Mode (/dashboard/orders/[id])
  if (orderId) {
    const order = safeOrders.find((o) => o.id === orderId);
    return (
      <PermissionGate module="orders" action="view">
        <div className="space-y-6">
          <PageHeader
            eyebrow="Commerce & Fulfillment"
            title={order ? `Order ${order.id}` : `Order ${orderId}`}
            subtitle="Inspect customer shipping details, garment variants, payment settlement, and dispatch timeline."
            actions={
              <>
                <Link href="/dashboard/orders">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
                  </Button>
                </Link>
                {order && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Packing Slip
                  </Button>
                )}
              </>
            }
          />

          {!order ? (
            <EmptyState
              title="Order not found in tenant workspace"
              description="This order ID does not belong to your active brand tenant or has not been synced yet."
              actionLabel="Return to Orders"
              onAction={() => (window.location.href = '/dashboard/orders')}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <SectionCard
                  title="Order Line Items"
                  subtitle={`Placed on ${order.date} • ${order.itemCount} unit(s)`}
                  right={<StatusBadge status={order.status} />}
                >
                  <div className="divide-y divide-slate-100">
                    {(order.items || []).length > 0 ? (
                      order.items!.map((item, idx) => (
                        <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{item.productName}</p>
                            <p className="text-slate-500">
                              SKU: <code>{item.variantSku}</code> • Size: {item.size} • Color: {item.color}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">${item.lineTotal.toFixed(2)}</p>
                            <p className="text-slate-500">
                              {item.quantity} x ${item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-xs text-slate-500">
                        Line item breakdown unavailable on summary record ({order.itemCount} unit(s), total ${order.total.toFixed(2)}).
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs max-w-xs ml-auto">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>${(order.subtotal ?? order.total).toFixed(2)}</span>
                    </div>
                    {order.discount ? (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount</span>
                        <span>-${order.discount.toFixed(2)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping ({order.shippingMethod || 'Standard'})</span>
                      <span>${(order.shippingFee ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-sm text-slate-950 pt-2 border-t border-slate-200">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Fulfillment Timeline" subtitle="Audit history of order state transitions">
                  <div className="space-y-3">
                    {(order.timeline || [{ label: 'Order created', at: order.date }]).map((ev, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-slate-900 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900">{ev.label}</p>
                          <p className="text-slate-400">{ev.at}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <SectionCard title="Customer & Shipping" subtitle="Verified buyer contact details">
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-slate-900">{order.customerName}</p>
                    <p className="text-slate-600">{order.customerEmail}</p>
                    {order.customerPhone && <p className="text-slate-600">{order.customerPhone}</p>}
                    {order.shippingAddress && (
                      <div className="pt-2 border-t border-slate-100 text-slate-600 space-y-0.5">
                        <p>{order.shippingAddress.street}</p>
                        <p>
                          {order.shippingAddress.city} {order.shippingAddress.postalCode}
                        </p>
                        <p>{order.shippingAddress.country}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-slate-500">Payment</span>
                      <StatusBadge status={order.paymentStatus || 'PAID'} />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Fulfillment Controls" subtitle="Update dispatch state & courier tracking">
                  <div className="space-y-3 text-xs">
                    <label className="block space-y-1">
                      <span className="font-semibold text-slate-700">Order Status</span>
                      <select
                        disabled={!canEditOrders || savingId === order.id}
                        value={order.status}
                        onChange={(e) => {
                          const val = e.target.value as Order['status'];
                          if (val === 'CANCELLED' || val === 'REFUNDED') {
                            setConfirmAction({
                              title: `${val === 'CANCELLED' ? 'Cancel' : 'Refund'} Order ${order.id}?`,
                              description: `Changing this order to ${val} updates financial metrics and customer order history.`,
                              confirmLabel: `Mark as ${val}`,
                              onRun: () => {
                                handleStatusUpdate(order, val);
                                setConfirmAction(null);
                              },
                            });
                          } else {
                            handleStatusUpdate(order, val);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold bg-white"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        {!isLiveBackend && <option value="REFUNDED">Refunded (Demo Ledger)</option>}
                      </select>
                    </label>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="font-semibold text-slate-700 block">Tracking Number</span>
                      {order.trackingNumber && (
                        <p className="text-[11px] text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded-lg">
                          Active: {order.trackingNumber}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          disabled={!canEditOrders}
                          value={trackingDraft}
                          onChange={(e) => setTrackingDraft(e.target.value)}
                          placeholder="e.g. PATHAO-88412"
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                        />
                        <Button
                          size="sm"
                          disabled={!canEditOrders || !trackingDraft.trim()}
                          onClick={() => handleSaveTracking(order)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          <ConfirmDialog
            open={Boolean(confirmAction)}
            title={confirmAction?.title || ''}
            description={confirmAction?.description || ''}
            confirmLabel={confirmAction?.confirmLabel}
            onConfirm={() => confirmAction?.onRun()}
            onCancel={() => setConfirmAction(null)}
          />
        </div>
      </PermissionGate>
    );
  }

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return safeOrders.filter((o) => {
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [safeOrders, search, statusFilter]);

  const paidRevenue = safeOrders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingCount = safeOrders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PROCESSING'
  ).length;
  const refundedTotal =
    safeOrders
      .filter((o) => o.status === 'REFUNDED')
      .reduce((s, o) => s + o.total, 0) +
    safeReturns
      .filter((r) => r.status === 'REFUNDED')
      .reduce((s, r) => s + r.amount, 0);

  return (
    <PermissionGate module="orders" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Commerce & Orders"
          title="Orders, Fulfillment & Returns"
          subtitle="Manage tenant customer orders, track courier dispatches, process return approvals, and audit refunds."
          actions={
            canExportOrders ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  exportCsvFile(
                    `orders-export-${new Date().toISOString().slice(0, 10)}.csv`,
                    ['Order ID', 'Customer', 'Email', 'Date', 'Items', 'Total', 'Payment', 'Status'],
                    filteredOrders.map((o) => [
                      o.id,
                      o.customerName,
                      o.customerEmail,
                      o.date,
                      o.itemCount,
                      o.total.toFixed(2),
                      o.paymentStatus || 'PAID',
                      o.status,
                    ])
                  );
                  showToast(`Exported ${filteredOrders.length} orders to CSV.`);
                }}
              >
                <Download className="w-3.5 h-3.5" /> Export Orders CSV
              </Button>
            ) : undefined
          }
        />

        {/* Sub-navigation pills */}
        <div className="flex flex-wrap gap-2">
          {ORDER_TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                tab === t.id
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
              {t.id === 'returns' && safeReturns.filter((r) => r.status === 'PENDING').length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px]">
                  {safeReturns.filter((r) => r.status === 'PENDING').length}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Net Merchandise Revenue" value={`$${paidRevenue.toLocaleString()}`} icon={<Package className="w-4 h-4" />} />
          <KpiCard label="Total Orders" value={safeOrders.length} icon={<ShoppingCart className="w-4 h-4" />} />
          <KpiCard label="Pending / Processing" value={pendingCount} icon={<Truck className="w-4 h-4" />} />
          <KpiCard label="Refunded Value" value={`$${refundedTotal.toFixed(2)}`} icon={<RotateCcw className="w-4 h-4" />} />
        </div>

        {tab === 'orders' && (
          <SectionCard
            title="Tenant Order Directory"
            subtitle="Only orders containing garments owned by this brand tenant appear here."
            right={
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order ID, name, email..."
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs"
                />
              </div>
            }
          >
            <div className="flex flex-wrap gap-1.5 pb-2">
              {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>

            {filteredOrders.length === 0 ? (
              <EmptyState
                title="No matching orders"
                description="Try clearing search filters or check again once shoppers complete checkout."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 pr-4">Order ID</th>
                      <th className="py-2.5 pr-4">Customer</th>
                      <th className="py-2.5 pr-4">Date</th>
                      <th className="py-2.5 pr-4">Units</th>
                      <th className="py-2.5 pr-4">Total</th>
                      <th className="py-2.5 pr-4">Payment</th>
                      <th className="py-2.5 pr-4">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70">
                        <td className="py-3 pr-4 font-bold text-slate-900">
                          <Link href={`/dashboard/orders/${encodeURIComponent(o.id)}`} className="hover:underline">
                            {o.id}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-900">{o.customerName}</p>
                          <p className="text-[11px] text-slate-500">{o.customerEmail}</p>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">{o.date}</td>
                        <td className="py-3 pr-4 text-slate-600">{o.itemCount}</td>
                        <td className="py-3 pr-4 font-bold text-slate-900">${o.total.toFixed(2)}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={o.paymentStatus || 'PAID'} />
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <select
                              disabled={!canEditOrders || savingId === o.id}
                              value={o.status}
                              onChange={(e) => {
                                const val = e.target.value as Order['status'];
                                if (val === 'CANCELLED' || val === 'REFUNDED') {
                                  setConfirmAction({
                                    title: `${val === 'CANCELLED' ? 'Cancel' : 'Refund'} ${o.id}?`,
                                    description: `This action will mark order ${o.id} ($${o.total.toFixed(2)}) as ${val}.`,
                                    confirmLabel: `Confirm ${val}`,
                                    onRun: () => {
                                      handleStatusUpdate(o, val);
                                      setConfirmAction(null);
                                    },
                                  });
                                } else {
                                  handleStatusUpdate(o, val);
                                }
                              }}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold bg-white"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                              {!isLiveBackend && <option value="REFUNDED">REFUNDED</option>}
                            </select>
                            <Link href={`/dashboard/orders/${encodeURIComponent(o.id)}`}>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                Details
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        {tab === 'abandoned' && (
          <SectionCard
            title="Abandoned Storefront Checkouts"
            subtitle="Track shoppers who added tenant items without completing payment."
          >
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <p>
                <strong>SMTP / Email Provider Notice:</strong> Automated cart-recovery email dispatch requires connecting an authorized email provider under{' '}
                <Link href="/dashboard/integrations" className="underline font-bold">
                  Integrations
                </Link>
                . Marking an entry below records a manual outreach flag locally without claiming an automated email was transmitted.
              </p>
            </div>

            {safeAbandoned.length === 0 ? (
              <EmptyState title="No abandoned checkouts" description="Checkouts left incomplete will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 pr-4">Customer</th>
                      <th className="py-2.5 pr-4">Items</th>
                      <th className="py-2.5 pr-4">Cart Value</th>
                      <th className="py-2.5 pr-4">Last Active</th>
                      <th className="py-2.5 pr-4">Outreach Status</th>
                      <th className="py-2.5 text-right">Follow-Up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {safeAbandoned.map((c) => (
                      <tr key={c.id}>
                        <td className="py-3 pr-4">
                          <p className="font-bold text-slate-900">{c.customerName}</p>
                          <p className="text-[11px] text-slate-500">{c.customerEmail}</p>
                        </td>
                        <td className="py-3 pr-4">{c.itemCount} unit(s)</td>
                        <td className="py-3 pr-4 font-bold text-slate-900">${c.value.toFixed(2)}</td>
                        <td className="py-3 pr-4 text-slate-500">{c.lastActiveAt}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={c.recoverySent ? 'COMPLETED' : 'PENDING'} />
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={c.recoverySent || !canEditOrders}
                            onClick={() => {
                              markAbandonedRecovered(c.id);
                              recordAudit('ABANDONED_CART_LOGGED', c.customerEmail, 'Logged manual follow-up');
                              showToast(`Recorded manual follow-up for ${c.customerName}.`);
                            }}
                            className="gap-1.5 text-xs"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {c.recoverySent ? 'Logged' : 'Log Follow-Up'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        {tab === 'returns' && (
          <SectionCard
            title="Customer Return Requests"
            subtitle="Review garment fit issues, authorize returns, or reject ineligible items."
          >
            {safeReturns.length === 0 ? (
              <EmptyState title="No return requests" description="Active RMA and return requests will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 pr-4">RMA ID</th>
                      <th className="py-2.5 pr-4">Order</th>
                      <th className="py-2.5 pr-4">Customer</th>
                      <th className="py-2.5 pr-4">Product & Reason</th>
                      <th className="py-2.5 pr-4">Amount</th>
                      <th className="py-2.5 pr-4">Status</th>
                      <th className="py-2.5 text-right">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {safeReturns.map((r) => (
                      <tr key={r.id}>
                        <td className="py-3 pr-4 font-bold text-slate-900">{r.id}</td>
                        <td className="py-3 pr-4">
                          <Link href={`/dashboard/orders/${encodeURIComponent(r.orderId)}`} className="underline">
                            {r.orderId}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">{r.customerName}</td>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-900">{r.productName}</p>
                          <p className="text-[11px] text-slate-500">{r.reason}</p>
                        </td>
                        <td className="py-3 pr-4 font-bold">${r.amount.toFixed(2)}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex gap-1.5">
                            {(['APPROVED', 'REJECTED', 'REFUNDED'] as ReturnRequest['status'][]).map((st) => (
                              <Button
                                key={st}
                                size="sm"
                                variant={st === 'REJECTED' ? 'outline' : 'secondary'}
                                disabled={!canEditOrders || r.status === st}
                                onClick={() =>
                                  setConfirmAction({
                                    title: `Mark return ${r.id} as ${st}?`,
                                    description: `Customer ${r.customerName} ($${r.amount.toFixed(2)}) for ${r.productName}.`,
                                    confirmLabel: st,
                                    onRun: () => {
                                      updateReturnStatus(r.id, st);
                                      recordAudit('RETURN_UPDATED', r.id, `Changed return state to ${st}`);
                                      showToast(`Return ${r.id} marked ${st}.`);
                                      setConfirmAction(null);
                                    },
                                  })
                                }
                                className="h-7 px-2 text-[11px]"
                              >
                                {st}
                              </Button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        {tab === 'refunds' && (
          <SectionCard
            title="Refunds & Financial Adjustments Ledger"
            subtitle="Settled refunds across cancelled orders and approved RMAs."
          >
            {safeOrders.filter((o) => o.status === 'REFUNDED' || o.paymentStatus === 'REFUNDED').length === 0 &&
            safeReturns.filter((r) => r.status === 'REFUNDED').length === 0 ? (
              <EmptyState
                title="No settled refunds recorded"
                description="When you refund an order or approve a return refund, the settlement entry appears here."
              />
            ) : (
              <div className="space-y-2 text-xs">
                {safeOrders
                  .filter((o) => o.status === 'REFUNDED' || o.paymentStatus === 'REFUNDED')
                  .map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          Order {o.id} — {o.customerName}
                        </p>
                        <p className="text-slate-500">Full Order Refund • {o.date}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-extrabold text-rose-700">-${o.total.toFixed(2)}</p>
                        <StatusBadge status="REFUNDED" />
                      </div>
                    </div>
                  ))}
                {safeReturns
                  .filter((r) => r.status === 'REFUNDED')
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          RMA {r.id} ({r.orderId}) — {r.customerName}
                        </p>
                        <p className="text-slate-500">
                          {r.productName} • {r.reason}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-extrabold text-rose-700">-${r.amount.toFixed(2)}</p>
                        <StatusBadge status="REFUNDED" />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </SectionCard>
        )}

        <ConfirmDialog
          open={Boolean(confirmAction)}
          title={confirmAction?.title || ''}
          description={confirmAction?.description || ''}
          confirmLabel={confirmAction?.confirmLabel}
          onConfirm={() => confirmAction?.onRun()}
          onCancel={() => setConfirmAction(null)}
        />
      </div>
    </PermissionGate>
  );
}

