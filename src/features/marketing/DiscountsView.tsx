'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Plus, Tag } from 'lucide-react';
import {
  brandWorkspaceApi,
  type BrandDiscount,
  type DiscountInput,
  type DiscountStatsResponse,
} from '../../services/brandService';
import { useUiStore } from '../../stores/useUiStore';
import { ConfirmDialog, ErrorBanner, PageHeader, PermissionGate, SectionCard } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { Drawer, Switch } from '../products/shared';

const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10';

type Status = 'Active' | 'Off' | 'Scheduled' | 'Expired' | 'Used up';

function statusOf(d: BrandDiscount, now = Date.now()): Status {
  if (!d.active) return 'Off';
  if (d.endsAt && now > d.endsAt) return 'Expired';
  if (d.startsAt && now < d.startsAt) return 'Scheduled';
  if (d.maxUses !== null && d.usedCount >= d.maxUses) return 'Used up';
  return 'Active';
}

const STATUS_STYLE: Record<Status, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Off: 'bg-slate-100 text-slate-600 border-slate-200',
  Scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
  Expired: 'bg-rose-50 text-rose-700 border-rose-200',
  'Used up': 'bg-amber-50 text-amber-800 border-amber-200',
};

const money = (n: number) => `৳${Math.round(n).toLocaleString()}`;
const describeValue = (d: BrandDiscount) => (d.type === 'PERCENT' ? `${d.value}% off` : `${money(d.value)} off`);

/** Quick starting points, so a new code takes seconds. */
const PRESETS: Array<{ label: string; type: 'PERCENT' | 'FIXED'; value: string; code: string }> = [
  { label: '10% off', type: 'PERCENT', value: '10', code: 'SAVE10' },
  { label: '20% off', type: 'PERCENT', value: '20', code: 'SAVE20' },
  { label: '৳200 off', type: 'FIXED', value: '200', code: 'TK200' },
  { label: '৳500 off', type: 'FIXED', value: '500', code: 'TK500' },
];

const EMPTY = { code: '', type: 'PERCENT' as 'PERCENT' | 'FIXED', value: '', minOrder: '', maxUses: '', startsAt: '', endsAt: '', description: '' };

