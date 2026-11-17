'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Laptop, LogOut, ShieldCheck, Smartphone } from 'lucide-react';
import { brandWorkspaceApi, type SessionInfo } from '../../services/brandService';
import { useUiStore } from '../../stores/useUiStore';
import { ConfirmDialog, ErrorBanner, SectionCard } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10';

/** Turn a raw user-agent string into something a person can recognise. */
export function describeDevice(ua: string): { name: string; mobile: boolean } {
  const s = ua || '';
  const mobile = /Android|iPhone|iPad|Mobile/i.test(s);
  const os = /Windows/i.test(s) ? 'Windows' : /Mac OS|Macintosh/i.test(s) ? 'Mac' : /Android/i.test(s) ? 'Android' : /iPhone|iPad|iOS/i.test(s) ? 'iPhone / iPad' : /Linux/i.test(s) ? 'Linux' : '';
  const browser = /Edg\//i.test(s) ? 'Edge' : /Chrome\//i.test(s) ? 'Chrome' : /Firefox\//i.test(s) ? 'Firefox' : /Safari\//i.test(s) ? 'Safari' : '';
  const name = [browser, os].filter(Boolean).join(' on ');
  return { name: name || (s.length > 40 ? 'Unknown device' : s || 'Unknown device'), mobile };
}

function validateNewPassword(pw: string): string | null {
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Include at least one letter and one number.';
  return null;
}

export function SecurityPanel() {
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);
  const notify = (m: string) => {
    showToast(m);
    setTimeout(hideToast, 3500);
  };

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await brandWorkspaceApi.getSessions();
      setCurrentId(res.currentSessionId);
      setSessions(
        res.sessions
          .filter((s) => !s.revokedAt && new Date(s.expiresAt).getTime() > Date.now())
          .sort((a, b) => (a.id === res.currentSessionId ? -1 : b.id === res.currentSessionId ? 1 : b.createdAt.localeCompare(a.createdAt)))
      );
    } catch (e: any) {
      setError(e?.message || 'Could not load your devices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = async (id: string) => {
    setBusyId(id);
    try {
      await brandWorkspaceApi.revokeSession(id);
      notify('Device signed out.');
      await load();
    } catch (e: any) {
      notify(e?.message || 'Could not sign that device out.');
    } finally {
      setBusyId(null);
    }
  };

  const revokeOthers = async () => {
    setConfirmOthers(false);
    const others = sessions.filter((s) => s.id !== currentId);
    for (const s of others) {
      try {
        await brandWorkspaceApi.revokeSession(s.id);
      } catch {
        /* keep going: report the final state below */
      }
    }
    notify(others.length === 1 ? 'Signed out 1 other device.' : `Signed out ${others.length} other devices.`);
    await load();
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (!current) return setPwError('Enter your current password.');
    const problem = validateNewPassword(next);
    if (problem) return setPwError(problem);
    if (next !== confirm) return setPwError('The new passwords do not match.');
    setSaving(true);
    try {
      const res = await brandWorkspaceApi.changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      notify(
        res.revokedOtherSessions > 0
          ? `Password changed. ${res.revokedOtherSessions} other device(s) were signed out.`
          : 'Password changed.'
      );
      await load();
    } catch (err: any) {
      setPwError(err?.message || 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  };

  const others = sessions.filter((s) => s.id !== currentId);

  return (
    <div className="space-y-6">
      <SectionCard title="Change password" subtitle="Other devices are signed out when you change it.">
        <form onSubmit={submitPassword} className="space-y-4 max-w-md">
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-slate-700">Current password</span>
            <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={INPUT} />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-slate-700">New password</span>
            <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={INPUT} />
            <span className="text-xs text-slate-500">At least 8 characters, with a letter and a number.</span>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-slate-700">Confirm new password</span>
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={INPUT} />
          </label>
          {pwError && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
              {pwError}
            </p>
          )}
          <Button type="submit" disabled={saving} className="h-10">
            {saving ? 'Saving...' : 'Change password'}
          </Button>
        </form>
      </SectionCard>

      <SectionCard
        title="Where you are signed in"
        subtitle="If you do not recognise a device, sign it out and change your password."
        right={
          others.length > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmOthers(true)} className="gap-1.5">
              <LogOut className="w-3.5 h-3.5" /> Sign out other devices
            </Button>
          ) : undefined
        }
      >
        {error && <ErrorBanner message={error} onRetry={() => void load()} />}
        {loading ? (
          <p className="py-6 text-sm text-slate-500">Loading devices...</p>
        ) : sessions.length === 0 && !error ? (
          <p className="py-6 text-sm text-slate-500">No active devices found.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sessions.map((s) => {
              const d = describeDevice(s.deviceLabel);
              const isCurrent = s.id === currentId;
              const Icon = d.mobile ? Smartphone : Laptop;
              return (
                <li key={s.id} className="flex items-center gap-3 py-3.5">
                  <span className="w-10 h-10 rounded-xl bg-slate-100 grid place-items-center shrink-0">
                    <Icon className="w-5 h-5 text-slate-700" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950 flex items-center gap-2 flex-wrap">
                      {d.name}
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> This device
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      Signed in {new Date(s.createdAt).toLocaleString()} &middot; {s.ipMasked}
                    </p>
                  </div>
                  {!isCurrent && (
                    <Button type="button" variant="outline" size="sm" disabled={busyId === s.id} onClick={() => void revoke(s.id)}>
                      {busyId === s.id ? 'Signing out...' : 'Sign out'}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <ConfirmDialog
        open={confirmOthers}
        title="Sign out all other devices?"
        description="You will stay signed in here. Everyone else using your account will have to sign in again."
        confirmLabel="Sign them out"
        onConfirm={() => void revokeOthers()}
        onCancel={() => setConfirmOthers(false)}
      />
    </div>
  );
}
