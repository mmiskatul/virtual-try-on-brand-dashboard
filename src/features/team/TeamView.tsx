'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Copy, UserPlus } from 'lucide-react';
import { brandWorkspaceApi, type TeamInvite, type TeamMember, type TeamRoleInfo } from '../../services/brandService';
import { useUiStore } from '../../stores/useUiStore';
import { ConfirmDialog, ErrorBanner, PageHeader, PermissionGate, SectionCard } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10';

const PERMISSION_LABELS: Record<string, string> = {
  'brand:products:read': 'View products',
  'brand:products:write': 'Edit products',
  'brand:orders:read': 'View orders and customers',
  'brand:orders:write': 'Process orders',
  'brand:analytics:read': 'View reports',
  'brand:tryon:use': 'Use virtual try-on',
  'brand:staff:manage': 'Manage the team',
  'brand:billing:read': 'View billing',
  'brand:billing:manage': 'Manage billing',
  'brand:settings:manage': 'Change settings',
};
const labelFor = (p: string) => PERMISSION_LABELS[p] || p.replace('brand:', '').replace(/:/g, ' ');

export function TeamView() {
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string } | undefined)?.id;
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);
  const notify = (m: string) => {
    showToast(m);
    setTimeout(hideToast, 3500);
  };

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [roles, setRoles] = useState<TeamRoleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ORDER_MANAGER');
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [link, setLink] = useState<{ url: string; email: string; delivered: boolean } | null>(null);
  const [toRemove, setToRemove] = useState<TeamMember | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await brandWorkspaceApi.getTeam();
      setMembers(res.members);
      setInvites(res.invites);
      setRoles(res.roles);
    } catch (e: any) {
      setError(e?.message || 'Could not load your team.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const assignable = roles.filter((r) => r.code !== 'BRAND_OWNER');
  const selectedRole = assignable.find((r) => r.code === role);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLink(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setFormError('Enter a valid email address.');
    setSending(true);
    try {
      const res = await brandWorkspaceApi.inviteTeamMember(email.trim(), role);
      setLink({ url: res.inviteUrl, email: res.invite.email, delivered: res.emailDelivered });
      setEmail('');
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Could not send the invitation.');
    } finally {
      setSending(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify('Link copied.');
    } catch {
      notify('Could not copy. Select the link and copy it by hand.');
    }
  };

  const changeRole = async (m: TeamMember, next: string) => {
    try {
      await brandWorkspaceApi.changeTeamMemberRole(m.id, next);
      notify(`${m.name} is now ${roles.find((r) => r.code === next)?.name || next}.`);
    } catch (e: any) {
      notify(e?.message || 'Could not change the role.');
    }
    await load();
  };

  const remove = async () => {
    const m = toRemove;
    setToRemove(null);
    if (!m) return;
    try {
      await brandWorkspaceApi.removeTeamMember(m.id);
      notify(`${m.name} no longer has access.`);
    } catch (e: any) {
      notify(e?.message || 'Could not remove that person.');
    }
    await load();
  };

  const revoke = async (i: TeamInvite) => {
    try {
      await brandWorkspaceApi.revokeTeamInvite(i.id);
      notify('Invitation cancelled.');
    } catch (e: any) {
      notify(e?.message || 'Could not cancel the invitation.');
    }
    await load();
  };

  return (
    <PermissionGate module="team" action="view">
      <div className="space-y-6">
        <PageHeader eyebrow="Team" title="Your team" subtitle="Invite people to help run your shop, and choose what each of them can do." />

        {error && <ErrorBanner message={error} onRetry={() => void load()} />}

        <SectionCard title="People with access">
          {loading ? (
            <p className="py-6 text-sm text-slate-500">Loading...</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {members.map((m) => {
                const isMe = m.id === myId;
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 py-3.5">
                    <span className="w-10 h-10 rounded-full bg-slate-950 text-white grid place-items-center text-sm font-bold shrink-0">
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-950">
                        {m.name} {isMe && <span className="text-xs font-normal text-slate-500">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{m.email}</p>
                    </div>
                    {m.isOwner || isMe ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{m.roleName}</span>
                    ) : (
                      <>
                        <select
                          aria-label={`Role for ${m.name}`}
                          value={m.role}
                          onChange={(e) => void changeRole(m, e.target.value)}
                          className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white"
                        >
                          {assignable.map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                        <Button type="button" size="sm" variant="outline" onClick={() => setToRemove(m)}>
                          Remove
                        </Button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Invite someone" subtitle="They get an email with a link that works once for 7 days.">
          <form onSubmit={invite} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold text-slate-700">Their email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={INPUT} />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold text-slate-700">What they can do</span>
                <select value={role} onChange={(e) => setRole(e.target.value)} className={INPUT}>
                  {assignable.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {selectedRole && <p className="text-xs text-slate-500">{selectedRole.description}</p>}
            {formError && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
                {formError}
              </p>
            )}
            <Button type="submit" disabled={sending} className="h-10 gap-1.5">
              <UserPlus className="w-4 h-4" /> {sending ? 'Sending...' : 'Send invitation'}
            </Button>
          </form>

          {link && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2.5 max-w-xl">
              <p className="text-sm font-semibold text-emerald-900">
                {link.delivered ? `Invitation emailed to ${link.email}.` : `Invitation created for ${link.email}. The email may be delayed, so you can also send them this link yourself:`}
              </p>
              <div className="flex items-center gap-2">
                <input readOnly value={link.url} aria-label="Invitation link" className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-emerald-200 bg-white font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => void copy(link.url)}>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </Button>
              </div>
              <p className="text-xs text-emerald-800">This link is shown only now. Anyone with it can join, so only share it with the person you invited.</p>
            </div>
          )}
        </SectionCard>

        {invites.length > 0 && (
          <SectionCard title="Waiting to join">
            <ul className="divide-y divide-slate-100">
              {invites.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950">{i.email}</p>
                    <p className="text-xs text-slate-500">
                      {i.roleName} &middot; invited {new Date(i.invitedAt).toLocaleDateString()} &middot; expires {new Date(i.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => void revoke(i)}>
                    Cancel invitation
                  </Button>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        <SectionCard title="What each role can do">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((r) => (
              <li key={r.code} className="rounded-xl border border-slate-200 p-4 space-y-2">
                <p className="text-sm font-bold text-slate-950">{r.name}</p>
                <p className="text-xs text-slate-500">{r.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {r.permissions.map((p) => (
                    <span key={p} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {labelFor(p)}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <ConfirmDialog
          open={Boolean(toRemove)}
          title={`Remove ${toRemove?.name}?`}
          description="They will be signed out straight away and lose access to your shop. This cannot be undone."
          confirmLabel="Remove"
          onConfirm={() => void remove()}
          onCancel={() => setToRemove(null)}
        />
      </div>
    </PermissionGate>
  );
}
