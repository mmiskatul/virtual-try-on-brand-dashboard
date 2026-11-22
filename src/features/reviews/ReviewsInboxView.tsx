'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { brandWorkspaceApi, type BrandReview } from '../../services/brandService';
import { useUiStore } from '../../stores/useUiStore';
import { ErrorBanner, PageHeader, PermissionGate, SectionCard } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10';

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-4 h-4 ${i <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      ))}
    </span>
  );
}

export function ReviewsInboxView() {
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);
  const notify = (m: string) => {
    showToast(m);
    setTimeout(hideToast, 3500);
  };

  const [reviews, setReviews] = useState<BrandReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'low'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReviews(await brandWorkspaceApi.getBrandReviews());
    } catch (e: any) {
      setError(e?.message || 'Could not load your reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unanswered = useMemo(() => reviews.filter((r) => !r.brandReply), [reviews]);
  const lowRated = useMemo(() => reviews.filter((r) => r.rating <= 2), [reviews]);
  const visible = filter === 'unanswered' ? unanswered : filter === 'low' ? lowRated : reviews;
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const perStar = useMemo(() => [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length })), [reviews]);

  const sendReply = async (id: string) => {
    const text = draft.trim();
    if (text.length < 2) return notify('Please write a reply first.');
    setSending(true);
    try {
      await brandWorkspaceApi.replyToReview(id, text);
      notify('Reply published.');
      setOpenId(null);
      setDraft('');
      await load();
    } catch (e: any) {
      notify(e?.message || 'Could not send your reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <PermissionGate module="customers" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Customers"
          title="Reviews"
          subtitle={
            reviews.length
              ? `${reviews.length} review${reviews.length === 1 ? '' : 's'} • average ${average.toFixed(1)} out of 5 • ${unanswered.length} waiting for your reply`
              : 'What customers say about your products.'
          }
          actions={
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm font-semibold" role="group" aria-label="Filter reviews">
              {(['all', 'unanswered', 'low'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`px-4 py-2 ${filter === f ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {f === 'all' ? 'All' : f === 'unanswered' ? `Needs reply (${unanswered.length})` : `1-2 stars (${lowRated.length})`}
                </button>
              ))}
            </div>
          }
        />

        {error && <ErrorBanner message={error} onRetry={() => void load()} />}

        {reviews.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">Average rating</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">{average.toFixed(1)}<span className="text-base font-bold text-slate-400"> / 5</span></p>
              <div className="mt-1"><Stars value={Math.round(average)} /></div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">Waiting for your reply</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">{unanswered.length}</p>
              <p className="mt-1 text-[11px] text-slate-500">{unanswered.length === 0 ? 'All caught up' : 'Replying builds trust'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
              <p className="mb-2 text-xs font-semibold text-slate-500">How customers rated you</p>
              <div className="space-y-1.5">
                {perStar.map(({ n, count }) => (
                  <div key={n} className="flex items-center gap-2 text-[11px]">
                    <span className="w-8 text-slate-500">{n} star</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} />
                    </div>
                    <span className="w-6 text-right tabular-nums text-slate-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <SectionCard>
          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading reviews">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : visible.length === 0 && !error ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              {filter === 'unanswered' ? 'You have replied to every review.' : filter === 'low' ? 'No low-rated reviews. Great news.' : 'No reviews yet. They will show up here when customers rate your products.'}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visible.map((r) => (
                <li key={r.id} className="py-5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Stars value={r.rating} />
                      <span className="text-sm font-semibold text-slate-950 truncate">{r.authorName}</span>
                      {r.verifiedBuy && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Verified buyer
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-500">on {r.productName}</p>
                  <p className="text-sm text-slate-800 leading-relaxed">{r.comment}</p>

                  {r.brandReply ? (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-sm">
                      <p className="text-xs font-bold text-slate-500 mb-1">Your reply</p>
                      <p className="text-slate-800">{r.brandReply}</p>
                    </div>
                  ) : openId === r.id ? (
                    <div className="space-y-2.5">
                      <textarea
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Thank them, or help with their problem..."
                        className={INPUT}
                      />
                      <div className="flex gap-2">
                        <Button type="button" size="sm" disabled={sending} onClick={() => void sendReply(r.id)}>
                          {sending ? 'Sending...' : 'Publish reply'}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => { setOpenId(null); setDraft(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => { setOpenId(r.id); setDraft(''); }}>
                      Reply
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </PermissionGate>
  );
}
