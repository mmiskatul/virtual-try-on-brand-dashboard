'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { useTryOnSessions } from '../../hooks/useTryOnSessions';
import { brandWorkspaceApi } from '../../services/brandService';
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

interface PlanCard {
  id: string;
  name: string;
  priceMonthly: number;
  quotaMax: number;
  seats: string;
  features: string[];
}

const FEATURE_LABELS: Record<string, string> = {
  max_products: 'products',
  monthly_tryons: 'AI try-ons per month',
  high_fidelity_vton: 'High-fidelity try-on model',
  api_webhooks: 'API & webhooks',
};

/** Turn a plan from the backend into a card. Prices and limits are never hard-coded here. */
function toPlanCard(plan: any): PlanCard {
  const entitlements: any[] = Array.isArray(plan?.entitlements) ? plan.entitlements : [];
  const quota = entitlements.find((e) => e.featureKey === 'monthly_tryons')?.limitValue ?? 0;
  const features = entitlements
    .filter((e) => e.state !== 'DISABLED')
    .map((e) =>
      e.state === 'LIMIT'
        ? `${Number(e.limitValue).toLocaleString()} ${FEATURE_LABELS[e.featureKey] || e.featureKey}`
        : FEATURE_LABELS[e.featureKey] || e.featureKey
    );
  return {
    id: String(plan?.slug || plan?.id || ''),
    name: String(plan?.name || plan?.slug || ''),
    priceMonthly: Number(plan?.monthlyPrice) || 0,
    quotaMax: Number(quota) || 0,
    seats: plan?.description || '',
    features,
  };
}

