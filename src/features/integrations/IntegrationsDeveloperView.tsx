'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BarChart3,
  Check,
  Copy,
  CreditCard,
  KeyRound,
  Plug,
  Plus,
  Trash2,
  Truck,
  Webhook,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { useMounted } from '../../hooks/useMounted';
import {
  ConfirmDialog,
  EmptyState,
  PageHeader,
  PermissionGate,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { canPerform } from '../../config/permissions';

export type IntegrationsTab =
  | 'overview'
  | 'payments'
  | 'shipping'
  | 'analytics'
  | 'api'
  | 'webhooks';

const INT_TABS: Array<{ id: IntegrationsTab; label: string; href: string }> = [
  { id: 'overview', label: 'Integrations Hub', href: '/dashboard/integrations' },
  { id: 'payments', label: 'Payment Gateways', href: '/dashboard/integrations/payments' },
  { id: 'shipping', label: 'Shipping Providers', href: '/dashboard/integrations/shipping' },
  { id: 'analytics', label: 'Analytics Pixels', href: '/dashboard/integrations/analytics' },
  { id: 'api', label: 'API Credentials', href: '/dashboard/developer/api' },
  { id: 'webhooks', label: 'Webhooks', href: '/dashboard/developer/webhooks' },
];

const WEBHOOK_EVENTS = [
  'order.created',
  'order.status_updated',
  'product.published',
  'inventory.low_stock',
  'tryon.completed',
];

export function IntegrationsDeveloperView({
  initialTab = 'overview',
}: {
  initialTab?: IntegrationsTab;
}) {
  const mounted = useMounted();
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const apiKeys = useWorkspaceStore((s) => s.apiKeys);
  const webhooks = useWorkspaceStore((s) => s.webhooks);
  const createApiKey = useWorkspaceStore((s) => s.createApiKey);
  const revokeApiKey = useWorkspaceStore((s) => s.revokeApiKey);
  const addWebhook = useWorkspaceStore((s) => s.addWebhook);
  const removeWebhook = useWorkspaceStore((s) => s.removeWebhook);
  const recordAudit = useWorkspaceStore((s) => s.recordAudit);
  const showToast = useUiStore((s) => s.showToast);

  const [tab, setTab] = useState<IntegrationsTab>(initialTab);
  const [keyName, setKeyName] = useState('');
  const [revealedSecretOnce, setRevealedSecretOnce] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  const [whUrl, setWhUrl] = useState('');
  const [whEvents, setWhEvents] = useState<string[]>(['order.created', 'tryon.completed']);

  const [gateways, setGateways] = useState<Record<string, boolean>>({
    SSLCommerz: true,
    bKash: true,
    Nagad: false,
    Stripe: false,
    CashOnDelivery: true,
  });
  const [couriers, setCouriers] = useState<Record<string, boolean>>({
    Pathao: true,
    Steadfast: true,
    RedX: false,
    DHL: false,
  });
  const [pixels, setPixels] = useState({
    metaPixelId: '',
    ga4MeasurementId: '',
    tiktokPixelId: '',
  });

  const canManage = canPerform(activeRole, 'integrations', 'manage_settings', roleOverrides);
  const safeKeys = mounted ? apiKeys : [];
  const safeWebhooks = mounted ? webhooks : [];

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    const { rawSecret } = createApiKey(keyName.trim());
    setRevealedSecretOnce(rawSecret);
    setCopiedSecret(false);
    setKeyName('');
    showToast('Issued new merchant API credential. Copy the secret now.');
  };

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whUrl.trim() || whEvents.length === 0) return;
    addWebhook({ url: whUrl.trim(), events: whEvents, active: true });
    recordAudit('WEBHOOK_CREATED', whUrl.trim(), `Subscribed events: ${whEvents.join(', ')}`);
    showToast('Registered webhook endpoint.');
    setWhUrl('');
  };

  return (
    <PermissionGate module="integrations" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Ecosystem & Developer API"
          title="Integrations, API Keys & Webhooks"
          subtitle="Connect merchant payment gateways, courier providers, pixel tracking, and scoped API credentials."
        />

        <div className="flex flex-wrap gap-2">
          {INT_TABS.map((t) => (
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

        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SectionCard title="Payment Gateways" subtitle="bKash, Nagad, SSLCommerz, Stripe, COD">
              <p className="text-xs text-slate-600">
                {Object.values(gateways).filter(Boolean).length} gateway(s) enabled on checkout.
              </p>
              <Link href="/dashboard/integrations/payments">
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Configure Payments
                </Button>
              </Link>
            </SectionCard>

            <SectionCard title="Courier Logistics" subtitle="Pathao, Steadfast, RedX, DHL">
              <p className="text-xs text-slate-600">
                {Object.values(couriers).filter(Boolean).length} courier partner(s) enabled.
              </p>
              <Link href="/dashboard/integrations/shipping">
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Configure Shipping
                </Button>
              </Link>
            </SectionCard>

            <SectionCard title="Developer API & Webhooks" subtitle="Headless storefront & ERP sync">
              <p className="text-xs text-slate-600">
                {safeKeys.filter((k) => k.status === 'ACTIVE').length} active API key(s) •{' '}
                {safeWebhooks.length} webhook(s)
              </p>
              <Link href="/dashboard/developer/api">
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Manage API Keys
                </Button>
              </Link>
            </SectionCard>
          </div>
        )}

        {(tab === 'overview' || tab === 'payments') && (
          <SectionCard
            title="Payment Gateways"
            subtitle="Enable payment rails available exclusively to your tenant checkout."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {Object.entries(gateways).map(([name, enabled]) => (
                <div key={name} className="p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{name}</p>
                    <p className="text-slate-500">{enabled ? 'Enabled in checkout' : 'Disabled'}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={enabled ? 'default' : 'outline'}
                    disabled={!canManage}
                    onClick={() => {
                      setGateways((prev) => ({ ...prev, [name]: !enabled }));
                      showToast(`${name} ${!enabled ? 'enabled' : 'disabled'}.`);
                    }}
                  >
                    {enabled ? 'Enabled' : 'Enable'}
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {(tab === 'overview' || tab === 'shipping') && (
          <SectionCard
            title="Shipping & Courier Providers"
            subtitle="Configure domestic and international carrier booking adapters."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {Object.entries(couriers).map(([name, enabled]) => (
                <div key={name} className="p-3.5 sm:p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{name}</p>
                    <p className="text-slate-500">{enabled ? 'Active carrier' : 'Inactive'}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={enabled ? 'default' : 'outline'}
                    disabled={!canManage}
                    onClick={() => {
                      setCouriers((prev) => ({ ...prev, [name]: !enabled }));
                      showToast(`${name} carrier toggled.`);
                    }}
                  >
                    {enabled ? 'On' : 'Off'}
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {tab === 'analytics' && (
          <SectionCard
            title="Storefront Marketing & Analytics Pixels"
            subtitle="Attach GA4, Meta Pixel, or TikTok tracking IDs to your public brand storefront."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <label className="block space-y-1">
                <span className="font-semibold text-slate-700">Google Analytics 4 ID</span>
                <input
                  value={pixels.ga4MeasurementId}
                  onChange={(e) => setPixels({ ...pixels, ga4MeasurementId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-slate-700">Meta / Facebook Pixel ID</span>
                <input
                  value={pixels.metaPixelId}
                  onChange={(e) => setPixels({ ...pixels, metaPixelId: e.target.value })}
                  placeholder="123456789012345"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-semibold text-slate-700">TikTok Pixel ID</span>
                <input
                  value={pixels.tiktokPixelId}
                  onChange={(e) => setPixels({ ...pixels, tiktokPixelId: e.target.value })}
                  placeholder="CXXXXXXXXXXXXXXX"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono"
                />
              </label>
            </div>
            <Button
              size="sm"
              disabled={!canManage}
              onClick={() => {
                recordAudit('PIXELS_UPDATED', 'Storefront Tracking', 'Saved analytics pixel identifiers');
                showToast('Saved analytics pixel settings.');
              }}
            >
              Save Pixel Configuration
            </Button>
          </SectionCard>
        )}

        {(tab === 'overview' || tab === 'api') && (
          <SectionCard
            title="Developer API Keys"
            subtitle="Keys are tenant-scoped. Full secret tokens are revealed ONLY once at creation and masked permanently thereafter."
          >
            {revealedSecretOnce && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 space-y-2 text-xs text-emerald-950">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold">Copy Your New API Secret Key Now</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard?.writeText(revealedSecretOnce);
                      setCopiedSecret(true);
                    }}
                    className="h-7 gap-1 text-xs bg-white"
                  >
                    {copiedSecret ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedSecret ? 'Copied' : 'Copy Secret'}
                  </Button>
                </div>
                <p className="font-mono break-all bg-white/90 px-3 py-2 rounded-lg border border-emerald-200">
                  {revealedSecretOnce}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-emerald-800">
                    For security, once dismissed this raw secret cannot be displayed again.
                  </span>
                  <button
                    type="button"
                    onClick={() => setRevealedSecretOnce(null)}
                    className="font-bold underline text-[11px]"
                  >
                    I have stored it safely
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-2 text-xs">
              <input
                required
                disabled={!canManage}
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Key name (e.g. ERP Production Sync)"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
              />
              <Button type="submit" disabled={!canManage} size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Generate API Key
              </Button>
            </form>

            {safeKeys.length === 0 ? (
              <EmptyState title="No API keys generated" description="Create a credential to integrate external inventory or ERP systems." />
            ) : (
              <>
                <div className="sm:hidden space-y-2.5 text-xs">
                  {safeKeys.map((k) => (
                    <div key={k.id} className="rounded-xl border border-slate-200 p-3 bg-white space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 break-words">{k.name}</p>
                          <p className="font-mono text-[11px] text-slate-600 break-all">{k.publicPrefix}</p>
                        </div>
                        <StatusBadge status={k.status} />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span>{k.rateLimitPerMin} req/min · Used {k.lastUsedAt}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canManage || k.status === 'REVOKED'}
                          onClick={() => setConfirmRevokeId(k.id)}
                          className="h-7 px-2.5 text-[11px] text-rose-700"
                        >
                          {k.status === 'REVOKED' ? 'Revoked' : 'Revoke'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5 pr-4">Name</th>
                        <th className="py-2.5 pr-4">Masked Key</th>
                        <th className="py-2.5 pr-4">Rate Limit</th>
                        <th className="py-2.5 pr-4">Last Used</th>
                        <th className="py-2.5 pr-4">Status</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {safeKeys.map((k) => (
                        <tr key={k.id}>
                          <td className="py-3 pr-4 font-bold text-slate-900">{k.name}</td>
                          <td className="py-3 pr-4 font-mono text-slate-600">{k.publicPrefix}</td>
                          <td className="py-3 pr-4">{k.rateLimitPerMin} req/min</td>
                          <td className="py-3 pr-4 text-slate-500">{k.lastUsedAt}</td>
                          <td className="py-3 pr-4">
                            <StatusBadge status={k.status} />
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!canManage || k.status === 'REVOKED'}
                              onClick={() => setConfirmRevokeId(k.id)}
                              className="h-7 px-2.5 text-[11px] text-rose-700"
                            >
                              {k.status === 'REVOKED' ? 'Revoked' : 'Revoke'}
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
        )}

        {(tab === 'overview' || tab === 'webhooks') && (
          <SectionCard
            title="Event Webhooks"
            subtitle="Receive real-time HTTPS callbacks when orders, publications, or try-on jobs occur."
          >
            <form onSubmit={handleAddWebhook} className="space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  required
                  disabled={!canManage}
                  value={whUrl}
                  onChange={(e) => setWhUrl(e.target.value)}
                  placeholder="https://api.yourstore.com/webhooks/vton"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 font-mono"
                />
                <Button type="submit" disabled={!canManage} size="sm" className="gap-1.5">
                  <Webhook className="w-3.5 h-3.5" /> Add Endpoint
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {WEBHOOK_EVENTS.map((ev) => {
                  const selected = whEvents.includes(ev);
                  return (
                    <button
                      key={ev}
                      type="button"
                      onClick={() =>
                        setWhEvents((prev) =>
                          prev.includes(ev) ? prev.filter((x) => x !== ev) : [...prev, ev]
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border ${
                        selected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {ev}
                    </button>
                  );
                })}
              </div>
            </form>

            <div className="space-y-2 text-xs pt-2">
              {safeWebhooks.map((w) => (
                <div key={w.id} className="p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono font-bold text-slate-900 break-all">{w.url}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Events: {w.events.join(', ')} • Last attempt: {w.lastDeliveryAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={w.lastDeliveryStatus} />
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canManage}
                      onClick={() => {
                        removeWebhook(w.id);
                        showToast('Removed webhook subscription.');
                      }}
                      className="text-rose-600 h-7 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        <ConfirmDialog
          open={Boolean(confirmRevokeId)}
          title="Revoke API Credential?"
          description="Any external ERP or integration using this secret will immediately lose API access."
          confirmLabel="Revoke Key"
          onConfirm={() => {
            if (confirmRevokeId) {
              revokeApiKey(confirmRevokeId);
              showToast('Revoked API key.');
            }
            setConfirmRevokeId(null);
          }}
          onCancel={() => setConfirmRevokeId(null)}
        />
      </div>
    </PermissionGate>
  );
}

