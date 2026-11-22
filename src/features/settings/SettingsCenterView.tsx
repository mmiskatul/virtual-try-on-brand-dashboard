'use client';

import { SecurityPanel } from './SecurityPanel';
import { StoreSettingsPanel } from './StoreSettingsPanel';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Lock,
  Palette,
  Save,
  Search,
  Settings,
  Shield,
  Store,
  Truck,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services/brandService';
import { canPerform } from '../../config/permissions';
import {
  PageHeader,
  PermissionGate,
  SectionCard,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

export type SettingsTab = 'overview' | 'onboarding' | 'general' | 'store' | 'delivery' | 'seo' | 'privacy' | 'security' | 'account';

const SETTINGS_NAV: Array<{ id: SettingsTab; label: string; href: string }> = [
  { id: 'overview', label: 'All settings', href: '/dashboard/settings' },
  { id: 'onboarding', label: 'Brand profile & business', href: '/dashboard/settings/onboarding' },
  { id: 'general', label: 'General', href: '/dashboard/settings/general' },
  { id: 'store', label: 'Store open or closed', href: '/dashboard/settings/store' },
  { id: 'delivery', label: 'Delivery charges', href: '/dashboard/settings/delivery' },
  { id: 'seo', label: 'Search & sharing', href: '/dashboard/settings/seo' },
  { id: 'privacy', label: 'Customer photo privacy', href: '/dashboard/settings/privacy' },
  { id: 'security', label: 'Security', href: '/dashboard/settings/security' },
  { id: 'account', label: 'Account', href: '/dashboard/settings/account' },
];

export function SettingsCenterView({
  initialTab = 'overview',
}: {
  initialTab?: SettingsTab;
}) {
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const profile = useWorkspaceStore((s) => s.profile);
  const tryOnConfig = useWorkspaceStore((s) => s.tryOnConfig);
  const updateProfile = useWorkspaceStore((s) => s.updateProfile);
  const updateTryOnConfig = useWorkspaceStore((s) => s.updateTryOnConfig);
  const showToast = useUiStore((s) => s.showToast);

  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [form, setForm] = useState(profile);
  const [retentionDays, setRetentionDays] = useState(tryOnConfig.retentionDays);
  const [requireConsent, setRequireConsent] = useState(tryOnConfig.requireConsent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const canManage = canPerform(activeRole, 'settings', 'manage_settings', roleOverrides);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isLiveBackend) {
      showToast('You are offline or signed out. Sign in to save your settings.');
      return;
    }
    setSaving(true);
    try {
      if (tab === 'privacy') {
        const saved = await brandWorkspaceApi.saveTryOnConfig({ retentionDays, requireConsent });
        updateTryOnConfig(saved);
        showToast('Customer photo privacy saved.');
      } else {
        await brandWorkspaceApi.updateProfile({
          name: form.name,
          description: form.description,
          contactEmail: form.email,
          logoUrl: form.logo,
          bannerUrl: form.banner,
        });
        await brandWorkspaceApi.updateBrandDetails({ slogan: (form.slogan || '').trim(), phone: (form.phone || '').trim() });
        updateProfile(form);
        showToast('Settings saved.');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Could not save your settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGate module="settings" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Settings"
          title="Settings"
          subtitle="Your brand details, whether your store is open, delivery charges, how you show up in Google, customer photo privacy and account security."
          actions={
            tab === 'security' || tab === 'onboarding' || tab === 'account' || tab === 'overview' || tab === 'store' || tab === 'delivery' || tab === 'seo' ? undefined : (
            <Button size="sm" disabled={!canManage || saving} onClick={() => handleSave()} className="gap-1.5">
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save changes'}
            </Button>
            )
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Settings Navigation */}
          <aside className="lg:col-span-3 space-y-1">
            {SETTINGS_NAV.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => {
                  // 'onboarding' is its own page (brand profile & assets), not an in-page tab.
                  if (n.id !== 'onboarding') setTab(n.id);
                }}
                className={`block px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  tab === n.id
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </aside>

          {/* Settings Form Panel */}
          <div className="lg:col-span-9 space-y-6">
            {tab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'onboarding', title: 'Brand profile & business', desc: 'Business details, verification, colours and logos', icon: Palette },
                  { id: 'general', title: 'General', desc: 'Brand name, tagline, support email and phone', icon: Settings },
                  { id: 'store', title: 'Store open or closed', desc: 'Close your store for a short time', icon: Store },
                  { id: 'delivery', title: 'Delivery charges', desc: 'Standard fee and free delivery', icon: Truck },
                  { id: 'seo', title: 'Search & sharing', desc: 'How your store looks in Google', icon: Search },
                  { id: 'privacy', title: 'Customer photo privacy', desc: 'How long try-on photos are kept, and consent', icon: Lock },
                  { id: 'security', title: 'Security', desc: 'Password, devices and sign-in protection', icon: Shield },
                ].map((card) => {
                  const Icon = card.icon;
                  const targetHref = SETTINGS_NAV.find((n) => n.id === card.id)?.href || '/dashboard/settings';
                  return (
                    <Link
                      key={card.id}
                      href={targetHref}
                      onClick={() => {
                        if (card.id !== 'onboarding') setTab(card.id as SettingsTab);
                      }}
                      className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 hover:border-slate-400 transition-colors"
                    >
                      <Icon className="w-5 h-5 text-slate-900" />
                      <h3 className="text-sm font-bold text-slate-900">{card.title}</h3>
                      <p className="text-xs text-slate-500">{card.desc}</p>
                    </Link>
                  );
                })}
              </div>
            )}

            {tab === 'general' && (
              <SectionCard title="General settings" subtitle="Your brand name and support email.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Brand Display Name</span>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Support Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Support Phone</span>
                    <input
                      value={form.phone || ''}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Storefront Tagline</span>
                    <input
                      value={form.slogan || ''}
                      onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                </div>
              </SectionCard>
            )}

            {tab === 'privacy' && (
              <SectionCard title="Customer photo privacy" subtitle="How long shoppers' try-on photos are kept, and whether they must agree first.">
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <p>
                    This is the promise shoppers see on your try-on page. Photos are only removed automatically after this many days once automatic clean-up is switched on for your image storage.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Customer Photo Retention Policy (Days)</span>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      checked={requireConsent}
                      onChange={(e) => setRequireConsent(e.target.checked)}
                    />
                    <span className="font-semibold text-slate-700">Require explicit customer privacy consent before generation</span>
                  </label>
                </div>
              </SectionCard>
            )}

            {(tab === 'store' || tab === 'delivery' || tab === 'seo') && <StoreSettingsPanel section={tab} />}

            {tab === 'security' && <SecurityPanel />}

            {tab === 'account' && (
              <SectionCard title="Owner account" subtitle="The main person who runs this shop.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Account Owner Name</span>
                    <input
                      disabled
                      value={form.owner}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Your store name in the web address</span>
                    <input
                      disabled
                      value={form.slug}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-500"
                    />
                  </label>
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}

