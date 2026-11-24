'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { brandWorkspaceApi, type StoreSettings } from '../../services/brandService';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { canPerform } from '../../config/permissions';
import { ErrorBanner, PageHeader, PermissionGate, SectionCard } from '../../components/shared/UiPrimitives';
import { Field, SaveBar, useUnsavedWarning } from '../../components/shared/SettingsKit';
import { Switch } from '../products/shared';

export type StoreSection = 'store' | 'delivery' | 'seo' | 'audience' | 'returns';

const money = (n: number) => `৳${n.toLocaleString()}`;

const COPY: Record<StoreSection, { title: string; subtitle: string }> = {
  store: { title: 'Open or closed', subtitle: 'Close your store for a short time, for example while you restock.' },
  delivery: { title: 'Delivery charges', subtitle: 'What shoppers pay for delivery at checkout.' },
  audience: { title: 'Who the store is for', subtitle: 'Choose women, men or both. This sets what shoppers see first on your try-on page.' },
  returns: { title: 'Return policy', subtitle: 'The return window and the words shoppers read before they buy.' },
  seo: { title: 'Search & sharing', subtitle: 'How your store looks in Google and when someone shares your link.' },
};

/**
 * The store settings that really save on the server and change what shoppers see.
 * Each section is its own page and only sends its own part to the server.
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

  const part = (s: StoreSettings | null) =>
    s ? JSON.stringify(section === 'store' ? s.open : section === 'delivery' ? s.shipping : section === 'audience' ? s.audience : section === 'returns' ? s.returns : s.seo) : '';
  const dirty = part(draft) !== part(saved);
  useUnsavedWarning(dirty);

  const header = (
    <PageHeader
      backHref="/dashboard/settings"
      backLabel="Settings"
      eyebrow="Settings • Store"
      title={COPY[section].title}
      subtitle={COPY[section].subtitle}
    />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="space-y-3" aria-busy="true" aria-label="Loading settings">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }
  if (error || !draft || !saved) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorBanner message={error || 'Could not load your settings.'} onRetry={() => void load()} />
      </div>
    );
  }

  const setShipping = (p: Partial<StoreSettings['shipping']>) => setDraft({ ...draft, shipping: { ...draft.shipping, ...p } });
  const setSeo = (p: Partial<StoreSettings['seo']>) => setDraft({ ...draft, seo: { ...draft.seo, ...p } });
  const setReturns = (p: Partial<StoreSettings['returns']>) => setDraft({ ...draft, returns: { ...draft.returns, ...p } });

  const save = async () => {
    setFieldError(null);
    if (section === 'delivery') {
      if (!Number.isFinite(draft.shipping.defaultFee) || draft.shipping.defaultFee < 0) return setFieldError('The delivery fee cannot be negative.');
      if (draft.shipping.freeOver !== null && (!Number.isFinite(draft.shipping.freeOver) || draft.shipping.freeOver < 0)) return setFieldError('The free-delivery amount cannot be negative.');
    }
    if (section === 'returns') {
      const d = draft.returns.windowDays;
      if (d !== null && (!Number.isInteger(d) || d < 1 || d > 365)) return setFieldError('The return window must be a whole number of days from 1 to 365, or left empty.');
    }
    setSaving(true);
    try {
      const patch =
        section === 'store' ? { open: draft.open }
        : section === 'delivery' ? { shipping: draft.shipping }
        : section === 'audience' ? { audience: draft.audience }
        : section === 'returns' ? { returns: draft.returns }
        : { seo: draft.seo };
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

  const discard = () => {
    setFieldError(null);
    setDraft(saved);
  };

  const saveBar = <SaveBar dirty={dirty} saving={saving} canEdit={canManage} error={fieldError} onSave={() => void save()} onDiscard={discard} />;

  let body: React.ReactNode;
  if (section === 'store') {
    body = (
      <SectionCard title="Store status">
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
      </SectionCard>
    );
  } else if (section === 'delivery') {
    const free = draft.shipping.freeOver !== null;
    body = (
      <SectionCard title="Delivery fee">
        <div className="max-w-md space-y-4 text-sm">
          <Field
            label="Standard delivery fee (৳)"
            type="number"
            disabled={!canManage}
            value={String(draft.shipping.defaultFee)}
            onChange={(v) => setShipping({ defaultFee: Number(v) })}
          />
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-semibold text-slate-700">
              <input type="checkbox" checked={free} disabled={!canManage} onChange={(e) => setShipping({ freeOver: e.target.checked ? 150 : null })} className="h-4 w-4 accent-slate-950" />
              Free delivery on bigger orders
            </label>
            {free && (
              <Field
                label="Free when the items come to at least (৳)"
                type="number"
                disabled={!canManage}
                value={String(draft.shipping.freeOver ?? 0)}
                onChange={(v) => setShipping({ freeOver: Number(v) })}
              />
            )}
          </div>
          <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
            {free
              ? `Orders under ${money(draft.shipping.freeOver ?? 0)} pay ${money(draft.shipping.defaultFee)} for delivery. Orders of ${money(draft.shipping.freeOver ?? 0)} or more get free delivery.`
              : `Every order pays ${money(draft.shipping.defaultFee)} for delivery.`}
          </p>
        </div>
      </SectionCard>
    );
  } else if (section === 'audience') {
    const OPTIONS: Array<{ value: StoreSettings['audience']; label: string; hint: string }> = [
      { value: 'WOMEN', label: 'Women', hint: 'Shoppers go straight to clothes for women. The man or woman question is skipped.' },
      { value: 'MEN', label: 'Men', hint: 'Shoppers go straight to clothes for men. The man or woman question is skipped.' },
      { value: 'UNISEX', label: 'Women and men', hint: 'Shoppers choose man or woman first. Each product still has its own Women, Men or Both setting.' },
    ];
    body = (
      <SectionCard title="Who is your store for?">
        <div role="radiogroup" aria-label="Who the store is for" className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          {OPTIONS.map((o) => {
            const on = draft.audience === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={!canManage}
                onClick={() => setDraft({ ...draft, audience: o.value })}
                className={`rounded-2xl border p-4 text-left transition-colors disabled:opacity-60 ${on ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white hover:border-slate-400'}`}
              >
                <span className="block text-sm font-bold">{o.label}</span>
                <span className={`mt-1 block text-xs ${on ? 'text-slate-300' : 'text-slate-500'}`}>{o.hint}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>
    );
  } else if (section === 'returns') {
    const days = draft.returns.windowDays;
    body = (
      <SectionCard title="Return policy">
        <div className="max-w-xl space-y-4 text-sm">
          <Field
            label="Return window (days)"
            type="number"
            disabled={!canManage}
            value={days === null ? '' : String(days)}
            placeholder="Leave empty for no set window"
            hint="How many days after delivery a shopper can send an item back."
            onChange={(v) => setReturns({ windowDays: v.trim() === '' ? null : Number(v) })}
          />
          <Field
            label="Policy for shoppers"
            rows={6}
            maxLength={2000}
            disabled={!canManage}
            value={draft.returns.policy}
            placeholder="For example: Unworn items with tags can be returned within 7 days. Refunds go back to your original payment method."
            onChange={(v) => setReturns({ policy: v })}
          />
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">What shoppers see on your store</p>
            {days || draft.returns.policy.trim() ? (
              <>
                {days ? <p className="text-sm font-bold text-slate-950">{days}-day returns</p> : null}
                {draft.returns.policy.trim() ? <p className="whitespace-pre-line text-xs text-slate-600">{draft.returns.policy.trim()}</p> : null}
              </>
            ) : (
              <p className="text-xs text-slate-500">Nothing is shown until you add a return window or a policy.</p>
            )}
          </div>
        </div>
      </SectionCard>
    );
  } else {
    const shownTitle = draft.seo.title.trim() || `${profile.name} | Official Boutique & AI Virtual Fitting`;
    const shownDescription = draft.seo.description.trim() || (profile.slogan || profile.description || 'Shop our collection and try it on virtually.');
    body = (
      <SectionCard title="Google listing">
        <div className="max-w-xl space-y-4 text-sm">
          <Field label="Title" maxLength={70} disabled={!canManage} value={draft.seo.title} placeholder={`${profile.name} | Official Boutique`} onChange={(v) => setSeo({ title: v })} />
          <Field label="Short description" rows={3} maxLength={160} disabled={!canManage} value={draft.seo.description} placeholder="One or two sentences about your brand." onChange={(v) => setSeo({ description: v })} />
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">How it can look in Google</p>
            <p className="truncate text-base font-medium text-blue-700">{shownTitle}</p>
            <p className="truncate text-xs text-emerald-700">/brands/{profile.slug}</p>
            <p className="line-clamp-2 text-xs text-slate-600">{shownDescription}</p>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <PermissionGate module="settings" action="view">
      <div className="space-y-6">
        {header}
        {body}
        {saveBar}
      </div>
    </PermissionGate>
  );
}
