'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services/brandService';
import { canPerform } from '../../config/permissions';
import { PageHeader, PermissionGate, SectionCard } from '../../components/shared/UiPrimitives';
import { Field, SaveBar, useUnsavedWarning } from '../../components/shared/SettingsKit';

export function PrivacySettingsView() {
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const tryOnConfig = useWorkspaceStore((s) => s.tryOnConfig);
  const updateTryOnConfig = useWorkspaceStore((s) => s.updateTryOnConfig);
  const showToast = useUiStore((s) => s.showToast);

  const [retentionDays, setRetentionDays] = useState(String(tryOnConfig.retentionDays));
  const [requireConsent, setRequireConsent] = useState(tryOnConfig.requireConsent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRetentionDays(String(tryOnConfig.retentionDays));
    setRequireConsent(tryOnConfig.requireConsent);
  }, [tryOnConfig.retentionDays, tryOnConfig.requireConsent]);

  const canManage = canPerform(activeRole, 'settings', 'manage_settings', roleOverrides);
  const days = Number(retentionDays);
  const invalid = !Number.isFinite(days) || !Number.isInteger(days) || days < 1 || days > 365;
  const dirty = days !== tryOnConfig.retentionDays || requireConsent !== tryOnConfig.requireConsent;
  useUnsavedWarning(dirty);

  const save = async () => {
    setError(null);
    if (!isLiveBackend) {
      setError('You are offline or signed out. Sign in to save your settings.');
      return;
    }
    if (invalid) {
      setError('Keep photos for a whole number of days from 1 to 365.');
      return;
    }
    setSaving(true);
    try {
      const saved = await brandWorkspaceApi.saveTryOnConfig({ retentionDays: days, requireConsent });
      updateTryOnConfig(saved);
      showToast('Customer photo privacy saved.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save your settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGate module="settings" action="view">
      <div className="space-y-6">
        <PageHeader
          backHref="/dashboard/settings"
          backLabel="Settings"
          eyebrow="Settings • Try-on"
          title="Try-on privacy"
          subtitle="How long shoppers' try-on photos are kept, and whether they must agree first."
        />
        <SectionCard title="Customer photos" subtitle="This is the promise shoppers see on your try-on page.">
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>Photos are only removed automatically after this many days once automatic clean-up is switched on for your image storage.</p>
          </div>
          <div className="max-w-md space-y-4 text-sm">
            <Field
              label="Keep customer photos for (days)"
              type="number"
              disabled={!canManage}
              value={retentionDays}
              onChange={setRetentionDays}
              error={invalid ? 'Enter a whole number from 1 to 365.' : null}
            />
            <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3.5">
              <input type="checkbox" checked={requireConsent} disabled={!canManage} onChange={(e) => setRequireConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-slate-950" />
              <span>
                <span className="block font-semibold text-slate-700">Ask for consent before every try-on</span>
                <span className="text-xs text-slate-500">Shoppers must agree to your photo policy before a try-on is generated.</span>
              </span>
            </label>
          </div>
        </SectionCard>
        <SaveBar
          dirty={dirty}
          saving={saving}
          canEdit={canManage && !invalid}
          error={error}
          onSave={() => void save()}
          onDiscard={() => {
            setRetentionDays(String(tryOnConfig.retentionDays));
            setRequireConsent(tryOnConfig.requireConsent);
            setError(null);
          }}
        />
      </div>
    </PermissionGate>
  );
}
