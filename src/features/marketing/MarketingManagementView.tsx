'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Mail,
  Megaphone,
  Percent,
  Plus,
  Tag,
  Ticket,
  TrendingUp,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { useMounted } from '../../hooks/useMounted';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  PermissionGate,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { canPerform } from '../../config/permissions';
import { DiscountCode } from '../../types';

export type MarketingTab = 'overview' | 'campaigns' | 'discounts' | 'coupons' | 'newsletter';

const MKT_TABS: Array<{ id: MarketingTab; label: string; href: string }> = [
  { id: 'overview', label: 'Marketing Overview', href: '/dashboard/marketing' },
  { id: 'campaigns', label: 'Campaigns', href: '/dashboard/marketing/campaigns' },
  { id: 'discounts', label: 'Discounts', href: '/dashboard/marketing/discounts' },
  { id: 'coupons', label: 'Coupons', href: '/dashboard/marketing/coupons' },
  { id: 'newsletter', label: 'Newsletter', href: '/dashboard/marketing/newsletter' },
];

export function MarketingManagementView({
  initialTab = 'overview',
}: {
  initialTab?: MarketingTab;
}) {
  const mounted = useMounted();
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const campaigns = useWorkspaceStore((s) => s.campaigns);
  const discounts = useWorkspaceStore((s) => s.discounts);
  const customers = useWorkspaceStore((s) => s.customers);
  const addCampaign = useWorkspaceStore((s) => s.addCampaign);
  const addDiscount = useWorkspaceStore((s) => s.addDiscount);
  const toggleDiscountActive = useWorkspaceStore((s) => s.toggleDiscountActive);
  const recordAudit = useWorkspaceStore((s) => s.recordAudit);
  const showToast = useUiStore((s) => s.showToast);

  const [tab, setTab] = useState<MarketingTab>(initialTab);

  // Campaign form state
  const [campName, setCampName] = useState('');
  const [campSeason, setCampSeason] = useState('Winter Drop 2026');
  const [campStart, setCampStart] = useState('2026-11-15');
  const [campEnd, setCampEnd] = useState('2026-12-15');

  // Discount / coupon form state
  const [code, setCode] = useState('');
  const [discType, setDiscType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discVal, setDiscVal] = useState('15');
  const [minOrder, setMinOrder] = useState('50');
  const [scope, setScope] = useState<DiscountCode['scope']>('ALL_PRODUCTS');
  const [usageLimit, setUsageLimit] = useState('200');
  const [expiresAt, setExpiresAt] = useState('2026-12-31');

  const canCreate = canPerform(activeRole, 'marketing', 'create', roleOverrides);
  const safeCampaigns = mounted ? campaigns : [];
  const safeDiscounts = mounted ? discounts : [];
  const safeCustomers = mounted ? customers : [];

  const totalConversions = safeCampaigns.reduce((s, c) => s + c.conversions, 0);
  const activeCoupons = safeDiscounts.filter((d) => d.active).length;

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) return;
    addCampaign({
      id: `cmp_${Date.now()}`,
      name: campName.trim(),
      season: campSeason.trim(),
      status: 'ACTIVE',
      startDate: campStart,
      endDate: campEnd,
      impressions: 0,
      conversions: 0,
    });
    recordAudit('CAMPAIGN_CREATED', campName.trim(), `Season: ${campSeason}`);
    showToast(`Created campaign "${campName.trim()}".`);
    setCampName('');
  };

  const handleCreateDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    addDiscount({
      id: `dsc_${Date.now()}`,
      code: cleanCode,
      type: discType,
      value: Number(discVal) || 10,
      minOrderValue: Number(minOrder) || 0,
      scope,
      usageCount: 0,
      usageLimit: Number(usageLimit) || 100,
      expiresAt,
      active: true,
    });
    recordAudit('DISCOUNT_CREATED', cleanCode, `${discVal} (${discType})`);
    showToast(`Promo code ${cleanCode} created.`);
    setCode('');
  };

  return (
    <PermissionGate module="marketing" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Growth & Promotions"
          title="Marketing, Promo Codes & Campaigns"
          subtitle="Launch seasonal drops, configure cart discounts, and review opt-in audience segments."
        />

        <div className="flex flex-wrap gap-2">
          {MKT_TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                tab === t.id
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Active Campaigns" value={safeCampaigns.filter((c) => c.status === 'ACTIVE').length} icon={<Megaphone className="w-4 h-4" />} />
          <KpiCard label="Campaign Conversions" value={totalConversions} icon={<TrendingUp className="w-4 h-4" />} />
          <KpiCard label="Active Promo Codes" value={activeCoupons} icon={<Ticket className="w-4 h-4" />} />
          <KpiCard label="Reachable Patrons" value={safeCustomers.length} icon={<Mail className="w-4 h-4" />} />
        </div>

        {(tab === 'overview' || tab === 'campaigns') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <SectionCard
              className="lg:col-span-7"
              title="Seasonal Campaigns & Collection Drops"
              subtitle="Organize promotions across your storefront and marketplace posts."
            >
              {safeCampaigns.length === 0 ? (
                <EmptyState title="No campaigns yet" description="Create your first seasonal drop using the builder." />
              ) : (
                <div className="space-y-3 text-xs">
                  {safeCampaigns.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="text-slate-500 mt-0.5">
                          {c.season} • {c.startDate} to {c.endDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{c.impressions.toLocaleString()} views</p>
                        <p className="text-slate-500">{c.conversions} conversions</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              className="lg:col-span-5"
              title="Launch Campaign"
              subtitle="Track impressions and conversions around a collection window."
            >
              <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Campaign Name</span>
                  <input
                    required
                    disabled={!canCreate}
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    placeholder="e.g. Eid Silk Heritage Drop"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Season / Collection Focus</span>
                  <input
                    disabled={!canCreate}
                    value={campSeason}
                    onChange={(e) => setCampSeason(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Start Date</span>
                    <input
                      type="date"
                      value={campStart}
                      onChange={(e) => setCampStart(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">End Date</span>
                    <input
                      type="date"
                      value={campEnd}
                      onChange={(e) => setCampEnd(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                </div>
                <Button type="submit" disabled={!canCreate} className="w-full gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Create Campaign
                </Button>
              </form>
            </SectionCard>
          </div>
        )}

        {(tab === 'overview' || tab === 'discounts' || tab === 'coupons') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <SectionCard
              className="lg:col-span-7"
              title={tab === 'coupons' ? 'Promo Coupons' : 'Discounts & Promo Codes'}
              subtitle="Percentage and fixed cart discounts scoped to your brand storefront."
            >
              {safeDiscounts.length === 0 ? (
                <EmptyState title="No promo codes" description="Create a percentage or fixed discount code." />
              ) : (
                <>
                  <div className="sm:hidden space-y-2.5 text-xs">
                    {safeDiscounts.map((d) => (
                      <div key={d.id} className="rounded-xl border border-slate-200 p-3 bg-white space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono font-extrabold text-slate-950 break-all">{d.code}</p>
                            <p className="font-bold text-slate-700 mt-0.5">
                              {d.type === 'PERCENTAGE' ? `${d.value}% OFF` : `৳${d.value} OFF`}
                            </p>
                          </div>
                          <StatusBadge status={d.active ? 'ACTIVE' : 'PAUSED'} />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                          <span>{d.scope.replace('_', ' ')} · Min ${d.minOrderValue} · {d.usageCount}/{d.usageLimit}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!canCreate}
                            onClick={() => {
                              toggleDiscountActive(d.id);
                              showToast(`${d.code} ${d.active ? 'paused' : 'activated'}.`);
                            }}
                            className="h-7 px-2.5 text-[11px]"
                          >
                            {d.active ? 'Pause' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 pr-4">Code</th>
                          <th className="py-2.5 pr-4">Benefit</th>
                          <th className="py-2.5 pr-4">Scope & Min</th>
                          <th className="py-2.5 pr-4">Usage</th>
                          <th className="py-2.5 pr-4">Status</th>
                          <th className="py-2.5 text-right">Toggle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {safeDiscounts.map((d) => (
                          <tr key={d.id}>
                            <td className="py-3 pr-4 font-mono font-extrabold text-slate-950">{d.code}</td>
                            <td className="py-3 pr-4 font-bold text-slate-800">
                              {d.type === 'PERCENTAGE' ? `${d.value}% OFF` : `৳${d.value} OFF`}
                            </td>
                            <td className="py-3 pr-4 text-slate-600">
                              {d.scope.replace('_', ' ')} • Min ${d.minOrderValue}
                            </td>
                            <td className="py-3 pr-4 text-slate-600">
                              {d.usageCount} / {d.usageLimit}
                            </td>
                            <td className="py-3 pr-4">
                              <StatusBadge status={d.active ? 'ACTIVE' : 'PAUSED'} />
                            </td>
                            <td className="py-3 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!canCreate}
                                onClick={() => {
                                  toggleDiscountActive(d.id);
                                  showToast(`${d.code} ${d.active ? 'paused' : 'activated'}.`);
                                }}
                                className="h-7 px-2.5 text-[11px]"
                              >
                                {d.active ? 'Pause' : 'Activate'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </SectionCard>

            <SectionCard
              className="lg:col-span-5"
              title="Create Promo / Coupon Code"
              subtitle="Set minimum spend thresholds and usage caps."
            >
              <form onSubmit={handleCreateDiscount} className="space-y-3 text-xs">
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Coupon Code</span>
                  <input
                    required
                    disabled={!canCreate}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. TRYON15"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono uppercase"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Type</span>
                    <select
                      value={discType}
                      onChange={(e) => setDiscType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (৳)</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Value</span>
                    <input
                      type="number"
                      min="1"
                      value={discVal}
                      onChange={(e) => setDiscVal(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Min Order (৳)</span>
                    <input
                      type="number"
                      min="0"
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Usage Limit</span>
                    <input
                      type="number"
                      min="1"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Scope</span>
                    <select
                      value={scope}
                      onChange={(e) => setScope(e.target.value as DiscountCode['scope'])}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
                    >
                      <option value="ALL_PRODUCTS">All Brand Products</option>
                      <option value="COLLECTION">Specific Collection</option>
                      <option value="SPECIFIC_PRODUCT">Specific Product</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Expires On</span>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                </div>

                <Button type="submit" disabled={!canCreate} className="w-full gap-1.5">
                  <Percent className="w-3.5 h-3.5" /> Save Discount Code
                </Button>
              </form>
            </SectionCard>
          </div>
        )}

        {tab === 'newsletter' && (
          <SectionCard
            title="Newsletter Subscribers & Dispatch Integration"
            subtitle="Audience list compiled from tenant customers who checked out on your storefront."
          >
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <p className="font-bold">External Email Provider Required for Bulk Sending</p>
                <p>
                  No SMTP relay or marketing email API (Resend, SendGrid, Postmark, Mailchimp) is connected yet. You can export your tenant subscriber CSV below or configure webhooks under{' '}
                  <Link href="/dashboard/integrations" className="underline font-bold">
                    Integrations
                  </Link>
                  . We do not simulate sending bulk emails.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {safeCustomers.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-slate-500">{c.email}</p>
                  </div>
                  <StatusBadge status={c.group} />
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </PermissionGate>
  );
}

