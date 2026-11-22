'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Printer } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useMounted } from '../../hooks/useMounted';
import {
  ConfirmDialog,
  EmptyState,
  PageHeader,
  PermissionGate,
  SafeImage,
  SectionCard,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { canPerform } from '../../config/permissions';
import { GROUP_LABEL, GROUP_STYLE, ORDER_STEPS, canCancel, groupOf, money, nextStep, useOrderActions } from './orderHelpers';

export function OrderDetailView({ orderId }: { orderId: string }) {
  const mounted = useMounted();
  const orders = useWorkspaceStore((s) => s.orders);
  const profile = useWorkspaceStore((s) => s.profile);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const canEdit = canPerform(activeRole, 'orders', 'edit', roleOverrides);
  const { setStatus, saveTracking, savingId } = useOrderActions();

  const [tracking, setTracking] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const order = mounted ? orders.find((o) => o.id === orderId) : undefined;
  const backButton = (
    <Link href="/dashboard/orders">
      <Button variant="outline" size="sm" className="gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to orders
      </Button>
    </Link>
  );

  if (!mounted) {
    return (
      <PermissionGate module="orders" action="view">
        <div className="space-y-4" aria-busy="true" aria-label="Loading order">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </PermissionGate>
    );
  }

  if (!order) {
    return (
      <PermissionGate module="orders" action="view">
        <div className="space-y-6">
          <PageHeader eyebrow="Orders" title={`Order ${orderId}`} actions={backButton} />
          <EmptyState
            title="We could not find this order"
            description="It may not be in your shop, or it has not loaded yet. Go back to Orders and try again."
          />
        </div>
      </PermissionGate>
    );
  }

  const group = groupOf(order.status);
  const step = nextStep(order.status);
  const stopped = group === 'CANCELLED' || group === 'REFUNDED';
  const currentIndex = stopped ? -1 : ORDER_STEPS.findIndex((s) => s.key === group);
  const items = order.items || [];

  return (
    <PermissionGate module="orders" action="view">
      <style>{`@media print { body * { visibility: hidden !important; } #packing-slip, #packing-slip * { visibility: visible !important; } #packing-slip { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; } }`}</style>

      <div className="space-y-6">
        <PageHeader
          eyebrow="Orders"
          title={`Order ${order.id}`}
          subtitle={`Placed on ${order.date}`}
          actions={
            <>
              {backButton}
              <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print packing slip
              </Button>
            </>
          }
        />

        {/* Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          {stopped ? (
            <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${GROUP_STYLE[group]}`}>This order is {GROUP_LABEL[group].toLowerCase()}</p>
          ) : (
            <ol className="flex items-center" aria-label="Order progress">
              {ORDER_STEPS.map((s, i) => {
                const done = i <= currentIndex;
                return (
                  <li key={s.key} className={`flex items-center ${i < ORDER_STEPS.length - 1 ? 'flex-1' : ''}`}>
                    <div className="flex flex-col items-center gap-1">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {i < currentIndex || (i === currentIndex && group === 'DELIVERED') ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                      <span className={`text-[11px] font-bold ${done ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                    </div>
                    {i < ORDER_STEPS.length - 1 && <span className={`mx-2 mb-4 h-0.5 flex-1 ${i < currentIndex ? 'bg-slate-950' : 'bg-slate-200'}`} />}
                  </li>
                );
              })}
            </ol>
          )}

          {canEdit && (step || canCancel(order.status)) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              {step && (
                <Button size="sm" disabled={savingId === order.id} onClick={() => void setStatus(order, step.to)}>
                  {savingId === order.id ? 'Saving…' : step.label}
                </Button>
              )}
              {canCancel(order.status) && (
                <Button size="sm" variant="outline" disabled={savingId === order.id} onClick={() => setConfirmCancel(true)}>
                  Cancel order
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <SectionCard title="Items" subtitle={`${order.itemCount} item${order.itemCount === 1 ? '' : 's'}`}>
              <div className="divide-y divide-slate-100">
                {items.length > 0 ? (
                  items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-3 text-xs">
                      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        <SafeImage src={item.imageUrl || ''} alt={item.productName} fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        <p className="text-slate-500">
                          Size {item.size} · {item.color} · <span className="font-mono">{item.variantSku}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{money(item.lineTotal)}</p>
                        <p className="text-slate-500">{item.quantity} × {money(item.unitPrice)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-xs text-slate-500">The item list is not available for this order. It has {order.itemCount} item(s), total {money(order.total)}.</p>
                )}
              </div>
              <div className="ml-auto mt-4 max-w-xs space-y-1.5 border-t border-slate-100 pt-4 text-xs">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{money(order.subtotal ?? order.total)}</span></div>
                {order.discount ? <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-{money(order.discount)}</span></div> : null}
                <div className="flex justify-between text-slate-600"><span>Delivery ({order.shippingMethod || 'Standard'})</span><span>{money(order.shippingFee ?? 0)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-slate-950"><span>Total</span><span>{money(order.total)}</span></div>
              </div>
            </SectionCard>

            <SectionCard title="History" subtitle="Every change made to this order">
              <div className="space-y-3">
                {(order.timeline && order.timeline.length > 0 ? order.timeline : [{ label: 'Order placed', at: order.date }]).map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-900" />
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
            <SectionCard title="Customer" subtitle="Who ordered and where to send it">
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-900">{order.customerName}</p>
                <p className="text-slate-600">{order.customerEmail}</p>
                {order.customerPhone && <p className="text-slate-600">{order.customerPhone}</p>}
                {order.shippingAddress && (
                  <div className="space-y-0.5 border-t border-slate-100 pt-2 text-slate-600">
                    <p>{order.shippingAddress.street}</p>
                    <p>{order.shippingAddress.city} {order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Payment</span>
                  <span className="font-bold text-slate-900">{(order.paymentStatus || 'PAID').toString().toLowerCase()}{order.paymentMethod ? ` · ${order.paymentMethod}` : ''}</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Tracking number" subtitle="Add it when you send the order out">
              <div className="space-y-2 text-xs">
                {order.trackingNumber && (
                  <p className="rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-[11px] text-emerald-800">{order.trackingNumber}</p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={tracking}
                    disabled={!canEdit}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="e.g. PATHAO-88412"
                    aria-label="Tracking number"
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs sm:flex-1"
                  />
                  <Button size="sm" disabled={!canEdit || !tracking.trim()} onClick={() => { saveTracking(order, tracking); setTracking(''); }}>
                    Save
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500">The tracking number is saved in this browser only for now.</p>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Printed packing slip (only this shows when printing) */}
        <div id="packing-slip" className="hidden print:block text-slate-900">
          <h1 className="text-xl font-extrabold">{profile.name}: Packing slip</h1>
          <p className="text-sm">Order {order.id} · {order.date}</p>
          <p className="mt-3 text-sm font-bold">Send to</p>
          <p className="text-sm">{order.customerName}{order.customerPhone ? ` · ${order.customerPhone}` : ''}</p>
          {order.shippingAddress && (
            <p className="text-sm">{order.shippingAddress.street}, {order.shippingAddress.city} {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
          )}
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-400 text-left"><th className="py-1">Item</th><th>Size</th><th>Colour</th><th className="text-right">Qty</th></tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-slate-200"><td className="py-1">{it.productName}</td><td>{it.size}</td><td>{it.color}</td><td className="text-right">{it.quantity}</td></tr>
              ))}
            </tbody>
          </table>
          {order.trackingNumber && <p className="mt-3 text-sm">Tracking: {order.trackingNumber}</p>}
        </div>

        <ConfirmDialog
          open={confirmCancel}
          title={`Cancel order ${order.id}?`}
          description="The order will be marked as cancelled. This will update your sales numbers and the customer's order history."
          confirmLabel="Cancel order"
          onCancel={() => setConfirmCancel(false)}
          onConfirm={() => {
            setConfirmCancel(false);
            void setStatus(order, 'CANCELLED');
          }}
        />
      </div>
    </PermissionGate>
  );
}
