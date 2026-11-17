'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { brandWorkspaceApi, type BrandDiscount, type DiscountInput } from '../../services/brandService';
import { useUiStore } from '../../stores/useUiStore';
import { ConfirmDialog, ErrorBanner, PageHeader, PermissionGate, SectionCard } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

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

const describeValue = (d: BrandDiscount) => (d.type === 'PERCENT' ? `${d.value}% off` : `৳${d.value.toLocaleString()} off`);

const EMPTY = { code: '', type: 'PERCENT' as 'PERCENT' | 'FIXED', value: '', minOrder: '', maxUses: '', startsAt: '', endsAt: '', description: '' };

export function DiscountsView() {
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);
  const notify = (m: string) => {
    showToast(m);
    setTimeout(hideToast, 3500);
  };

  const [discounts, setDiscounts] = useState<BrandDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<BrandDiscount | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDiscounts(await brandWorkspaceApi.getDiscounts());
    } catch (e: any) {
      setError(e?.message || 'Could not load your discounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (err: any) {
      setFormError(err?.issues?.[0]?.message || err?.message || 'Could not create the discount.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (d: BrandDiscount) => {
    try {
      await brandWorkspaceApi.updateDiscount(d.id, { active: !d.active });
      await load();
    } catch (e: any) {
      notify(e?.message || 'Could not update that code.');
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
    } catch (e: any) {
      notify(e?.message || 'Could not delete that code.');
    }
  };

  return (
    <PermissionGate module="marketing" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Marketing"
          title="Discounts"
          subtitle="Create codes that shoppers type in at checkout. A code takes money off the items, never the delivery fee."
          actions={
            <Button type="button" size="sm" className="h-10 gap-1.5" onClick={() => setShowForm((v) => !v)}>
              <Plus className="w-4 h-4" /> {showForm ? 'Close' : 'New discount'}
            </Button>
          }
        />

        {showForm && (
          <SectionCard title="New discount">
            <form onSubmit={submit} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold text-slate-700">Code shoppers type</span>
                  <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="WELCOME10" maxLength={24} className={`${INPUT} font-mono`} />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold text-slate-700">What it gives</span>
                  <select value={form.type} onChange={(e) => set('type', e.target.value)} className={INPUT}>
                    <option value="PERCENT">Percentage off</option>
                    <option value="FIXED">Fixed amount off (৳)</option>
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold text-slate-700">{form.type === 'PERCENT' ? 'Percentage' : 'Amount (৳)'}</span>
                  <input type="number" min={1} step="any" value={form.value} onChange={(e) => set('value', e.target.value)} className={INPUT} />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold text-slate-700">Minimum order (৳, optional)</span>
                  <input type="number" min={0} value={form.minOrder} onChange={(e) => set('minOrder', e.target.value)} className={INPUT} />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold text-slate-700">Total times it can be used (optional)</span>
                  <input type="number" min={1} value={form.maxUses} onChange={(e) => set('maxUses', e.target.value)} placeholder="No limit" className={INPUT} />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold text-slate-700">Note for yourself (optional)</span>
                  <input value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={120} className={INPUT} />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold text-slate-700">Starts on (optional)</span>
                  <input type="date" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} className={INPUT} />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold text-slate-700">Ends on (optional)</span>
                  <input type="date" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} className={INPUT} />
                </label>
              </div>
              {formError && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
                  {formError}
                </p>
              )}
              <Button type="submit" disabled={saving} className="h-10">
                {saving ? 'Creating...' : 'Create discount'}
              </Button>
            </form>
          </SectionCard>
        )}

        {error && <ErrorBanner message={error} onRetry={() => void load()} />}

        <SectionCard title="Your discount codes">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading...</p>
          ) : discounts.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No discount codes yet. Create your first one to bring shoppers back.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-2 font-semibold">Code</th>
                    <th className="py-2.5 px-2 font-semibold">Gives</th>
                    <th className="py-2.5 px-2 font-semibold">Used</th>
                    <th className="py-2.5 px-2 font-semibold">Status</th>
                    <th className="py-2.5 px-2 font-semibold text-right">On / off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {discounts.map((d) => {
                    const st = statusOf(d);
                    return (
                      <tr key={d.id}>
                        <td className="py-3 px-2">
                          <span className="font-mono font-bold text-slate-950">{d.code}</span>
                          <span className="block text-xs text-slate-500">
                            {[d.minOrder > 0 ? `Min ৳${d.minOrder.toLocaleString()}` : '', d.endsAt ? `Ends ${new Date(d.endsAt).toLocaleDateString()}` : '', d.description || ''].filter(Boolean).join(' · ')}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-semibold">{describeValue(d)}</td>
                        <td className="py-3 px-2 tabular-nums">{d.usedCount}{d.maxUses !== null ? ` / ${d.maxUses}` : ''}</td>
                        <td className="py-3 px-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${STATUS_STYLE[st]}`}>{st}</span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="checkbox"
                              role="switch"
                              aria-label={`${d.code} is ${d.active ? 'on' : 'off'}`}
                              checked={d.active}
                              onChange={() => void toggle(d)}
                              className="h-4 w-4 accent-slate-950"
                            />
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
