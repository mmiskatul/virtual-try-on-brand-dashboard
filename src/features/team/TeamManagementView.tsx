'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Download,
  Lock,
  Plus,
  Search,
  Shield,
  UserCog,
  Users,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { useMounted } from '../../hooks/useMounted';
import {
  canPerform,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_LABELS,
} from '../../config/permissions';
import {
  PermissionAction,
  ResourceModule,
  StaffRole,
} from '../../types';
import {
  KpiCard,
  PageHeader,
  PermissionGate,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

export type TeamTab = 'overview' | 'members' | 'roles' | 'activity';

const TEAM_TABS: Array<{ id: TeamTab; label: string; href: string }> = [
  { id: 'overview', label: 'Team Overview', href: '/dashboard/team' },
  { id: 'members', label: 'Team Members', href: '/dashboard/team/members' },
  { id: 'roles', label: 'Roles & Permissions', href: '/dashboard/team/roles' },
  { id: 'activity', label: 'Activity Logs', href: '/dashboard/team/activity' },
];

const ALL_MODULES: ResourceModule[] = [
  'overview',
  'brand',
  'storefront',
  'products',
  'marketplace',
  'tryon',
  'orders',
  'inventory',
  'customers',
  'marketing',
  'analytics',
  'team',
  'billing',
  'integrations',
  'settings',
];

const ALL_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
  'publish',
  'export',
  'manage_settings',
];

