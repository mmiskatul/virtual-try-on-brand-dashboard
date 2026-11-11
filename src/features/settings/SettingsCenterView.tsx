'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  Coins,
  Globe,
  Languages,
  Lock,
  MailCheck,
  Palette,
  Save,
  Search,
  Settings,
  Shield,
  Store,
  Truck,
  UserCheck,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services/brandService';
import { canPerform } from '../../config/permissions';
import {
  PageHeader,
  PermissionGate,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

export type SettingsTab =
  | 'overview'
  | 'general'
  | 'business'
  | 'store'
  | 'brand'
  | 'domains'
  | 'seo'
  | 'localization'
  | 'tax'
  | 'shipping'
  | 'notifications'
  | 'privacy'
  | 'security'
  | 'account';

const SETTINGS_NAV: Array<{ id: SettingsTab; label: string; href: string }> = [
  { id: 'overview', label: 'All Settings', href: '/dashboard/settings' },
  { id: 'general', label: 'General', href: '/dashboard/settings/general' },
  { id: 'business', label: 'Business Info', href: '/dashboard/settings/business' },
  { id: 'store', label: 'Store Availability', href: '/dashboard/settings/store' },
  { id: 'brand', label: 'Brand Shortcut', href: '/dashboard/settings/brand' },
  { id: 'domains', label: 'Domains & SSL', href: '/dashboard/settings/domains' },
  { id: 'seo', label: 'SEO Metadata', href: '/dashboard/settings/seo' },
  { id: 'localization', label: 'Localization', href: '/dashboard/settings/localization' },
  { id: 'tax', label: 'Currency & Taxes', href: '/dashboard/settings/tax' },
  { id: 'shipping', label: 'Shipping Rules', href: '/dashboard/settings/shipping' },
  { id: 'notifications', label: 'Notifications', href: '/dashboard/settings/notifications' },
  { id: 'privacy', label: 'Privacy & Data', href: '/dashboard/settings/privacy' },
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
    setSaving(true);
    try {
      updateProfile(form);
      updateTryOnConfig({ retentionDays, requireConsent });
      if (isLiveBackend) {
        await brandWorkspaceApi.updateProfile({
          name: form.name,
          description: form.description,
          contactEmail: form.email,
          logoUrl: form.logo,
          bannerUrl: form.banner,
        });
      }
      showToast('Saved workspace settings.');
    } catch (err: any) {
      showToast(err?.message || 'Saved locally, but backend sync failed.');
    } finally {
      setSaving(false);
    }
  };

  const settingsData = form.settings || {
    timezone: 'Asia/Dhaka (UTC+6)',
    dateFormat: 'YYYY-MM-DD',
    language: 'English (en-US)',
    currency: 'USD',
    taxRatePercent: 5,
    taxInclusive: false,
    freeShippingThreshold: 120,
    defaultShippingFee: 8,
    emailNotifications: true,
    orderNotifications: true,
    inventoryNotifications: true,
    tryOnNotifications: true,
    billingNotifications: true,
    twoFactorEnabled: false,
  };

  const patchSettings = (partial: Partial<typeof settingsData>) =>
    setForm((prev) => ({ ...prev, settings: { ...settingsData, ...partial } }));

  return (
    <PermissionGate module="settings" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workspace Control Center"
          title="Brand Settings & Configuration"
          subtitle="Configure domain routing, checkout taxes, shipping thresholds, privacy retention, and security."
          actions={
            <Button size="sm" disabled={!canManage || saving} onClick={() => handleSave()} className="gap-1.5">
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Settings Navigation */}
          <aside className="lg:col-span-3 space-y-1">
            {SETTINGS_NAV.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => setTab(n.id)}
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
                  { id: 'general', title: 'General Profile', desc: 'Brand display name, slogan, support contact', icon: Settings },
                  { id: 'business', title: 'Business & Legal', desc: 'Trade license, legal entity, headquarters', icon: Building2 },
                  { id: 'store', title: 'Store Availability', desc: 'Public boutique & marketplace status', icon: Store },
                  { id: 'domains', title: 'Domains & SSL', desc: 'Subdomain and custom domain verification', icon: Globe },
                  { id: 'tax', title: 'Currency & Taxes', desc: 'Checkout currency and VAT calculation', icon: Coins },
                  { id: 'privacy', title: 'Privacy & Security', desc: 'Photo retention rules and 2FA protection', icon: Lock },
                ].map((card) => {
                  const Icon = card.icon;
                  const targetHref = SETTINGS_NAV.find((n) => n.id === card.id)?.href || '/dashboard/settings';
                  return (
                    <Link
                      key={card.id}
                      href={targetHref}
                      onClick={() => setTab(card.id as SettingsTab)}
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

            {(tab === 'general' || tab === 'overview') && (
              <SectionCard title="General Workspace Settings" subtitle="Primary tenant identity and support email.">
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

            {tab === 'business' && (
              <SectionCard title="Registered Business Entity" subtitle="Corporate registration and fiscal address details.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Legal Entity Name</span>
                    <input
                      value={form.legalName || ''}
                      onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Business Structure</span>
                    <input
                      value={form.businessType || ''}
                      onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Trade License / Tax ID</span>
                    <input
                      value={form.registrationNumber || ''}
                      onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">City & Country</span>
                    <input
                      value={`${form.city || ''}, ${form.country || ''}`}
                      onChange={(e) => {
                        const [city, country] = e.target.value.split(',').map((s) => s.trim());
                        setForm({ ...form, city, country });
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1 sm:col-span-2">
                    <span className="font-semibold text-slate-700">Street Address</span>
                    <input
                      value={form.address || ''}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                </div>
              </SectionCard>
            )}

            {tab === 'store' && (
              <SectionCard title="Storefront & Marketplace Visibility" subtitle="Toggle storefront maintenance mode or pause global marketplace discovery.">
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">Dedicated Brand Storefront (/brands/{profile.slug})</p>
                      <p className="text-slate-500">Live allows shoppers to browse your brand storefront and check out.</p>
                    </div>
                    <select
                      value={form.storeStatus || 'LIVE'}
                      onChange={(e) => setForm({ ...form, storeStatus: e.target.value as 'LIVE' | 'MAINTENANCE' })}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 font-bold bg-white"
                    >
                      <option value="LIVE">LIVE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">Global Marketplace Participation</p>
                      <p className="text-slate-500">Temporarily pause all published posts without deleting product listings.</p>
                    </div>
                    <select
                      value={form.marketplaceStatus || 'CONNECTED'}
                      onChange={(e) =>
                        setForm({ ...form, marketplaceStatus: e.target.value as 'CONNECTED' | 'PAUSED' })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-1.5 font-bold bg-white"
                    >
                      <option value="CONNECTED">CONNECTED</option>
                      <option value="PAUSED">PAUSED</option>
                    </select>
                  </div>
                </div>
              </SectionCard>
            )}

            {tab === 'brand' && (
              <SectionCard title="Visual Identity Shortcut" subtitle="Primary visual theme controls or jump to the full Brand Identity Hub.">
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-lg border border-slate-300"
                      style={{ backgroundColor: form.primaryColor }}
                    />
                    <span
                      className="w-8 h-8 rounded-lg border border-slate-300"
                      style={{ backgroundColor: form.accentColor || '#d4a373' }}
                    />
                    <div>
                      <p className="font-bold text-slate-900">Active Brand Palette & Fonts</p>
                      <p className="text-slate-500">
                        {form.headingFont || 'Cormorant Garamond'} / {form.bodyFont || 'Plus Jakarta Sans'}
                      </p>
                    </div>
                  </div>
                  <Link href="/dashboard/brand/identity">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Palette className="w-3.5 h-3.5" /> Open Full Visual Identity Studio
                    </Button>
                  </Link>
                </div>
              </SectionCard>
            )}

            {tab === 'domains' && (
              <SectionCard title="Domains & SSL Certificates" subtitle="Default platform path and custom domain DNS setup.">
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Platform Storefront Path</p>
                      <p className="font-mono text-slate-600">/brands/{profile.slug}</p>
                    </div>
                    <StatusBadge status="ACTIVE" />
                  </div>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Custom Domain</span>
                    <input
                      value={form.domain?.customDomain || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          domain: {
                            subdomain: form.domain?.subdomain || `${profile.slug}.vton.app`,
                            customDomain: e.target.value,
                            verified: false,
                            sslStatus: form.domain?.sslStatus || 'PENDING',
                            primary: form.domain?.primary || 'subdomain',
                          },
                        })
                      }
                      placeholder="shop.yourdomain.com"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Point a CNAME record to <code>edge.vton-saas.example</code>. Live DNS verification requires SaaS edge proxy verification by the platform infrastructure.
                  </p>
                </div>
              </SectionCard>
            )}

            {tab === 'seo' && (
              <SectionCard title="Storefront SEO & Open Graph" subtitle="Search engine indexing titles and social preview metadata.">
                <div className="space-y-3 text-xs">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Meta Title</span>
                    <input
                      value={form.seo?.title || `${form.name} — Official Brand Store`}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          seo: {
                            ...(form.seo || { description: '', canonicalUrl: '', ogImage: '', allowIndexing: true }),
                            title: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Meta Description</span>
                    <textarea
                      rows={3}
                      value={form.seo?.description || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          seo: {
                            ...(form.seo || { title: '', canonicalUrl: '', ogImage: '', allowIndexing: true }),
                            description: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                </div>
              </SectionCard>
            )}

            {tab === 'localization' && (
              <SectionCard title="Regional Localization" subtitle="Timezone, date format, and workspace interface language.">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Timezone</span>
                    <input
                      value={settingsData.timezone}
                      onChange={(e) => patchSettings({ timezone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Date Format</span>
                    <select
                      value={settingsData.dateFormat}
                      onChange={(e) => patchSettings({ dateFormat: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Language</span>
                    <select
                      value={settingsData.language}
                      onChange={(e) => patchSettings({ language: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
                    >
                      <option value="English (en-US)">English (en-US)</option>
                      <option value="English (en-GB)">English (en-GB)</option>
                      <option value="Bengali (bn-BD)">Bengali (bn-BD)</option>
                    </select>
                  </label>
                </div>
              </SectionCard>
            )}

            {tab === 'tax' && (
              <SectionCard title="Currency & Checkout Taxes" subtitle="Display currency, VAT/GST rate, and tax-inclusive pricing mode.">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Store Currency</span>
                    <select
                      value={settingsData.currency}
                      onChange={(e) => patchSettings({ currency: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="BDT">BDT (৳)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">VAT / Tax Rate (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={settingsData.taxRatePercent}
                      onChange={(e) => patchSettings({ taxRatePercent: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      checked={settingsData.taxInclusive}
                      onChange={(e) => patchSettings({ taxInclusive: e.target.checked })}
                    />
                    <span className="font-semibold text-slate-700">Prices include tax</span>
                  </label>
                </div>
              </SectionCard>
            )}

            {tab === 'shipping' && (
              <SectionCard title="Storefront Shipping Rules" subtitle="Configure default delivery charges and free-shipping thresholds.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Default Flat Shipping Fee ($)</span>
                    <input
                      type="number"
                      min="0"
                      value={settingsData.defaultShippingFee}
                      onChange={(e) => patchSettings({ defaultShippingFee: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Free Shipping Minimum Order ($)</span>
                    <input
                      type="number"
                      min="0"
                      value={settingsData.freeShippingThreshold}
                      onChange={(e) => patchSettings({ freeShippingThreshold: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                </div>
              </SectionCard>
            )}

            {tab === 'notifications' && (
              <SectionCard title="Merchant Alert Preferences" subtitle="Select workspace alerts displayed and forwarded when SMTP is active.">
                <div className="space-y-3 text-xs">
                  {(
                    [
                      ['orderNotifications', 'New Customer Orders & Cancellation Alerts'],
                      ['inventoryNotifications', 'Low Stock Threshold Warnings (< 5 units)'],
                      ['tryOnNotifications', 'Virtual Try-On Failure & AI Quota 80% Warnings'],
                      ['billingNotifications', 'Monthly Plan Invoices & Renewal Notices'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
                      <span className="font-semibold text-slate-800">{label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsData[key])}
                        onChange={(e) => patchSettings({ [key]: e.target.checked })}
                      />
                    </label>
                  ))}
                </div>
              </SectionCard>
            )}

            {tab === 'privacy' && (
              <SectionCard title="Customer Privacy & Photo Retention Policy" subtitle="Compliance controls for uploaded try-on customer photos.">
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <p>
                    Setting retention days below documents your brand policy and storefront consent banner. Automatic background image deletion requires an enabled media lifecycle worker on your storage bucket.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Customer Photo Retention Policy (Days)</span>
                    <input
                      type="number"
                      min="1"
                      max="90"
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

            {tab === 'security' && (
              <SectionCard title="Account Security & Session Protection" subtitle="Tenant isolation, JWT cookie verification, and MFA configuration.">
                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900">Require Two-Factor Verification (Policy Toggle)</p>
                      <p className="text-slate-500">Enforce authenticator OTP during merchant login when identity provider supports MFA.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsData.twoFactorEnabled}
                      onChange={(e) => patchSettings({ twoFactorEnabled: e.target.checked })}
                    />
                  </label>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
                    <p className="font-bold text-slate-900 mb-1">Active Session Boundary</p>
                    <p>
                      Middleware validates signed NextAuth / merchant JWT tokens with role{' '}
                      <code>BRAND_OWNER</code> or <code>STORE_MANAGER</code> before admitting requests to <code>/dashboard/*</code>.
                    </p>
                  </div>
                </div>
              </SectionCard>
            )}

            {tab === 'account' && (
              <SectionCard title="Owner Account Summary" subtitle="Primary tenant administrator record.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Account Owner Name</span>
                    <input
                      value={form.owner}
                      onChange={(e) => setForm({ ...form, owner: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Workspace Tenant Slug</span>
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

