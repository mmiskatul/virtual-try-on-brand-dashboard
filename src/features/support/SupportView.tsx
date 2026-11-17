'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import { brandWorkspaceApi, type SupportTicket } from '../../services/brandService';
import { useUiStore } from '../../stores/useUiStore';
import { ErrorBanner, PageHeader, SectionCard, StatusBadge } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10';

const CATEGORIES = [
  { value: 'GENERAL', label: 'General question' },
  { value: 'BILLING', label: 'Billing or plan' },
  { value: 'TECHNICAL', label: 'Something is not working' },
  { value: 'TRY_ON', label: 'Virtual try-on' },
];

export function SupportView({ initialSubject = '' }: { initialSubject?: string }) {
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);
  const notify = (m: string) => {
    showToast(m);
    setTimeout(hideToast, 3500);
  };

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState(initialSubject);
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await brandWorkspaceApi.getSupportTickets();
      setTickets([...list].sort((a: SupportTicket, b: SupportTicket) => Number(new Date(b.createdAt || 0)) - Number(new Date(a.createdAt || 0))));
    } catch (e: any) {
      setError(e?.message || 'Could not load your requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (subject.trim().length < 3) return setFormError('Please give your request a short title (at least 3 characters).');
    if (message.trim().length < 5) return setFormError('Please describe what you need (at least 5 characters).');
    setSending(true);
    try {
      await brandWorkspaceApi.createSupportTicket({ subject: subject.trim(), category, priority, message: message.trim() });
      setSubject('');
      setMessage('');
      notify('Request sent. We will reply by email.');
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Could not send your request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Help" title="Support" subtitle="Ask us anything about your shop, billing or virtual try-on. We reply by email." />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <SectionCard className="lg:col-span-2" title="New request">
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold text-slate-700">Title</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={255} placeholder="e.g. Switch my plan to Pro" className={INPUT} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold text-slate-700">Topic</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold text-slate-700">Urgency</span>
                <select value={priority} onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')} className={INPUT}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Normal</option>
                  <option value="HIGH">Urgent</option>
                </select>
              </label>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold text-slate-700">Details</span>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={3000} className={INPUT} />
            </label>
            {formError && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
                {formError}
              </p>
            )}
            <Button type="submit" disabled={sending} className="h-10 w-full">
              {sending ? 'Sending...' : 'Send request'}
            </Button>
          </form>
        </SectionCard>

        <SectionCard className="lg:col-span-3" title="Your requests">
          {error && <ErrorBanner message={error} onRetry={() => void load()} />}
          {loading ? (
            <p className="py-6 text-sm text-slate-500">Loading...</p>
          ) : tickets.length === 0 && !error ? (
            <div className="py-10 text-center text-sm text-slate-500">
              <LifeBuoy className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              You have not sent any requests yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <li key={t.id} className="py-3.5 space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{t.subject}</p>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {CATEGORIES.find((c) => c.value === t.category)?.label || t.category}
                    {t.createdAt ? <> &middot; {new Date(t.createdAt).toLocaleDateString()}</> : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