export function TeamManagementView({ initialTab = 'overview' }: { initialTab?: TeamTab }) {
  const mounted = useMounted();
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const teamMembers = useWorkspaceStore((s) => s.teamMembers);
  const activityLogs = useWorkspaceStore((s) => s.activityLogs);
  const inviteTeamMember = useWorkspaceStore((s) => s.inviteTeamMember);
  const updateTeamMemberRole = useWorkspaceStore((s) => s.updateTeamMemberRole);
  const toggleRolePermission = useWorkspaceStore((s) => s.toggleRolePermission);
  const recordAudit = useWorkspaceStore((s) => s.recordAudit);
  const showToast = useUiStore((s) => s.showToast);

  const [tab, setTab] = useState<TeamTab>(initialTab);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('PRODUCT_MANAGER');
  const [selectedRoleMatrix, setSelectedRoleMatrix] = useState<StaffRole>('PRODUCT_MANAGER');
  const [logSearch, setLogSearch] = useState('');

  const canManageTeam = canPerform(activeRole, 'team', 'manage_settings', roleOverrides);
  const safeMembers = mounted ? teamMembers : [];
  const safeLogs = mounted ? activityLogs : [];

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return safeLogs.filter(
      (l) =>
        !q ||
        l.actor.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
    );
  }, [safeLogs, logSearch]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    inviteTeamMember({
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      status: 'INVITED',
    });
    showToast(`Added pending invite for ${inviteEmail.trim()} (${ROLE_LABELS[inviteRole].label}).`);
    setInviteName('');
    setInviteEmail('');
  };

  return (
    <PermissionGate module="team" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workspace Access Control"
          title="Team Members, RBAC Roles & Audit Trail"
          subtitle="Manage tenant staff accounts, enforce granular module permissions, and audit every configuration change."
        />

        <div className="flex flex-wrap gap-2">
          {TEAM_TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                tab === t.id
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Staff Seats" value={safeMembers.length} icon={<Users className="w-4 h-4" />} />
          <KpiCard
            label="Active Members"
            value={safeMembers.filter((m) => m.status === 'ACTIVE').length}
            icon={<UserCog className="w-4 h-4" />}
          />
          <KpiCard label="Configured RBAC Roles" value={Object.keys(ROLE_LABELS).length} icon={<Shield className="w-4 h-4" />} />
          <KpiCard label="Recorded Audit Events" value={safeLogs.length} icon={<Activity className="w-4 h-4" />} />
        </div>

        {(tab === 'overview' || tab === 'members') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <SectionCard
              className="lg:col-span-7"
              title="Tenant Staff Directory"
              subtitle="Only authorized team accounts scoped to this brand workspace."
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 pr-4">Member</th>
                      <th className="py-2.5 pr-4">Role</th>
                      <th className="py-2.5 pr-4">Status</th>
                      <th className="py-2.5 text-right">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {safeMembers.map((m) => (
                      <tr key={m.id}>
                        <td className="py-3 pr-4">
                          <p className="font-bold text-slate-900">{m.name}</p>
                          <p className="text-[11px] text-slate-500">{m.email}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            disabled={!canManageTeam || m.role === 'OWNER'}
                            value={m.role}
                            onChange={(e) => {
                              updateTeamMemberRole(m.id, e.target.value as StaffRole);
                              showToast(`Updated ${m.name}'s role to ${e.target.value}.`);
                            }}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold bg-white"
                          >
                            {(Object.keys(ROLE_LABELS) as StaffRole[]).map((rk) => (
                              <option key={rk} value={rk}>
                                {ROLE_LABELS[rk].label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="py-3 text-right text-slate-500">{m.lastActiveAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard
              className="lg:col-span-5"
              title="Invite Staff Member"
              subtitle="Assign an initial workspace role. Invite email delivery requires configuring an SMTP provider."
            >
              <form onSubmit={handleInvite} className="space-y-3 text-xs">
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Full Name</span>
                  <input
                    required
                    disabled={!canManageTeam}
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Tariq Mahmud"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Work Email</span>
                  <input
                    required
                    type="email"
                    disabled={!canManageTeam}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="tariq@brand.com"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-700">Assigned Staff Role</span>
                  <select
                    disabled={!canManageTeam}
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
                  >
                    {(Object.keys(ROLE_LABELS) as StaffRole[])
                      .filter((r) => r !== 'OWNER')
                      .map((rk) => (
                        <option key={rk} value={rk}>
                          {ROLE_LABELS[rk].label} — {ROLE_LABELS[rk].summary}
                        </option>
                      ))}
                  </select>
                </label>
                <Button type="submit" disabled={!canManageTeam} className="w-full gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Pending Team Member
                </Button>
              </form>
            </SectionCard>
          </div>
        )}

        {(tab === 'overview' || tab === 'roles') && (
          <SectionCard
            title="Role-Based Permission Matrix"
            subtitle="Changes take effect immediately across sidebar visibility and protected action gates. Use the Top Bar Role Tester to preview any role."
            right={
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((rk) => (
                  <button
                    key={rk}
                    type="button"
                    onClick={() => setSelectedRoleMatrix(rk)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                      selectedRoleMatrix === rk
                        ? 'bg-slate-950 text-white border-slate-950'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {ROLE_LABELS[rk].label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between text-xs mb-3">
              <div>
                <p className="font-bold text-slate-900">{ROLE_LABELS[selectedRoleMatrix].label}</p>
                <p className="text-slate-500">{ROLE_LABELS[selectedRoleMatrix].summary}</p>
              </div>
              {selectedRoleMatrix === 'OWNER' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
                  <Lock className="w-3.5 h-3.5" /> Owner permissions locked
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2 pr-4">Module</th>
                    {ALL_ACTIONS.map((a) => (
                      <th key={a} className="py-2 px-2 text-center">
                        {a.replace('_', ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ALL_MODULES.map((mod) => {
                    const effective =
                      roleOverrides[selectedRoleMatrix]?.[mod] ||
                      DEFAULT_ROLE_PERMISSIONS[selectedRoleMatrix]?.[mod] ||
                      [];
                    return (
                      <tr key={mod}>
                        <td className="py-2.5 pr-4 font-bold uppercase text-[11px] text-slate-800">{mod}</td>
                        {ALL_ACTIONS.map((act) => {
                          const checked = selectedRoleMatrix === 'OWNER' || effective.includes(act);
                          return (
                            <td key={act} className="py-2.5 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!canManageTeam || selectedRoleMatrix === 'OWNER'}
                                onChange={() => {
                                  toggleRolePermission(selectedRoleMatrix, mod, act);
                                  recordAudit(
                                    'RBAC_MATRIX_UPDATED',
                                    `${selectedRoleMatrix}:${mod}`,
                                    `Toggled ${act}`
                                  );
                                }}
                                className="rounded border-slate-300 text-slate-950"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {(tab === 'overview' || tab === 'activity') && (
          <SectionCard
            title="Workspace Security & Activity Audit Log"
            subtitle="Records staff mutations across catalog, orders, marketplace, try-on, and settings."
            right={
              <div className="flex items-center gap-2">
                <div className="relative w-52">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Filter events..."
                    className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const csv = [
                      ['Actor', 'Role', 'Action', 'Entity', 'Details', 'Timestamp'].join(','),
                      ...filteredLogs.map((l) =>
                        [l.actor, l.role, l.action, l.entity, l.details, l.timestamp]
                          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                          .join(',')
                      ),
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'workspace-audit-logs.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('Exported activity log CSV.');
                  }}
                  className="gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </Button>
              </div>
            }
          >
            <div className="space-y-2 text-xs max-h-96 overflow-y-auto">
              {filteredLogs.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/70"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[11px] text-slate-900">{l.action}</span>
                      <span className="text-slate-500">on {l.entity}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{l.details}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <p className="font-semibold text-slate-800">
                      {l.actor} ({l.role})
                    </p>
                    <p>{l.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </PermissionGate>
  );
}

