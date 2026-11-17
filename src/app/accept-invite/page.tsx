'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { brandWorkspaceApi } from '../../services/brandService';
import { Button } from '../../components/ui/button';

const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10';

function AcceptInvite() {
  const token = useSearchParams().get('token') || '';
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ brandName: string; email: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError('Please enter your name.');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return setError('Your password needs at least 8 characters, with a letter and a number.');
    }
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      const res = await brandWorkspaceApi.acceptTeamInvite(token, name.trim(), password);
      setDone({ brandName: res.brandName, email: res.email });
    } catch (err: any) {
      setError(err?.message || 'Could not accept the invitation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        {done ? (
          <>
            <h1 className="text-2xl font-extrabold text-slate-950">You are in</h1>
            <p className="text-sm text-slate-600">
              Your account for <strong>{done.brandName}</strong> is ready. Sign in with <strong>{done.email}</strong> and the password you just chose.
            </p>
            <Link href="/login" className="inline-flex items-center justify-center h-11 w-full rounded-xl bg-slate-950 text-white text-sm font-semibold hover:bg-slate-800">
              Go to sign in
            </Link>
          </>
        ) : !token ? (
          <>
            <h1 className="text-2xl font-extrabold text-slate-950">Invitation link missing</h1>
            <p className="text-sm text-slate-600">Open the link from your invitation email, or ask for a new one.</p>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-950">Join the team</h1>
              <p className="text-sm text-slate-600 mt-1">Choose your name and a password to finish setting up your account.</p>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold text-slate-700">Your name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={INPUT} />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold text-slate-700">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={INPUT} />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold text-slate-700">Confirm password</span>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={INPUT} />
            </label>
            {error && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="h-11 w-full">
              {busy ? 'Creating your account...' : 'Accept invitation'}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInvite />
    </Suspense>
  );
}
