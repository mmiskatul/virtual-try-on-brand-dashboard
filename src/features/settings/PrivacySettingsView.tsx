'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services/brandService';
import { canPerform } from '../../config/permissions';
import { PageHeader, PermissionGate, SectionCard } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

const INPUT = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50 disabled:text-slate-400';

export function PrivacySettingsView() {
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const tryOnConfig = useWorkspaceStore((s) => s.tryOnConfig);
  const updateTryOnConfig = useWorkspaceStore((s) => s.updateTryOnConfig);
  const showToast = useUiStore((s) => s.showToast);

  const [retentionDays, setRetentionDays] = useState(tryOnConfig.retentionDays);
  const [requireConsent, setRequireConsent] = useState(tryOnConfig.requireConsent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRetentionDays(tryOnConfig.retentionDays);
    setRequireConsent(tryOnConfig.requireConsent);
  }, [tryOnConfig.retentionDays, tryOnConfig.requireConsent]);

  const canManage = canPerform(activeRole, 'settings', 'manage_settings', roleOverrides);
  const days = Number(retentionDays);
  const invalid = !Number.isFinite(days) || days < 1 || days > 365;
  const dirty = days !== tryOnConfig.retentionDays || requireConsent !== tryOnConfig.requireConsent;

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isLiveBackend) {
      showToast('You are offline or signed out. Sign in to save your settings.');
      return;
    }
    if (invalid) {
      showToast('Keep photos for between 1 and 365 days.');
      return;
    }
    setSaving(true);
    try {
      const saved = await brandWorkspaceApi.saveTryOnConfig({ retentionDays: days, requireConsent });
      updateTryOnConfig(saved);
      showToast('Customer photo privacy saved.');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not save your settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGate module="settings" action="view">
      <form onSubmit={save} className="space-y-6">
        <PageHeader
          eyebrow="Settings • Try-on privacy"
          title="Try-on privacy"
          subtitle="How long shoppers' try-on photos are kept, and whether they must agree first."
          actions={
            <Button type="submit" size="sm" disabled={!canManage || saving || !dirty || invalid}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          }
        />
        <SectionCard title="Customer photos" subtitle="This is the promise shoppers see on your try-on page.">
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>Photos are only removed automatically after this many days once automatic clean-up is switched on for your image storage.</p>
          </div>
          <div className="max-w-md space-y-4 text-sm">
            <label className="block space-y-1.5">
              <span className="font-semibold text-slate-700">Keep customer photos for (days)</span>
              <input type="number" min={1} max={365} value={retentionDays} disabled={!canManage} onChange={(e) => setRetentionDays(Number(e.target.value))} className={INPUT} />
              {invalid && <span className="text-xs text-rose-700">Enter a number from 1 to 365.</span>}
            </label>
            <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3.5">
              <input type="checkbox" checked={requireConsent} disabled={!canManage} onChange={(e) => setRequireConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-slate-950" />
              <span>
                <span className="block font-semibold text-slate-700">Ask for consent before every try-on</span>
                <span className="text-xs text-slate-500">Shoppers must agree to your photo policy before a try-on is generated.</span>
              </span>
            </label>
            {!canManage && <p className="text-xs text-slate-500">Only an owner or admin can change this.</p>}
          </div>
        </SectionCard>
      </form>
    </PermissionGate>
  );
}
