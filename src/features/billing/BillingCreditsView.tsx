'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  CreditCard,
  Download,
  FileText,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { useMounted } from '../../hooks/useMounted';
import { BrandProfile } from '../../types';
import {
  ConfirmDialog,
  KpiCard,
  PageHeader,
  PermissionGate,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { canPerform } from '../../config/permissions';

export type BillingTab = 'overview' | 'plan' | 'usage' | 'invoices' | 'payment-methods';

const BILLING_TABS: Array<{ id: BillingTab; label: string; href: string }> = [
  { id: 'overview', label: 'Billing Overview', href: '/dashboard/billing' },
  { id: 'plan', label: 'Subscription Plan', href: '/dashboard/billing/plan' },
  { id: 'usage', label: 'AI Usage & Credits', href: '/dashboard/billing/usage' },
  { id: 'invoices', label: 'Invoices', href: '/dashboard/billing/invoices' },
  { id: 'payment-methods', label: 'Payment Methods', href: '/dashboard/billing/payment-methods' },
];

const PLANS: Array<{
  id: BrandProfile['plan'];
  priceMonthly: number;
  quotaMax: number;
  seats: string;
  features: string[];
}> = [
  {
    id: 'FREE',
    priceMonthly: 0,
    quotaMax: 150,
    seats: '1 Staff Seat',
    features: ['Subdomain storefront', 'Up to 25 catalog SKUs', 'Standard try-on queue'],
  },
  {
    id: 'STARTER',
    priceMonthly: 39,
    quotaMax: 1000,
    seats: '3 Staff Seats',
    features: ['Custom domain support', 'Up to 200 catalog SKUs', 'Global Marketplace publishing'],
  },
  {
    id: 'PRO',
    priceMonthly: 99,
    quotaMax: 5000,
    seats: '10 Staff Seats',
    features: ['Unlimited SKUs', 'High-fidelity 1024px AI try-on', 'REST API & Webhooks'],
  },
  {
    id: 'ENTERPRISE',
    priceMonthly: 299,
    quotaMax: 25000,
    seats: 'Unlimited Seats',
    features: ['Dedicated GPU concurrency', 'SLA & priority model warm-up', 'Custom embed SDK branding'],
  },
];

export function BillingCreditsView({
  initialTab = 'overview',
}: {
  initialTab?: BillingTab;
}) {
  const mounted = useMounted();
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const profile = useWorkspaceStore((s) => s.profile);
  const invoices = useWorkspaceStore((s) => s.invoices);
  const tryOnSessions = useWorkspaceStore((s) => s.tryOnSessions);
  const updateProfile = useWorkspaceStore((s) => s.updateProfile);
  const showToast = useUiStore((s) => s.showToast);

  const [tab, setTab] = useState<BillingTab>(initialTab);
  const [confirmPlan, setConfirmPlan] = useState<typeof PLANS[number] | null>(null);

  const canManageBilling = canPerform(activeRole, 'billing', 'manage_settings', roleOverrides);
  const safeInvoices = mounted ? invoices : [];
  const safeSessions = mounted ? tryOnSessions : [];

  const remaining = Math.max(0, profile.quotaMax - profile.quotaUsed);
  const pct = Math.min(100, Math.round((profile.quotaUsed / Math.max(1, profile.quotaMax)) * 100));
  const completedCredits = safeSessions
    .filter((s) => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.creditsUsed, 0);
  const failedRuns = safeSessions.filter((s) => s.status === 'FAILED').length;

  const downloadInvoiceText = (inv: typeof safeInvoices[number]) => {
    const content = [
      `INVOICE ${inv.id}`,
      `Tenant: ${profile.name} (${profile.slug})`,
      `Plan: ${inv.plan}`,
      `Billing Period: ${inv.period}`,
      `Issued: ${inv.issuedAt}`,
      `Amount Paid: $${inv.amount.toFixed(2)}`,
      `Status: ${inv.status}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded receipt for ${inv.id}.`);
  };

  return (
    <PermissionGate module="billing" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="SaaS Plan & Metering"
          title="Subscription, Billing & AI Try-On Credits"
          subtitle="Monitor monthly virtual try-on compute consumption, plan entitlements, and billing invoices."
        />

        <div className="flex flex-wrap gap-2">
          {BILLING_TABS.map((t) => (
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard label="Current Plan" value={profile.plan} icon={<Zap className="w-4 h-4 text-amber-600" />} />
          <KpiCard label="Credits Consumed" value={profile.quotaUsed.toLocaleString()} icon={<Sparkles className="w-4 h-4" />} />
          <KpiCard label="Credits Remaining" value={remaining.toLocaleString()} icon={<Coins className="w-4 h-4" />} />
          <KpiCard label="Failed Runs (0 Credit Charge)" value={failedRuns} icon={<FileText className="w-4 h-4" />} />
        </div>

        {(tab === 'overview' || tab === 'usage') && (
          <SectionCard
            title="Monthly AI Compute Quota"
            subtitle={`${profile.quotaUsed.toLocaleString()} of ${profile.quotaMax.toLocaleString()} credits utilized (${pct}%)`}
            right={<StatusBadge status={pct > 85 ? 'PENDING' : 'ACTIVE'} />}
          >
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-950 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              Logged Completed Credits in Recent Telemetry Window: <strong>{completedCredits}</strong> credit(s). Failed AI pre-checks do not deduct merchant quota.
            </p>

            <div className="pt-3 border-t border-slate-100">
              <div className="sm:hidden space-y-2.5 text-xs">
                {safeSessions.map((s) => (
                  <div key={s.id} className="rounded-xl border border-slate-200 p-3 bg-white space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 break-words">{s.productName}</p>
                        <p className="font-mono text-[11px] text-slate-500 break-all">{s.id}</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                      <span><strong className="text-slate-900">{s.creditsUsed}</strong> credits · {(s.durationMs / 1000).toFixed(2)}s</span>
                      <span className="text-slate-400">{s.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2 pr-4">Session ID</th>
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Credits</th>
                      <th className="py-2 pr-4">Latency</th>
                      <th className="py-2 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {safeSessions.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5 pr-4 font-mono text-slate-800">{s.id}</td>
                        <td className="py-2.5 pr-4 font-semibold">{s.productName}</td>
                        <td className="py-2.5 pr-4">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="py-2.5 pr-4 font-bold">{s.creditsUsed}</td>
                        <td className="py-2.5 pr-4 text-slate-500">{(s.durationMs / 1000).toFixed(2)}s</td>
                        <td className="py-2.5 text-right text-slate-500">{s.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        )}

        {(tab === 'overview' || tab === 'plan') && (
          <SectionCard
            title="Subscription Tiers"
            subtitle="Compare monthly SaaS allowances for catalogs, staff seats, and Virtual Try-On compute."
          >
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <p>
                Live card charging requires connecting Stripe Billing / SSLCommerz SaaS checkout webhooks via the platform super-admin gateway. Selecting a plan here updates your workspace preview tier.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((pl) => {
                const active = profile.plan === pl.id;
                return (
                  <div
                    key={pl.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 ${
                      active ? 'border-slate-950 bg-slate-50/80 ring-1 ring-slate-950' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                          {pl.id}
                        </span>
                        {active && <StatusBadge status="ACTIVE" />}
                      </div>
                      <p className="text-2xl font-extrabold text-slate-950">
                        ${pl.priceMonthly}
                        <span className="text-xs font-medium text-slate-500">/mo</span>
                      </p>
                      <p className="text-xs font-semibold text-slate-700">
                        {pl.quotaMax.toLocaleString()} AI Try-Ons • {pl.seats}
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {pl.features.map((f) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      variant={active ? 'outline' : 'default'}
                      size="sm"
                      disabled={active || !canManageBilling}
                      onClick={() => setConfirmPlan(pl)}
                      className="w-full"
                    >
                      {active ? 'Current Plan' : `Switch to ${pl.id}`}
                    </Button>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {(tab === 'overview' || tab === 'invoices') && (
          <SectionCard title="Billing Invoices" subtitle="Monthly SaaS subscription and credit pack receipts.">
            <div className="sm:hidden space-y-2.5 text-xs">
              {safeInvoices.map((inv) => (
                <div key={inv.id} className="rounded-xl border border-slate-200 p-3 bg-white space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-slate-900 break-all">{inv.id}</p>
                      <p className="text-[11px] text-slate-500">{inv.period} · {inv.plan}</p>
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                      <p className="font-extrabold text-slate-950 tabular-nums">${inv.amount.toFixed(2)}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadInvoiceText(inv)}
                      className="h-8 px-3 gap-1.5 text-xs w-full sm:w-auto"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Receipt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 pr-4">Invoice ID</th>
                    <th className="py-2.5 pr-4">Period</th>
                    <th className="py-2.5 pr-4">Plan</th>
                    <th className="py-2.5 pr-4">Amount</th>
                    <th className="py-2.5 pr-4">Status</th>
                    <th className="py-2.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 pr-4 font-mono font-bold text-slate-900">{inv.id}</td>
                      <td className="py-3 pr-4">{inv.period}</td>
                      <td className="py-3 pr-4">{inv.plan}</td>
                      <td className="py-3 pr-4 font-bold">${inv.amount.toFixed(2)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadInvoiceText(inv)}
                          className="h-7 px-2.5 gap-1 text-xs"
                        >
                          <Download className="w-3 h-3" /> Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {tab === 'payment-methods' && (
          <SectionCard
            title="Payment Methods on File"
            subtitle="Configured SaaS billing methods for automatic plan renewal."
          >
            <div className="rounded-xl border border-slate-200 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-900">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Corporate Visa •••• 4242 (Default)</p>
                  <p className="text-slate-500">Expires 09/2029 • Billing contact: {profile.email}</p>
                </div>
              </div>
              <StatusBadge status="ACTIVE" />
            </div>
          </SectionCard>
        )}

        <ConfirmDialog
          open={Boolean(confirmPlan)}
          title={`Switch Workspace Plan to ${confirmPlan?.id}?`}
          description={`Updates preview quota entitlement to ${confirmPlan?.quotaMax.toLocaleString()} monthly try-on credits ($${confirmPlan?.priceMonthly}/mo).`}
          destructive={false}
          confirmLabel={`Switch to ${confirmPlan?.id}`}
          onConfirm={() => {
            if (confirmPlan) {
              updateProfile({ plan: confirmPlan.id, quotaMax: confirmPlan.quotaMax });
              showToast(`Updated workspace tier to ${confirmPlan.id}.`);
            }
            setConfirmPlan(null);
          }}
          onCancel={() => setConfirmPlan(null)}
        />
      </div>
    </PermissionGate>
  );
}

