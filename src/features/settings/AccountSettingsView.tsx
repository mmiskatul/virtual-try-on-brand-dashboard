'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { PageHeader, PermissionGate, SectionCard } from '../../components/shared/UiPrimitives';
import { SecurityPanel } from './SecurityPanel';

export function AccountSettingsView() {
  const profile = useWorkspaceStore((s) => s.profile);
  return (
    <PermissionGate module="settings" action="view">
      <div className="space-y-6">
        <PageHeader
          backHref="/dashboard/settings"
          backLabel="Settings"
          eyebrow="Settings • Account"
          title="Owner & shop address"
          subtitle="Who owns this shop and the web address shoppers use."
        />
        <SectionCard title="Owner and shop address">
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Account owner</span>
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-600">{profile.owner || '—'}</p>
              <p className="text-[11px] text-slate-500">
                To change this, edit it in <Link href="/dashboard/settings/profile" className="font-semibold text-slate-900 underline">Brand profile</Link>.
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Your shop address</span>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <span className="truncate font-mono text-slate-600">/brands/{profile.slug}</span>
                <Link href={`/brands/${profile.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-slate-900 hover:underline">
                  Open <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </PermissionGate>
  );
}

export function SecuritySettingsView() {
  return (
    <PermissionGate module="settings" action="view">
      <div className="space-y-6">
        <PageHeader
          backHref="/dashboard/settings"
          backLabel="Settings"
          eyebrow="Settings • Account"
          title="Security & devices"
          subtitle="Change your password and see where you are signed in."
        />
        <SecurityPanel />
      </div>
    </PermissionGate>
  );
}
