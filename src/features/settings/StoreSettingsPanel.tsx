'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { brandWorkspaceApi, type StoreSettings } from '../../services/brandService';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { canPerform } from '../../config/permissions';
import { ErrorBanner, SectionCard } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { Switch } from '../products/shared';

export type StoreSection = 'store' | 'delivery' | 'seo';

const INPUT = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50 disabled:text-slate-400';
const money = (n: number) => `৳${n.toLocaleString()}`;

/**
 * The store settings that really save on the server and change what shoppers see:
 * whether the store is open, delivery charges, and the text for Google and shared links.
 */
export function StoreSettingsPanel({ section }: { section: StoreSection }) {
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const profile = useWorkspaceStore((s) => s.profile);
  const showToast = useUiStore((s) => s.showToast);
  const canManage = canPerform(activeRole, 'settings', 'manage_settings', roleOverrides);

  const [saved, setSaved] = useState<StoreSettings | null>(null);
  const [draft, setDraft] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await brandWorkspaceApi.getStoreSettings();
      setSaved(s);
      setDraft(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load your settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading settings">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }
  if (error || !draft || !saved) {
    return <ErrorBanner message={error || 'Could not load your settings.'} onRetry={() => void load()} />;
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const setShipping = (p: Partial<StoreSettings['shipping']>) => setDraft({ ...draft, shipping: { ...draft.shipping, ...p } });
  const setSeo = (p: Partial<StoreSettings['seo']>) => setDraft({ ...draft, seo: { ...draft.seo, ...p } });

  const save = async () => {
    setFieldError(null);
    if (section === 'delivery') {
      if (!Number.isFinite(draft.shipping.defaultFee) || draft.shipping.defaultFee < 0) return setFieldError('The delivery fee cannot be negative.');
      if (draft.shipping.freeOver !== null && (!Number.isFinite(draft.shipping.freeOver) || draft.shipping.freeOver < 0)) return setFieldError('The free-delivery amount cannot be negative.');
    }
    setSaving(true);
    try {
      const patch = section === 'store' ? { open: draft.open } : section === 'delivery' ? { shipping: draft.shipping } : { seo: draft.seo };
      const next = await brandWorkspaceApi.saveStoreSettings(patch);
      setSaved(next);
      setDraft(next);
      showToast(section === 'store' ? (next.open ? 'Your store is open.' : 'Your store is closed.') : 'Saved.');
    } catch (e: unknown) {
      const issues = (e as { issues?: Array<{ message?: string }> })?.issues;
      setFieldError(issues?.[0]?.message || (e instanceof Error ? e.message : 'Could not save. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const saveBar = (
    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
      <Button size="sm" disabled={!canManage || saving || !dirty} onClick={() => void save()}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
      {!canManage && <span className="text-xs text-slate-500">Only an owner or admin can change this.</span>}
      {canManage && !dirty && <span className="text-xs text-slate-400">Nothing to save</span>}
      {fieldError && <p role="alert" className="text-xs font-semibold text-rose-700">{fieldError}</p>}
    </div>
  );

  if (section === 'store') {
    return (
      <SectionCard title="Open or closed" subtitle="Close your store for a short time, for example while you restock.">
        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4">
          <div>
            <p className="text-sm font-bold text-slate-950">{draft.open ? 'Your store is open' : 'Your store is closed'}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {draft.open
                ? 'Shoppers can browse and place orders.'
                : 'Shoppers can still look around, but they cannot place orders until you open again.'}
            </p>
          </div>
          <Switch label="Store is open" checked={draft.open} disabled={!canManage} onChange={() => setDraft({ ...draft, open: !draft.open })} />
        </div>
        {saveBar}
      </SectionCard>
    );
  }

  if (section === 'delivery') {
    const free = draft.shipping.freeOver !== null;
    return (
      <SectionCard title="Delivery charges" subtitle="What shoppers pay for delivery at checkout.">
        <div className="max-w-md space-y-4 text-sm">
          <label className="block space-y-1.5">
            <span className="font-semibold text-slate-700">Standard delivery fee (৳)</span>
            <input type="number" min={0} step="any" value={draft.shipping.defaultFee} disabled={!canManage} onChange={(e) => setShipping({ defaultFee: Number(e.target.value) })} className={INPUT} />
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-semibold text-slate-700">
              <input type="checkbox" checked={free} disabled={!canManage} onChange={(e) => setShipping({ freeOver: e.target.checked ? 150 : null })} className="h-4 w-4 accent-slate-950" />
              Free delivery on bigger orders
            </label>
            {free && (
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-600">Free when the items come to at least (৳)</span>
                <input type="number" min={0} step="any" value={draft.shipping.freeOver ?? 0} disabled={!canManage} onChange={(e) => setShipping({ freeOver: Number(e.target.value) })} className={INPUT} />
              </label>
            )}
          </div>
          <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
            {free
              ? `Orders under ${money(draft.shipping.freeOver ?? 0)} pay ${money(draft.shipping.defaultFee)} for delivery. Orders of ${money(draft.shipping.freeOver ?? 0)} or more get free delivery.`
              : `Every order pays ${money(draft.shipping.defaultFee)} for delivery.`}
          </p>
        </div>
        {saveBar}
      </SectionCard>
    );
  }

  const shownTitle = draft.seo.title.trim() || `${profile.name} | Official Boutique & AI Virtual Fitting`;
  const shownDescription = draft.seo.description.trim() || (profile.slogan || profile.description || 'Shop our collection and try it on virtually.');
  return (
    <SectionCard title="Search and sharing" subtitle="How your store looks in Google and when someone shares your link.">
      <div className="max-w-xl space-y-4 text-sm">
        <label className="block space-y-1.5">
          <span className="flex justify-between font-semibold text-slate-700">Title <span className="text-xs font-normal text-slate-400">{draft.seo.title.length}/70</span></span>
          <input value={draft.seo.title} maxLength={70} disabled={!canManage} onChange={(e) => setSeo({ title: e.target.value })} placeholder={`${profile.name} | Official Boutique`} className={INPUT} />
        </label>
        <label className="block space-y-1.5">
          <span className="flex justify-between font-semibold text-slate-700">Short description <span className="text-xs font-normal text-slate-400">{draft.seo.description.length}/160</span></span>
          <textarea rows={3} value={draft.seo.description} maxLength={160} disabled={!canManage} onChange={(e) => setSeo({ description: e.target.value })} placeholder="One or two sentences about your brand." className={INPUT} />
        </label>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">How it can look in Google</p>
          <p className="truncate text-base font-medium text-blue-700">{shownTitle}</p>
          <p className="truncate text-xs text-emerald-700">/brands/{profile.slug}</p>
          <p className="line-clamp-2 text-xs text-slate-600">{shownDescription}</p>
        </div>
      </div>
      {saveBar}
    </SectionCard>
  );
}
