'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Check, Copy, Lock, UserPlus } from 'lucide-react';
import {
  brandWorkspaceApi,
  type GrantableAccess,
  type TeamInvite,
  type TeamMember,
  type TeamRoleInfo,
} from '../../services/brandService';
import { useUiStore } from '../../stores/useUiStore';
import { ConfirmDialog, ErrorBanner, PageHeader, PermissionGate, SectionCard } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { Drawer } from '../products/shared';

const INPUT =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50 disabled:text-slate-400';

const PERMISSION_LABELS: Record<string, string> = {
  'brand:products:read': 'See products and stock',
  'brand:products:write': 'Add and edit products',
  'brand:orders:read': 'See orders and customers',
  'brand:orders:write': 'Process orders',
  'brand:analytics:read': 'See reports',
  'brand:tryon:use': 'Use virtual try-on',
  'brand:staff:manage': 'Manage the team',
  'brand:billing:manage': 'Manage billing',
};
const labelFor = (p: string) => PERMISSION_LABELS[p] || p.replace('brand:', '').replace(/:/g, ' ');

/** Tick boxes for the access that can be given. What the role already includes is shown ticked and locked. */
function AccessPicker({
  grantable,
  roleHas,
  extras,
  onChange,
  canGrantOwnerOnly,
  disabled,
}: {
  grantable: GrantableAccess[];
  roleHas: string[];
  extras: string[];
  onChange: (next: string[]) => void;
  canGrantOwnerOnly: boolean;
  disabled?: boolean;
}) {
  const toggle = (key: string) => onChange(extras.includes(key) ? extras.filter((k) => k !== key) : [...extras, key]);
  return (
    <div className="space-y-2">
      {grantable.map((g) => {
        const included = roleHas.includes(g.key);
        const blocked = Boolean(g.ownerOnly) && !canGrantOwnerOnly;
        const checked = included || extras.includes(g.key);
        return (
          <label
            key={g.key}
            className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${checked ? 'border-slate-300 bg-slate-50' : 'border-slate-200'} ${included || blocked || disabled ? 'opacity-80' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={included || blocked || disabled}
              onChange={() => toggle(g.key)}
              className="mt-0.5 h-4 w-4 accent-slate-950"
            />
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900">{g.label}</span>
              <span className="block text-xs text-slate-500">
                {included ? 'Already included in this role' : blocked ? 'Only the brand owner can give this' : g.help}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

type Created = { name: string; email: string; password?: string; typedByYou: boolean; mustChange: boolean };

export function TeamView() {
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string } | undefined)?.id;
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);
  const notify = useCallback(
    (m: string) => {
      showToast(m);
      setTimeout(hideToast, 3500);
    },
    [showToast, hideToast]
  );

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [roles, setRoles] = useState<TeamRoleInfo[]>([]);
  const [grantable, setGrantable] = useState<GrantableAccess[]>([]);
  const [canGrantOwnerOnly, setCanGrantOwnerOnly] = useState(false);
  const [canCreateAdmins, setCanCreateAdmins] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "Add a person" drawer
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<'password' | 'invite'>('password');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ORDER_MANAGER');
  const [passwordMode, setPasswordMode] = useState<'make' | 'type'>('make');
  const [typedPassword, setTypedPassword] = useState('');
  const [mustChange, setMustChange] = useState(true);
  const [extras, setExtras] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [link, setLink] = useState<{ url: string; email: string; delivered: boolean } | null>(null);

  // "Manage a person" drawer
  const [managing, setManaging] = useState<TeamMember | null>(null);
  const [mRole, setMRole] = useState('');
  const [mExtras, setMExtras] = useState<string[]>([]);
  const [mSaving, setMSaving] = useState(false);
  const [mError, setMError] = useState<string | null>(null);
  const [reset, setReset] = useState<{ password?: string } | null>(null);
  const [toRemove, setToRemove] = useState<TeamMember | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await brandWorkspaceApi.getTeam();
      setMembers(res.members);
      setInvites(res.invites);
      setRoles(res.roles);
      setGrantable(res.grantable || []);
      setCanGrantOwnerOnly(Boolean(res.canGrantOwnerOnly));
      setCanCreateAdmins(Boolean(res.canCreateAdmins));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load your team.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const assignable = useMemo(() => roles.filter((r) => r.code !== 'BRAND_OWNER' && (r.code !== 'BRAND_ADMIN' || canCreateAdmins)), [roles, canCreateAdmins]);
  const roleInfo = (code: string) => roles.find((r) => r.code === code);

  const openAdd = () => {
    setAddMode('password');
    setName('');
    setEmail('');
    setRole(assignable[0]?.code || 'ORDER_MANAGER');
    setPasswordMode('make');
    setTypedPassword('');
    setMustChange(true);
    setExtras([]);
    setFormError(null);
    setCreated(null);
    setLink(null);
    setAddOpen(true);
  };

  const copy = async (text: string, done = 'Copied.') => {
    try {
      await navigator.clipboard.writeText(text);
      notify(done);
    } catch {
      notify('Could not copy. Select it and copy by hand.');
    }
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setFormError('Enter a valid email address.');
    setSaving(true);
    try {
      if (addMode === 'invite') {
        const res = await brandWorkspaceApi.inviteTeamMember(email.trim(), role);
        setLink({ url: res.inviteUrl, email: res.invite.email, delivered: res.emailDelivered });
        setEmail('');
      } else {
        if (name.trim().length < 2) return setFormError('Enter their name.');
        if (passwordMode === 'type') {
          if (typedPassword.length < 8 || !/[A-Za-z]/.test(typedPassword) || !/[0-9]/.test(typedPassword)) {
            return setFormError('The password needs at least 8 characters, with a letter and a number.');
          }
        }
        const res = await brandWorkspaceApi.createTeamMember({
          name: name.trim(),
          email: email.trim(),
          role,
          ...(passwordMode === 'type' ? { password: typedPassword } : {}),
          mustChangePassword: mustChange,
          extraPermissions: extras,
        });
        setCreated({ name: res.member.name, email: res.member.email, password: res.temporaryPassword, typedByYou: passwordMode === 'type', mustChange });
      }
      await load();
    } catch (err: unknown) {
      const issues = (err as { issues?: Array<{ message?: string }> })?.issues;
      setFormError(issues?.[0]?.message || (err instanceof Error ? err.message : 'Could not add this person.'));
    } finally {
      setSaving(false);
    }
  };

  const openManage = (m: TeamMember) => {
    setManaging(m);
    setMRole(m.role);
    setMExtras(m.extraPermissions);
    setMError(null);
    setReset(null);
  };

  const saveManage = async () => {
    if (!managing) return;
    setMSaving(true);
    setMError(null);
    try {
      const patch: { role?: string; extraPermissions: string[] } = { extraPermissions: mExtras };
      if (mRole !== managing.role) patch.role = mRole;
      await brandWorkspaceApi.updateTeamMember(managing.id, patch);
      notify(`Saved ${managing.name}'s access.`);
      setManaging(null);
      await load();
    } catch (err: unknown) {
      setMError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setMSaving(false);
    }
  };

  const switchAccess = async (m: TeamMember, off: boolean) => {
    try {
      await brandWorkspaceApi.updateTeamMember(m.id, { disabled: off });
      notify(off ? `${m.name} is switched off and signed out.` : `${m.name} can sign in again.`);
      setManaging(null);
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Could not change that.');
    }
    await load();
  };

  const resetPassword = async (m: TeamMember) => {
    try {
      const res = await brandWorkspaceApi.resetTeamMemberPassword(m.id);
      setReset({ password: res.temporaryPassword });
      await load();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Could not reset the password.');
    }
  };

  const remove = async () => {
    const m = toRemove;
    setToRemove(null);
    if (!m) return;
    try {
      await brandWorkspaceApi.removeTeamMember(m.id);
      notify(`${m.name} no longer has access.`);
      setManaging(null);
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : 'Could not remove that person.');
    }
    await load();
  };

  const revoke = async (i: TeamInvite) => {
    try {
      await brandWorkspaceApi.revokeTeamInvite(i.id);
      notify('Invitation cancelled.');
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : 'Could not cancel the invitation.');
    }
    await load();
  };

  const roleHasAdd = roleInfo(role)?.permissions || [];
  const roleHasManage = roleInfo(mRole)?.permissions || [];
  const managingIsMe = managing?.id === myId;

  return (
    <PermissionGate module="team" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Team"
          title="Your team"
          subtitle="Add the people who help run your shop. Each role has a fixed set of access, and you can give one person a little extra."
          actions={
            <Button type="button" size="sm" className="h-10 gap-1.5" onClick={openAdd}>
              <UserPlus className="w-4 h-4" /> Add a person
            </Button>
          }
        />

        {error && <ErrorBanner message={error} onRetry={() => void load()} />}

        <SectionCard title="People with access">
          {loading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading team">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {members.map((m) => {
                const isMe = m.id === myId;
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 py-3.5">
                    <span className={`w-10 h-10 rounded-full grid place-items-center text-sm font-bold shrink-0 ${m.disabled ? 'bg-slate-300 text-white' : 'bg-slate-950 text-white'}`}>
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1 basis-56">
                      <p className="text-sm font-semibold text-slate-950">
                        {m.name} {isMe && <span className="text-xs font-normal text-slate-500">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{m.email}</p>
                      {m.extraPermissions.length > 0 && (
                        <p className="mt-1 flex flex-wrap gap-1">
                          {m.extraPermissions.map((p) => (
                            <span key={p} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              + {labelFor(p)}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{m.roleName}</span>
                      {m.disabled && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Switched off</span>}
                      {m.mustChangePassword && !m.disabled && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">Has not chosen a password yet</span>}
                    </div>
                    {m.isOwner ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Lock className="h-3 w-3" /> Fixed</span>
                    ) : isMe ? null : (
                      <Button type="button" size="sm" variant="outline" onClick={() => openManage(m)}>
                        Manage
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
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

        <SectionCard title="What each role can do" subtitle="These are the fixed, default settings. When you add or manage someone, you can give them extra on top.">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((r) => (
              <li key={r.code} className="rounded-xl border border-slate-200 p-4 space-y-2">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-950">
                  {r.name}
                  {r.fixed && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"><Lock className="h-2.5 w-2.5" /> Fixed</span>}
                </p>
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

        {/* Add a person */}
        <Drawer
          open={addOpen}
          title="Add a person"
          subtitle="Choose a role. You can give them extra access too."
          onClose={() => setAddOpen(false)}
          footer={
            created || link ? (
              <div className="flex justify-end">
                <Button type="button" size="sm" onClick={() => setAddOpen(false)}>Done</Button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit" form="add-person-form" size="sm" disabled={saving}>
                  {saving ? 'Saving…' : addMode === 'invite' ? 'Send invitation' : 'Add person'}
                </Button>
              </div>
            )
          }
        >
          {created ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                <p className="flex items-center gap-2 font-bold text-emerald-900"><Check className="h-4 w-4" /> {created.name} was added</p>
                <p className="text-xs text-emerald-800">They can sign in now with <strong>{created.email}</strong>.</p>
              </div>
              {created.password ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700">Their temporary password</p>
                  <div className="flex items-center gap-2">
                    <input readOnly value={created.password} aria-label="Temporary password" className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono text-sm" onFocus={(e) => e.currentTarget.select()} />
                    <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => void copy(created.password!, 'Password copied.')}>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </Button>
                  </div>
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Share this with them privately. It is shown only now and cannot be seen again.</p>
                </div>
              ) : (
                <p className="text-xs text-slate-600">They sign in with the password you typed.</p>
              )}
              {created.mustChange && <p className="text-xs text-slate-600">When they first sign in, they will be asked to choose their own password.</p>}
            </div>
          ) : link ? (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-emerald-900 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                {link.delivered ? `Invitation emailed to ${link.email}.` : `Invitation created for ${link.email}. The email may be delayed, so you can also send them this link yourself:`}
              </p>
              <div className="flex items-center gap-2">
                <input readOnly value={link.url} aria-label="Invitation link" className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => void copy(link.url, 'Link copied.')}>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </Button>
              </div>
              <p className="text-xs text-slate-600">This link works once for 7 days and is shown only now. Only share it with the person you invited.</p>
            </div>
          ) : (
            <form id="add-person-form" onSubmit={submitAdd} className="space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="How to add them">
                {([['password', 'Set a password'], ['invite', 'Send an invite link']] as Array<['password' | 'invite', string]>).map(([k, label]) => (
                  <button key={k} type="button" aria-pressed={addMode === k} onClick={() => setAddMode(k)} className={`rounded-xl border py-2.5 text-sm font-bold ${addMode === k ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {addMode === 'password' && (
                <label className="block space-y-1.5">
                  <span className="font-semibold text-slate-700">Their name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className={INPUT} />
                </label>
              )}
              <label className="block space-y-1.5">
                <span className="font-semibold text-slate-700">Their email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="off" className={INPUT} />
              </label>
              <label className="block space-y-1.5">
                <span className="font-semibold text-slate-700">Role</span>
                <select value={role} onChange={(e) => setRole(e.target.value)} className={INPUT}>
                  {assignable.map((r) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
                {roleInfo(role) && <span className="block text-xs text-slate-500">{roleInfo(role)!.description}</span>}
              </label>

              {addMode === 'password' && (
                <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-700">Password</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2"><input type="radio" name="pw" checked={passwordMode === 'make'} onChange={() => setPasswordMode('make')} className="accent-slate-950" /> Make a password for me</label>
                    <label className="flex items-center gap-2"><input type="radio" name="pw" checked={passwordMode === 'type'} onChange={() => setPasswordMode('type')} className="accent-slate-950" /> I will type one</label>
                  </div>
                  {passwordMode === 'type' && (
                    <input type="text" value={typedPassword} onChange={(e) => setTypedPassword(e.target.value)} placeholder="At least 8 characters, with a letter and a number" autoComplete="off" className={INPUT} aria-label="Password" />
                  )}
                  <label className="flex items-start gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-slate-950" />
                    They must choose their own password the first time they sign in (recommended)
                  </label>
                </div>
              )}

              <div className="space-y-2">
                <p className="font-semibold text-slate-700">Extra access <span className="font-normal text-slate-400">(optional)</span></p>
                <p className="text-xs text-slate-500">Give this person more than their role usually gets.</p>
                <AccessPicker grantable={grantable} roleHas={roleHasAdd} extras={extras} onChange={setExtras} canGrantOwnerOnly={canGrantOwnerOnly} disabled={addMode === 'invite'} />
                {addMode === 'invite' && <p className="text-[11px] text-slate-500">Extra access can be added after they join, from Manage.</p>}
              </div>

              {formError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">{formError}</p>}
            </form>
          )}
        </Drawer>

        {/* Manage a person */}
        <Drawer
          open={Boolean(managing)}
          title={managing ? `Manage ${managing.name}` : 'Manage'}
          subtitle={managing?.email}
          onClose={() => setManaging(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setManaging(null)}>Close</Button>
              <Button type="button" size="sm" disabled={mSaving || managingIsMe} onClick={() => void saveManage()}>{mSaving ? 'Saving…' : 'Save changes'}</Button>
            </div>
          }
        >
          {managing && (
            <div className="space-y-5 text-sm">
              <label className="block space-y-1.5">
                <span className="font-semibold text-slate-700">Role</span>
                <select value={mRole} onChange={(e) => setMRole(e.target.value)} disabled={managing.role === 'BRAND_ADMIN' && !canCreateAdmins} className={INPUT}>
                  {roles.filter((r) => r.code !== 'BRAND_OWNER' && (r.code !== 'BRAND_ADMIN' || canCreateAdmins || r.code === managing.role)).map((r) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
                {roleInfo(mRole) && <span className="block text-xs text-slate-500">{roleInfo(mRole)!.description}</span>}
              </label>

              <div className="space-y-2">
                <p className="font-semibold text-slate-700">Extra access</p>
                <AccessPicker grantable={grantable} roleHas={roleHasManage} extras={mExtras} onChange={setMExtras} canGrantOwnerOnly={canGrantOwnerOnly} />
              </div>

              {mError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">{mError}</p>}

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <p className="font-semibold text-slate-700">Sign-in</p>
                {reset ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                    <p className="text-xs font-bold text-emerald-900">Password reset. They were signed out and must choose a new one.</p>
                    {reset.password && (
                      <div className="flex items-center gap-2">
                        <input readOnly value={reset.password} aria-label="New temporary password" className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-emerald-200 bg-white font-mono text-sm" onFocus={(e) => e.currentTarget.select()} />
                        <Button type="button" size="sm" variant="outline" onClick={() => void copy(reset.password!, 'Password copied.')}>Copy</Button>
                      </div>
                    )}
                    <p className="text-[11px] text-emerald-800">Shown only now. Share it with them privately.</p>
                  </div>
                ) : (
                  <Button type="button" size="sm" variant="outline" onClick={() => void resetPassword(managing)}>Give a new temporary password</Button>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void switchAccess(managing, !managing.disabled)}>
                    {managing.disabled ? 'Switch access back on' : 'Switch access off'}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setToRemove(managing)}>Remove from team</Button>
                </div>
                <p className="text-[11px] text-slate-500">Switching off signs them out and stops them signing in, and you can switch it back on. Removing deletes their account.</p>
              </div>
            </div>
          )}
        </Drawer>

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
