'use client';

import { useEffect, useMemo, useState } from 'react';
import { brandWorkspaceApi } from '../services';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import type { TryOnGenerationSession } from '../types';

type Job = Awaited<ReturnType<typeof brandWorkspaceApi.getTryOnJobs>>[number];

export function mapJobToSession(
  job: Job,
  tenantId: string,
  productName: (productId?: string) => string
): TryOnGenerationSession {
  const status: TryOnGenerationSession['status'] =
    job.status === 'COMPLETED'
      ? 'COMPLETED'
      : job.status === 'FAILED'
        ? 'FAILED'
        : job.status === 'CANCELLED'
          ? 'CANCELLED'
          : 'PROCESSING';
  return {
    id: job.jobId,
    tenantId,
    productId: job.productId || '',
    productName: productName(job.productId),
    category: job.category || '',
    status,
    durationMs: job.latencyMs || 0,
    creditsUsed: status === 'COMPLETED' ? 1 : 0,
    errorReason: status === 'FAILED' ? job.errorMessage || 'The try-on did not complete.' : undefined,
    createdAt: job.createdAt ? new Date(job.createdAt).toLocaleString() : '',
  };
}

/**
 * Every shopper try-on for this brand, loaded from the server (newest first).
 * `loaded` is false until the first answer arrives, so screens can avoid flashing "0".
 */
export function useTryOnSessions(): { sessions: TryOnGenerationSession[]; loaded: boolean } {
  const profile = useWorkspaceStore((s) => s.profile);
  const products = useWorkspaceStore((s) => s.products);
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    brandWorkspaceApi
      .getTryOnJobs()
      .then((list) => {
        if (!cancelled) setJobs(list);
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sessions = useMemo(
    () =>
      (jobs || []).map((j) =>
        mapJobToSession(j, profile.id || '', (id) => products.find((p) => p.id === id)?.name || 'Removed product')
      ),
    [jobs, products, profile.id]
  );

  return { sessions, loaded: jobs !== null };
}