export function DiscountsView() {
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);
  const notify = useCallback(
    (m: string) => {
      showToast(m);
      setTimeout(hideToast, 3500);
    },
    [showToast, hideToast]
  );

  const [discounts, setDiscounts] = useState<BrandDiscount[]>([]);
  const [stats, setStats] = useState<DiscountStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<BrandDiscount | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDiscounts(await brandWorkspaceApi.getDiscounts());
      // The numbers are a bonus: if they cannot load, the list still works.
      brandWorkspaceApi
        .getDiscountStats()
        .then(setStats)
        .catch(() => setStats(null));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load your discounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const statFor = useMemo(() => {
    const map = new Map((stats?.stats || []).map((s) => [s.id, s]));
    return (id: string) => map.get(id);
  }, [stats]);

  const activeCount = discounts.filter((d) => statusOf(d) === 'Active').length;

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const openDrawer = () => {
    setForm(EMPTY);
    setFormError(null);
    setDrawerOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const value = Number(form.value);
    if (!/^[A-Za-z0-9_-]{3,24}$/.test(form.code.trim())) return setFormError('The code needs 3 to 24 letters, numbers, dashes or underscores.');
    if (!Number.isFinite(value) || value <= 0) return setFormError('Enter how much the discount takes off.');
    if (form.type === 'PERCENT' && value > 100) return setFormError('A percentage cannot be more than 100.');
    const input: DiscountInput = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      description: form.description.trim() || undefined,
      minOrder: form.minOrder ? Number(form.minOrder) : 0,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt ? `${form.endsAt}T23:59:59` : null,
    };
    setSaving(true);
    try {
      await brandWorkspaceApi.createDiscount(input);
      notify(`Code ${input.code} created. Shoppers can use it at checkout.`);
      setDrawerOpen(false);
      await load();
    } catch (err: unknown) {
      const issues = (err as { issues?: Array<{ message?: string }> })?.issues;
      setFormError(issues?.[0]?.message || (err instanceof Error ? err.message : 'Could not create the discount.'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (d: BrandDiscount) => {
    // Show the change right away; put it back if the server says no.
    setDiscounts((list) => list.map((x) => (x.id === d.id ? { ...x, active: !d.active } : x)));
    try {
      await brandWorkspaceApi.updateDiscount(d.id, { active: !d.active });
    } catch (e: unknown) {
      setDiscounts((list) => list.map((x) => (x.id === d.id ? { ...x, active: d.active } : x)));
      notify(e instanceof Error ? e.message : 'Could not update that code.');
    }
  };

  const remove = async () => {
    const d = toDelete;
    setToDelete(null);
    if (!d) return;
    try {
      await brandWorkspaceApi.deleteDiscount(d.id);
      notify(`Deleted ${d.code}.`);
      await load();
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : 'Could not delete that code.');
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <PermissionGate module="marketing" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Marketing"
          title="Discounts"
          subtitle="Create codes that shoppers type in at checkout. A code takes money off the items, never the delivery fee."
          actions={
            <Button type="button" size="sm" className="h-10 gap-1.5" onClick={openDrawer}>
              <Plus className="w-4 h-4" /> New discount
            </Button>
          }
        />

        {error && <ErrorBanner message={error} onRetry={() => void load()} />}

        {discounts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Codes on now', value: String(activeCount), note: `of ${discounts.length} total` },
              { label: 'Orders with a code', value: stats ? String(stats.totals.orders) : '-', note: 'Since you started' },
              { label: 'Sales with a code', value: stats ? money(stats.totals.revenue) : '-', note: 'Money from those orders' },
              { label: 'Given away', value: stats ? money(stats.totals.discountGiven) : '-', note: 'Total discount' },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">{c.label}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{c.value}</p>
                <p className="mt-1 text-[11px] text-slate-500">{c.note}</p>
              </div>
            ))}
          </div>
        )}

        <SectionCard title="Your discount codes">
          {loading && discounts.length === 0 ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading discounts">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : discounts.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">No discount codes yet</p>
              <p className="mt-1">Create your first one to bring shoppers back.</p>
              <Button type="button" size="sm" className="mt-4 gap-1.5" onClick={openDrawer}>
                <Plus className="w-4 h-4" /> New discount
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="stack-table w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-2 font-semibold">Code</th>
                    <th className="py-2.5 px-2 font-semibold">Gives</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Orders</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Sales</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Given away</th>
                    <th className="py-2.5 px-2 font-semibold">Status</th>
                    <th className="py-2.5 px-2 font-semibold text-right">On / off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {discounts.map((d) => {
                    const st = statusOf(d);
                    const s = statFor(d.id);
                    return (
                      <tr key={d.id}>
                        <td data-label="" className="stack-full py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-950">{d.code}</span>
                            <button
                              type="button"
                              onClick={() => void copyCode(d.code)}
                              aria-label={`Copy code ${d.code}`}
                              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                            >
                              {copied === d.code ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <span className="block text-xs text-slate-500">
                            {[
                              d.minOrder > 0 ? `Min ${money(d.minOrder)}` : '',
                              d.maxUses !== null ? `Used ${d.usedCount} of ${d.maxUses}` : `Used ${d.usedCount} time${d.usedCount === 1 ? '' : 's'}`,
                              d.endsAt ? `Ends ${new Date(d.endsAt).toLocaleDateString()}` : '',
                              d.description || '',
                            ].filter(Boolean).join(' · ')}
                          </span>
                        </td>
                        <td data-label="Gives" className="py-3 px-2 font-semibold">{describeValue(d)}</td>
                        <td data-label="Orders" className="py-3 px-2 text-right tabular-nums">{s ? s.orders : '-'}</td>
                        <td data-label="Sales" className="py-3 px-2 text-right tabular-nums">{s ? money(s.revenue) : '-'}</td>
                        <td data-label="Given away" className="py-3 px-2 text-right tabular-nums">{s ? money(s.discountGiven) : '-'}</td>
                        <td data-label="Status" className="py-3 px-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${STATUS_STYLE[st]}`}>{st}</span>
                        </td>
                        <td data-label="On / off" className="py-3 px-2">
                          <div className="flex items-center justify-end gap-3">
                            <Switch label={`${d.code} is ${d.active ? 'on' : 'off'}`} checked={d.active} onChange={() => void toggle(d)} />
                            <Button type="button" size="sm" variant="outline" onClick={() => setToDelete(d)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <Drawer
          open={drawerOpen}
          title="New discount"
          subtitle="Pick a quick start, then change anything you like."
          onClose={() => setDrawerOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="discount-form" size="sm" disabled={saving}>
                {saving ? 'Creating…' : 'Create discount'}
              </Button>
            </div>
          }
        >
          <form id="discount-form" onSubmit={submit} className="space-y-4 text-sm">
            <div>
              <p className="mb-1.5 text-xs font-bold text-slate-700">Quick start</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: p.type, value: p.value, code: f.code || p.code }))}
                    className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-900"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="font-semibold text-slate-700">Code shoppers type</span>
              <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="WELCOME10" maxLength={24} className={`${INPUT} font-mono`} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="font-semibold text-slate-700">What it gives</span>
                <select value={form.type} onChange={(e) => set('type', e.target.value)} className={INPUT}>
                  <option value="PERCENT">Percentage off</option>
                  <option value="FIXED">Fixed amount off (৳)</option>
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="font-semibold text-slate-700">{form.type === 'PERCENT' ? 'Percentage' : 'Amount (৳)'}</span>
                <input type="number" min={1} step="any" value={form.value} onChange={(e) => set('value', e.target.value)} className={INPUT} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="font-semibold text-slate-700">Smallest order (৳)</span>
                <input type="number" min={0} value={form.minOrder} onChange={(e) => set('minOrder', e.target.value)} placeholder="Optional" className={INPUT} />
              </label>
              <label className="block space-y-1.5">
                <span className="font-semibold text-slate-700">Times it can be used</span>
                <input type="number" min={1} value={form.maxUses} onChange={(e) => set('maxUses', e.target.value)} placeholder="No limit" className={INPUT} />
              </label>
              <label className="block space-y-1.5">
                <span className="font-semibold text-slate-700">Starts on</span>
                <input type="date" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} className={INPUT} />
              </label>
              <label className="block space-y-1.5">
                <span className="font-semibold text-slate-700">Ends on</span>
                <input type="date" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} className={INPUT} />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="font-semibold text-slate-700">Note for yourself (optional)</span>
              <input value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={120} className={INPUT} />
            </label>

            {formError && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
                {formError}
              </p>
            )}
          </form>
        </Drawer>

        <ConfirmDialog
          open={Boolean(toDelete)}
          title={`Delete ${toDelete?.code}?`}
          description="Shoppers will no longer be able to use this code. Orders already placed are not affected."
          confirmLabel="Delete code"
          onConfirm={() => void remove()}
          onCancel={() => setToDelete(null)}
        />
      </div>
    </PermissionGate>
  );
}
