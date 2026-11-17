'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Plus, Webhook } from 'lucide-react';
import {
  brandWorkspaceApi,
  type ApiKeyInfo,
  type ApiScope,
  type WebhookDelivery,
  type WebhookEvent,
  type WebhookInfo,
} from '../../services/brandService';
import { BRAND_API_URL } from '../../lib/api';
import { useUiStore } from '../../stores/useUiStore';
import { ConfirmDialog, ErrorBanner, PageHeader, PermissionGate, SectionCard } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10';

const SCOPE_LABELS: Record<ApiScope, { title: string; help: string }> = {
  'products:read': { title: 'Read products', help: 'See your catalog and stock levels' },
  'products:write': { title: 'Change stock', help: 'Add or remove stock for a size' },
  'orders:read': { title: 'Read orders', help: 'See orders and customer delivery details' },
  'orders:write': { title: 'Update orders', help: 'Mark orders as shipped, delivered or cancelled' },
};

const EVENT_LABELS: Record<WebhookEvent, string> = {
  'order.created': 'A new order is placed',
  'order.status_changed': "An order's status changes",
  'inventory.low_stock': 'Stock runs low (5 or fewer)',
};

const when = (ms: number | null) => (ms ? new Date(ms).toLocaleString() : 'Never');

/** Shown once, right after something secret was created. */
function SecretPanel({ title, value, onDone }: { title: string; value: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3">
      <p className="text-sm font-bold text-amber-950">{title}</p>
      <p className="text-xs text-amber-900">Copy it now and keep it somewhere safe. For your security we cannot show it again.</p>
      <div className="flex items-center gap-2">
        <input readOnly value={value} aria-label={title} onFocus={(e) => e.currentTarget.select()} className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-amber-300 bg-white font-mono text-xs" />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
            } catch {
              /* the field is selectable */
            }
          }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <Button type="button" size="sm" onClick={onDone}>
        I have saved it
      </Button>
    </div>
  );
}

