'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { brandWorkspaceApi } from '../../services/brandService';
import { Button } from '../../components/ui/button';

const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10';

/** Shown to a team member who signed in with a temporary password: they choose their own before anything else. */
export default function ChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
      return setError('Your new password needs at least 8 characters, with a letter and a number.');
    }
    if (next !== confirm) return setError('The two new passwords do not match.');
    setBusy(true);
    try {
      await brandWorkspaceApi.changePassword(current, next);
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not change your password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950">Choose your own password</h1>
          <p className="mt-1 text-sm text-slate-600">You signed in with a temporary password. Please choose a new one that only you know, then you can continue.</p>
        </div>
        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold text-slate-700">Temporary password</span>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={INPUT} />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold text-slate-700">New password</span>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className={INPUT} />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold text-slate-700">Confirm new password</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={INPUT} />
        </label>
        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy || !current} className="h-11 w-full">
          {busy ? 'Saving…' : 'Save my password'}
        </Button>
      </form>
    </main>
  );
}