export function BillingCreditsView({
}: {
}) {
  const mounted = useMounted();
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const profile = useWorkspaceStore((s) => s.profile);
  const invoices = useWorkspaceStore((s) => s.invoices);
  const { sessions: tryOnSessions } = useTryOnSessions();
  const showToast = useUiStore((s) => s.showToast);

  const [confirmPlan, setConfirmPlan] = useState<PlanCard | null>(null);
  const [billing, setBilling] = useState<any | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    brandWorkspaceApi
      .getBillingSummary()
      .then((res) => {
        if (!cancelled) setBilling(res);
      })
      .catch((err: any) => {
        if (!cancelled) setBillingError(err?.message || 'Could not load billing details.');
      });
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  const plans = useMemo<PlanCard[]>(
    () => (Array.isArray(billing?.availablePlans) ? billing.availablePlans.map(toPlanCard) : []),
    [billing]
  );

  const canManageBilling = canPerform(activeRole, 'billing', 'manage_settings', roleOverrides);
  const safeInvoices = (mounted && Array.isArray(billing?.invoices) && billing.invoices.length > 0 ? billing.invoices : mounted ? invoices : []) as typeof invoices;
  const safeSessions = mounted ? tryOnSessions : [];

  const currentPlan: string = billing?.subscription?.plan || profile.plan;
  const quotaMax: number = billing?.subscription?.tryOnMonthlyQuota ?? profile.quotaMax;
  const quotaUsed: number = billing?.subscription?.tryOnUsed ?? profile.quotaUsed;
  const remaining: number = billing?.credits?.availableCredits ?? Math.max(0, quotaMax - quotaUsed);
  const productLimit: number | null = billing?.subscription?.productLimit ?? null;
  const pct = Math.min(100, Math.round((quotaUsed / Math.max(1, quotaMax)) * 100));
  const completedCredits = safeSessions
    .filter((s) => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.creditsUsed, 0);
  const failedRuns = safeSessions.filter((s) => s.status === 'FAILED').length;

  const downloadInvoiceText = (inv: typeof safeInvoices[number]) => {
    const content = [
      `INVOICE ${inv.id}`,
      `Brand: ${profile.name} (${profile.slug})`,
      `Plan: ${inv.plan}`,
      `Billing Period: ${inv.period}`,
      `Issued: ${inv.issuedAt}`,
      `Amount Paid: ৳${inv.amount.toFixed(2)}`,
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
          eyebrow="Billing"
          title="Plan & AI credits"
          subtitle="Your current plan, monthly try-on allowance and credits left."
        />

        {billingError && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
            {billingError}
          </p>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard label="Current plan" value={currentPlan} icon={<Zap className="w-4 h-4 text-amber-600" />} />
          <KpiCard label="Credits used this month" value={quotaUsed.toLocaleString()} icon={<Sparkles className="w-4 h-4" />} />
          <KpiCard label="Credits left" value={remaining.toLocaleString()} icon={<Coins className="w-4 h-4" />} />
          <KpiCard label="Product limit" value={productLimit === null ? '-' : productLimit.toLocaleString()} icon={<FileText className="w-4 h-4" />} />
        </div>

<section id="usage" className="scroll-mt-24">
          <SectionCard
            title="Try-ons this month"
            subtitle={`${quotaUsed.toLocaleString()} of ${quotaMax.toLocaleString()} credits used (${pct}%)`}
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
        </section>

<section id="plan" className="scroll-mt-24">
          <SectionCard
            title="Plans"
            subtitle="Compare what each plan includes."
          >
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <p>
                Online payment is not enabled yet. To change your plan, please contact support and we will switch it for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.length === 0 && (
                <p className="col-span-full text-sm text-slate-500 py-4">Plans are not available right now.</p>
              )}
              {plans.map((pl) => {
                const active = currentPlan === pl.id;
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
                          {pl.name}
                        </span>
                        {active && <StatusBadge status="ACTIVE" />}
                      </div>
                      <p className="text-2xl font-extrabold text-slate-950">
                        ৳{pl.priceMonthly}
                        <span className="text-xs font-medium text-slate-500">/mo</span>
                      </p>
                      <p className="text-xs font-semibold text-slate-700">
                        {pl.quotaMax.toLocaleString()} AI try-ons per month
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
                      {active ? 'Current plan' : `Switch to ${pl.name}`}
                    </Button>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </section>

<section id="invoices" className="scroll-mt-24">
          <SectionCard title="Invoices" subtitle="Your monthly plan and credit pack receipts.">
            <div className="sm:hidden space-y-2.5 text-xs">
              {safeInvoices.map((inv) => (
                <div key={inv.id} className="rounded-xl border border-slate-200 p-3 bg-white space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-slate-900 break-all">{inv.id}</p>
                      <p className="text-[11px] text-slate-500">{inv.period} · {inv.plan}</p>
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                      <p className="font-extrabold text-slate-950 tabular-nums">৳{inv.amount.toFixed(2)}</p>
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
                      <td className="py-3 pr-4 font-bold">৳{inv.amount.toFixed(2)}</td>
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
        </section>


        <ConfirmDialog
          open={Boolean(confirmPlan)}
          title={`Request a switch to ${confirmPlan?.name}?`}
          description={`Online payment is not enabled yet, so we will switch your plan for you. ${confirmPlan?.name} includes ${confirmPlan?.quotaMax.toLocaleString()} try-ons per month at ৳${confirmPlan?.priceMonthly}/month.`}
          destructive={false}
          confirmLabel="Send request"
          onConfirm={async () => {
            const target = confirmPlan;
            setConfirmPlan(null);
            if (!target) return;
            try {
              await brandWorkspaceApi.createSupportTicket({
                subject: `Plan change request: ${target.name}`,
                category: 'BILLING',
                priority: 'MEDIUM',
                message: `Please switch the brand "${profile.name}" from ${currentPlan} to ${target.id}.`,
              });
              showToast('Request sent. We will contact you to switch your plan.');
            } catch {
              showToast('Could not send your request. Please try again.');
            }
          }}
          onCancel={() => setConfirmPlan(null)}
        />
      </div>
    </PermissionGate>
  );
}