export function DeveloperView() {
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);
  const notify = (m: string) => {
    showToast(m);
    setTimeout(hideToast, 3500);
  };

  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [scopes, setScopes] = useState<ApiScope[]>([]);
  const [hooks, setHooks] = useState<WebhookInfo[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // keys
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyScopes, setKeyScopes] = useState<ApiScope[]>(['products:read']);
  const [keyExpiry, setKeyExpiry] = useState<string>('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [toRevoke, setToRevoke] = useState<ApiKeyInfo | null>(null);

  // webhooks
  const [showHookForm, setShowHookForm] = useState(false);
  const [hookUrl, setHookUrl] = useState('');
  const [hookEvents, setHookEvents] = useState<WebhookEvent[]>(['order.created']);
  const [hookNote, setHookNote] = useState('');
  const [hookError, setHookError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<WebhookInfo | null>(null);
  const [toRoll, setToRoll] = useState<WebhookInfo | null>(null);
  const [testResult, setTestResult] = useState<Record<string, WebhookDelivery>>({});
  const [openLog, setOpenLog] = useState<string | null>(null);
  const [log, setLog] = useState<WebhookDelivery[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [k, w] = await Promise.all([brandWorkspaceApi.getApiKeys(), brandWorkspaceApi.getWebhooks()]);
      setKeys(k.keys);
      setScopes(k.scopes);
      setHooks(w.webhooks);
      setEvents(w.events);
    } catch (e: any) {
      setError(e?.message || 'Could not load your developer settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    if (keyName.trim().length < 3) return setKeyError('Give the key a name of at least 3 characters, such as "Warehouse system".');
    if (keyScopes.length === 0) return setKeyError('Choose at least one permission.');
    setBusy('key');
    try {
      const res = await brandWorkspaceApi.createApiKey({ name: keyName.trim(), scopes: keyScopes, expiresInDays: keyExpiry ? Number(keyExpiry) : null });
      setNewKey(res.key);
      setKeyName('');
      setKeyExpiry('');
      setShowKeyForm(false);
      await load();
    } catch (err: any) {
      setKeyError(err?.issues?.[0]?.message || err?.message || 'Could not create the key.');
    } finally {
      setBusy(null);
    }
  };

  const revoke = async () => {
    const k = toRevoke;
    setToRevoke(null);
    if (!k) return;
    try {
      await brandWorkspaceApi.revokeApiKey(k.id);
      notify(`"${k.name}" can no longer be used.`);
    } catch (e: any) {
      notify(e?.message || 'Could not revoke the key.');
    }
    await load();
  };

  const createHook = async (e: React.FormEvent) => {
    e.preventDefault();
    setHookError(null);
    if (!/^https?:\/\//i.test(hookUrl.trim())) return setHookError('Enter the full address, starting with https://');
    if (hookEvents.length === 0) return setHookError('Choose at least one thing to be told about.');
    setBusy('hook');
    try {
      const res = await brandWorkspaceApi.createWebhook({ url: hookUrl.trim(), events: hookEvents, description: hookNote.trim() || undefined });
      setNewSecret(res.secret);
      setHookUrl('');
      setHookNote('');
      setShowHookForm(false);
      await load();
    } catch (err: any) {
      setHookError(err?.message || 'Could not add the address.');
    } finally {
      setBusy(null);
    }
  };

  const test = async (h: WebhookInfo) => {
    setBusy(h.id);
    try {
      const res = await brandWorkspaceApi.testWebhook(h.id);
      setTestResult((r) => ({ ...r, [h.id]: res.delivery }));
    } catch (e: any) {
      notify(e?.message || 'Could not send the test.');
    } finally {
      setBusy(null);
      await load();
    }
  };

  const setActive = async (h: WebhookInfo, active: boolean) => {
    try {
      await brandWorkspaceApi.updateWebhook(h.id, { active });
    } catch (e: any) {
      notify(e?.message || 'Could not change that address.');
    }
    await load();
  };

  const roll = async () => {
    const h = toRoll;
    setToRoll(null);
    if (!h) return;
    try {
      const res = await brandWorkspaceApi.rotateWebhookSecret(h.id);
      setNewSecret(res.secret);
    } catch (e: any) {
      notify(e?.message || 'Could not create a new secret.');
    }
  };

  const removeHook = async () => {
    const h = toDelete;
    setToDelete(null);
    if (!h) return;
    try {
      await brandWorkspaceApi.deleteWebhook(h.id);
      notify('Address removed.');
    } catch (e: any) {
      notify(e?.message || 'Could not remove that address.');
    }
    await load();
  };

  const showLog = async (h: WebhookInfo) => {
    if (openLog === h.id) return setOpenLog(null);
    setOpenLog(h.id);
    try {
      setLog(await brandWorkspaceApi.getWebhookDeliveries(h.id));
    } catch {
      setLog([]);
    }
  };

  return (
    <PermissionGate module="integrations" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Developers"
          title="API keys and webhooks"
          subtitle="Connect your own software: read your products and orders, and get told the moment something happens."
        />

        {error && <ErrorBanner message={error} onRetry={() => void load()} />}

        {/* ---------------- API keys ---------------- */}
        <SectionCard
          title="API keys"
          subtitle="A key lets another program use your shop, only for the things you tick. Treat it like a password."
          right={
            <Button type="button" size="sm" className="h-10 gap-1.5" onClick={() => setShowKeyForm((v) => !v)}>
              <Plus className="w-4 h-4" /> {showKeyForm ? 'Close' : 'Create key'}
            </Button>
          }
        >
          {newKey && <SecretPanel title="Your new API key" value={newKey} onDone={() => setNewKey(null)} />}

          {showKeyForm && (
            <form onSubmit={createKey} className="space-y-4 max-w-2xl rounded-xl border border-slate-200 p-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold text-slate-700">Name</span>
                <input value={keyName} onChange={(e) => setKeyName(e.target.value)} maxLength={60} placeholder="e.g. Warehouse system" className={INPUT} />
              </label>
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-slate-700 mb-1">What this key may do</legend>
                {scopes.map((sc) => (
                  <label key={sc} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer text-sm">
                    <input type="checkbox" checked={keyScopes.includes(sc)} onChange={() => setKeyScopes((l) => toggle(l, sc))} className="mt-1 h-4 w-4 accent-slate-950" />
                    <span>
                      <span className="block font-semibold text-slate-950">{SCOPE_LABELS[sc].title}</span>
                      <span className="block text-xs text-slate-500">{SCOPE_LABELS[sc].help}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <label className="block space-y-1.5 text-sm max-w-xs">
                <span className="font-semibold text-slate-700">Stops working after</span>
                <select value={keyExpiry} onChange={(e) => setKeyExpiry(e.target.value)} className={INPUT}>
                  <option value="">Never (until I revoke it)</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
              </label>
              {keyError && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
                  {keyError}
                </p>
              )}
              <Button type="submit" disabled={busy === 'key'} className="h-10">
                {busy === 'key' ? 'Creating...' : 'Create key'}
              </Button>
            </form>
          )}

          {loading ? (
            <p className="py-6 text-sm text-slate-500">Loading...</p>
          ) : keys.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              <KeyRound className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No keys yet. Create one when you want another program to use your shop.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {keys.map((k) => (
                <li key={k.id} className="flex flex-wrap items-center gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950 flex items-center gap-2 flex-wrap">
                      {k.name}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${k.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {k.status === 'ACTIVE' ? 'Active' : k.status === 'EXPIRED' ? 'Expired' : 'Revoked'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 font-mono">{k.display}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {k.scopes.map((sc) => SCOPE_LABELS[sc].title).join(' · ')} &middot; created {new Date(k.createdAt).toLocaleDateString()} &middot; last used {when(k.lastUsedAt)}
                      {k.expiresAt ? ` · expires ${new Date(k.expiresAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  {k.status === 'ACTIVE' && (
                    <Button type="button" size="sm" variant="outline" onClick={() => setToRevoke(k)}>
                      Revoke
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* ---------------- webhooks ---------------- */}
        <SectionCard
          title="Webhooks"
          subtitle="We send a message to your server when something happens, so you do not have to keep asking."
          right={
            <Button type="button" size="sm" className="h-10 gap-1.5" onClick={() => setShowHookForm((v) => !v)}>
              <Plus className="w-4 h-4" /> {showHookForm ? 'Close' : 'Add address'}
            </Button>
          }
        >
          {newSecret && <SecretPanel title="Your signing secret" value={newSecret} onDone={() => setNewSecret(null)} />}

          {showHookForm && (
            <form onSubmit={createHook} className="space-y-4 max-w-2xl rounded-xl border border-slate-200 p-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold text-slate-700">Your server address</span>
                <input value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} placeholder="https://example.com/vtry-webhook" className={INPUT} />
              </label>
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-slate-700 mb-1">Tell me when</legend>
                {events.map((ev) => (
                  <label key={ev} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer text-sm">
                    <input type="checkbox" checked={hookEvents.includes(ev)} onChange={() => setHookEvents((l) => toggle(l, ev))} className="h-4 w-4 accent-slate-950" />
                    <span className="font-semibold text-slate-950">{EVENT_LABELS[ev]}</span>
                  </label>
                ))}
              </fieldset>
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold text-slate-700">Note for yourself (optional)</span>
                <input value={hookNote} onChange={(e) => setHookNote(e.target.value)} maxLength={120} className={INPUT} />
              </label>
              {hookError && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
                  {hookError}
                </p>
              )}
              <Button type="submit" disabled={busy === 'hook'} className="h-10">
                {busy === 'hook' ? 'Adding...' : 'Add address'}
              </Button>
            </form>
          )}

          {loading ? null : hooks.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              <Webhook className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No addresses yet. Add the address of your server to start receiving events.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {hooks.map((h) => {
                const t = testResult[h.id];
                return (
                  <li key={h.id} className="py-4 space-y-2.5">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-950 break-all">{h.url}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {h.events.map((ev) => EVENT_LABELS[ev]).join(' · ')}
                          {h.description ? ` · ${h.description}` : ''}
                        </p>
                        <p className="text-xs mt-1">
                          {!h.active ? (
                            <span className="font-semibold text-amber-800">Off{h.disabledReason ? `. ${h.disabledReason}` : ''}</span>
                          ) : h.lastStatus === 'FAILED' ? (
                            <span className="font-semibold text-rose-700">Last delivery failed ({when(h.lastDeliveryAt)})</span>
                          ) : h.lastStatus === 'SUCCESS' ? (
                            <span className="font-semibold text-emerald-700">Working. Last delivery {when(h.lastDeliveryAt)}</span>
                          ) : (
                            <span className="text-slate-500">Nothing sent yet</span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" size="sm" variant="outline" disabled={busy === h.id} onClick={() => void test(h)}>
                          {busy === h.id ? 'Sending...' : 'Send test'}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => void showLog(h)}>
                          {openLog === h.id ? 'Hide history' : 'History'}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => void setActive(h, !h.active)}>
                          {h.active ? 'Turn off' : 'Turn on'}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setToRoll(h)}>
                          New secret
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setToDelete(h)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                    {t && (
                      <p role="status" className={`text-xs rounded-lg px-3 py-2 ${t.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                        {t.ok ? `Test delivered. Your server answered ${t.httpStatus} in ${t.durationMs} ms.` : `Test failed: ${t.error || 'no answer'}.`}
                      </p>
                    )}
                    {openLog === h.id && (
                      <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                        {log.length === 0 ? (
                          <p className="p-3 text-slate-500">No deliveries yet since the server last started.</p>
                        ) : (
                          log.slice(0, 10).map((d) => (
                            <div key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
                              <span className={`font-bold ${d.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{d.ok ? 'Delivered' : 'Failed'}</span>
                              <span className="font-mono">{d.type}</span>
                              <span className="text-slate-500">attempt {d.attempt}</span>
                              <span className="text-slate-500">{d.httpStatus ?? 'no answer'} &middot; {d.durationMs} ms</span>
                              <span className="text-slate-400 ml-auto">{new Date(d.at).toLocaleString()}</span>
                              {d.error && <span className="basis-full text-rose-700">{d.error}</span>}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {/* ---------------- how to use ---------------- */}
        <SectionCard title="How to use them" subtitle="A short guide for whoever builds the connection.">
          <div className="space-y-5 text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-950 mb-1.5">Use an API key</p>
              <p className="text-xs text-slate-500 mb-2">Send it in the X-API-Key header. Each key only ever sees your own shop.</p>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 overflow-x-auto font-mono text-[11px] leading-relaxed">{`curl ${BRAND_API_URL}/api/v1/public/orders \\
  -H "X-API-Key: vtry_live_..."`}</pre>
              <p className="text-xs text-slate-500 mt-2">
                Available: <code>GET /api/v1/public/products</code>, <code>GET /api/v1/public/orders</code>, <code>PATCH /api/v1/public/orders/:id/status</code>, <code>POST /api/v1/public/inventory/adjust</code>. Up to 120 requests a minute per key.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-950 mb-1.5">Check that a webhook really came from us</p>
              <p className="text-xs text-slate-500 mb-2">
                Every message has an <code>X-VTRY-Signature</code> header like <code>t=1700000000,v1=abc...</code>. Recompute it with your signing secret and reject the message if it differs, or if the time is more than a few minutes old.
              </p>
              <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 overflow-x-auto font-mono text-[11px] leading-relaxed">{`const [t, v1] = header.match(/t=(\\d+),v1=([0-9a-f]+)/).slice(1);
const expected = crypto
  .createHmac('sha256', SIGNING_SECRET)
  .update(t + '.' + rawBody)
  .digest('hex');
const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));`}</pre>
              <p className="text-xs text-slate-500 mt-2">If your server does not answer with a 2xx status we try again twice. An address that fails 10 times in a row is switched off.</p>
            </div>
          </div>
        </SectionCard>

        <ConfirmDialog
          open={Boolean(toRevoke)}
          title={`Revoke "${toRevoke?.name}"?`}
          description="Anything using this key stops working straight away. This cannot be undone."
          confirmLabel="Revoke key"
          onConfirm={() => void revoke()}
          onCancel={() => setToRevoke(null)}
        />
        <ConfirmDialog
          open={Boolean(toDelete)}
          title="Delete this address?"
          description={`We will stop sending events to ${toDelete?.url}.`}
          confirmLabel="Delete"
          onConfirm={() => void removeHook()}
          onCancel={() => setToDelete(null)}
        />
        <ConfirmDialog
          open={Boolean(toRoll)}
          title="Create a new signing secret?"
          description="The old secret stops working at once, so update your server with the new one straight away."
          confirmLabel="Create new secret"
          destructive={false}
          onConfirm={() => void roll()}
          onCancel={() => setToRoll(null)}
        />
      </div>
    </PermissionGate>
  );
}
