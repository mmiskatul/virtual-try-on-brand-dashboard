'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FileClock } from 'lucide-react';
import { ConfirmDialog } from '../../components/shared/UiPrimitives';
import { deleteDraft, listDrafts, type ProductDraft } from '../../lib/draftStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

const TOTAL_STEPS = 5;

function savedAgo(timestamp: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Unfinished products kept in this browser. They are not in the store until the product is saved. */
export function DraftsPanel() {
  const profile = useWorkspaceStore((s) => s.profile);
  const tenantKey = profile.slug || profile.id || 'brand';
  const [drafts, setDrafts] = useState<ProductDraft[]>([]);
  const [discardId, setDiscardId] = useState<string | null>(null);

  const refresh = useCallback(async () => setDrafts(await listDrafts(tenantKey)), [tenantKey]);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (drafts.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-900">
        <FileClock className="h-4 w-4" /> Unfinished products ({drafts.length})
      </div>
      <p className="mb-3 text-xs text-amber-900/80">
        Saved only in this browser. They are not published and not in your store until you press Save.
      </p>
      <ul className="space-y-2">
        {drafts.map((draft) => (
          <li
            key={draft.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white px-3.5 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{draft.title || 'Untitled product'}</p>
              <p className="text-[11px] text-slate-500">
                Draft · Step {Math.min(draft.step + 1, TOTAL_STEPS)} of {TOTAL_STEPS} · saved {savedAgo(draft.updatedAt)}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <Link href={`/dashboard/products/new?draft=${draft.id}`} className="text-indigo-700 hover:underline">
                Continue
              </Link>
              <button type="button" onClick={() => setDiscardId(draft.id)} className="text-rose-600 hover:underline">
                Discard
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={Boolean(discardId)}
        title="Discard this draft?"
        description="The unfinished product and its photos are removed from this browser. This cannot be undone."
        confirmLabel="Discard draft"
        onCancel={() => setDiscardId(null)}
        onConfirm={async () => {
          const id = discardId;
          setDiscardId(null);
          if (id) {
            await deleteDraft(id);
            await refresh();
          }
        }}
      />
    </section>
  );
}
