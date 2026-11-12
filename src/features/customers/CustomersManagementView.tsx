'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Flag,
  MapPin,
  MessageSquareReply,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { useMounted } from '../../hooks/useMounted';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  PermissionGate,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';
import { canPerform } from '../../config/permissions';
import { BrandCustomer } from '../../types';

export type CustomersTab = 'all' | 'groups' | 'reviews';

const CUSTOMER_TABS: Array<{ id: CustomersTab; label: string; href: string }> = [
  { id: 'all', label: 'All Customers', href: '/dashboard/customers' },
  { id: 'groups', label: 'Customer Groups', href: '/dashboard/customers/groups' },
  { id: 'reviews', label: 'Reviews & Ratings', href: '/dashboard/customers/reviews' },
];

export function CustomersManagementView({
  initialTab = 'all',
  customerId,
}: {
  initialTab?: CustomersTab;
  customerId?: string;
}) {
  const router = useRouter();
  const mounted = useMounted();
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const customers = useWorkspaceStore((s) => s.customers);
  const orders = useWorkspaceStore((s) => s.orders);
  const reviews = useWorkspaceStore((s) => s.reviews);
  const replyToReview = useWorkspaceStore((s) => s.replyToReview);
  const toggleReportReview = useWorkspaceStore((s) => s.toggleReportReview);
  const recordAudit = useWorkspaceStore((s) => s.recordAudit);
  const showToast = useUiStore((s) => s.showToast);

  const [tab, setTab] = useState<CustomersTab>(initialTab);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'UNREPLIED' | 'REPORTED'>('ALL');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const canEdit = canPerform(activeRole, 'customers', 'edit', roleOverrides);
  const safeCustomers = mounted ? customers : [];
  const safeOrders = mounted ? orders : [];
  const safeReviews = mounted ? reviews : [];

  // Single Customer Profile View (/dashboard/customers/[id])
  if (customerId) {
    const customer = safeCustomers.find((c) => c.id === customerId);
    const customerOrders = customer
      ? safeOrders.filter(
          (o) =>
            o.customerEmail.toLowerCase() === customer.email.toLowerCase() ||
            o.customerName.toLowerCase() === customer.name.toLowerCase()
        )
      : [];

    return (
      <PermissionGate module="customers" action="view">
        <div className="space-y-6">
          <PageHeader
            eyebrow="Customer Intelligence"
            title={customer ? customer.name : `Customer ${customerId}`}
            subtitle="Purchase summary, order history, and privacy-safe contact profile for this tenant."
            actions={
              <Link href="/dashboard/customers">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
                </Button>
              </Link>
            }
          />

          {!customer ? (
            <EmptyState
              title="Customer record not found"
              description="No customer profile matches this ID within your active tenant."
              actionLabel="Back to Customers"
              onAction={() => router.push('/dashboard/customers')}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <SectionCard
                className="lg:col-span-4"
                title="Shopper Profile"
                subtitle={`Segment: ${customer.group}`}
                right={<StatusBadge status={customer.group} />}
              >
                <div className="space-y-2.5 text-xs">
                  <div>
                    <p className="text-slate-400">Email</p>
                    <p className="font-semibold text-slate-900">{customer.email}</p>
                  </div>
                  {customer.phone && (
                    <div>
                      <p className="text-slate-400">Phone</p>
                      <p className="font-semibold text-slate-900">{customer.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-400">Location</p>
                    <p className="font-semibold text-slate-900 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {customer.city}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
                    <div>
                      <p className="text-slate-400">Total Orders</p>
                      <p className="text-base font-extrabold text-slate-950">{customer.orderCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Lifetime Spend</p>
                      <p className="text-base font-extrabold text-slate-950">৳{customer.totalSpend.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    Registered: {customer.registeredAt} • Last Active: {customer.lastActivityAt}
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                className="lg:col-span-8"
                title="Order History with This Brand"
                subtitle={`${customerOrders.length} recorded order(s)`}
              >
                {customerOrders.length === 0 ? (
                  <EmptyState
                    title="No matched orders in current list"
                    description="Orders matching this shopper's email will appear here."
                  />
                ) : (
                  <div className="space-y-2 text-xs">
                    {customerOrders.map((o) => (
                      <Link
                        key={o.id}
                        href={`/dashboard/orders/${encodeURIComponent(o.id)}`}
                        className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{o.id}</p>
                          <p className="text-slate-500">
                            {o.date} • {o.itemCount} unit(s)
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-bold text-slate-950">৳{o.total.toFixed(2)}</p>
                          <StatusBadge status={o.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </div>
      </PermissionGate>
    );
  }

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return safeCustomers.filter((c) => {
      const matchGroup = groupFilter === 'ALL' || c.group === groupFilter;
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q);
      return matchGroup && matchQ;
    });
  }, [safeCustomers, search, groupFilter]);

  const vipCount = safeCustomers.filter(
    (c) => c.group === 'VIP' || c.group === 'HIGH_VALUE'
  ).length;
  const avgSpend =
    safeCustomers.length > 0
      ? safeCustomers.reduce((s, c) => s + c.totalSpend, 0) / safeCustomers.length
      : 0;
  const avgRating =
    safeReviews.length > 0
      ? (safeReviews.reduce((s, r) => s + r.rating, 0) / safeReviews.length).toFixed(1)
      : '0.0';

  const groupCounts: Array<{ key: BrandCustomer['group']; title: string; desc: string }> = [
    { key: 'NEW', title: 'New Buyers', desc: 'First-time shoppers exploring your storefront.' },
    { key: 'RETURNING', title: 'Returning Customers', desc: 'Repeat buyers with 2+ settled orders.' },
    { key: 'HIGH_VALUE', title: 'High Value', desc: 'High average order value across multiple collections.' },
    { key: 'VIP', title: 'VIP Patronage', desc: 'Top-tier repeat shoppers eligible for early drops.' },
  ];

  const filteredReviews = safeReviews.filter((r) => {
    if (reviewFilter === 'UNREPLIED') return !r.reply;
    if (reviewFilter === 'REPORTED') return Boolean(r.reported);
    return true;
  });

  return (
    <PermissionGate module="customers" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Customer Intelligence"
          title="Customers, Segments & Reviews"
          subtitle="Understand repeat brand patrons, customer groups, and moderate verified purchase reviews."
        />

        <div className="flex flex-wrap gap-2">
          {CUSTOMER_TABS.map((t) => (
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
          <KpiCard label="Total Customers" value={safeCustomers.length} icon={<Users className="w-4 h-4" />} />
          <KpiCard label="VIP & High Value" value={vipCount} icon={<UserCheck className="w-4 h-4" />} />
          <KpiCard label="Avg Lifetime Spend" value={`৳${avgSpend.toFixed(2)}`} icon={<ShieldCheck className="w-4 h-4" />} />
          <KpiCard label="Average Store Rating" value={`${avgRating} / 5`} icon={<Star className="w-4 h-4 text-amber-500" />} />
        </div>

        {tab === 'all' && (
          <SectionCard
            title="Customer Directory"
            subtitle="Only shoppers associated with your brand's orders & accounts are shown."
            right={
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, city..."
                    className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const csv = [
                      ['ID', 'Name', 'Email', 'Group', 'City', 'Orders', 'Total Spend'].join(','),
                      ...filteredCustomers.map((c) =>
                        [c.id, c.name, c.email, c.group, c.city, c.orderCount, c.totalSpend.toFixed(2)]
                          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                          .join(',')
                      ),
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'brand-customers.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('Exported customer directory CSV.');
                  }}
                  className="gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </Button>
              </div>
            }
          >
            <div className="flex flex-wrap gap-1.5 pb-2">
              {['ALL', 'NEW', 'RETURNING', 'HIGH_VALUE', 'VIP'].map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setGroupFilter(grp)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    groupFilter === grp
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {grp.replace('_', ' ')}
                </button>
              ))}
            </div>

            {filteredCustomers.length === 0 ? (
              <EmptyState title="No customers found" description="Try clearing the search query or segment filter." />
            ) : (
              <>
                <div className="sm:hidden space-y-2.5">
                  {filteredCustomers.map((c) => (
                    <div key={c.id} className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-2.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{c.name}</p>
                          <p className="text-[11px] text-slate-500 break-all">{c.email}</p>
                        </div>
                        <StatusBadge status={c.group} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">City</span>
                          <span className="font-semibold text-slate-700">{c.city}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block">Orders / Spend</span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            {c.orderCount} · ${c.totalSpend.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-slate-400">Active {c.lastActivityAt}</span>
                        <Link href={`/dashboard/customers/${encodeURIComponent(c.id)}`}>
                          <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5 pr-4">Customer</th>
                        <th className="py-2.5 pr-4">Group</th>
                        <th className="py-2.5 pr-4">City</th>
                        <th className="py-2.5 pr-4">Orders</th>
                        <th className="py-2.5 pr-4">Lifetime Spend</th>
                        <th className="py-2.5 pr-4">Last Activity</th>
                        <th className="py-2.5 text-right">Profile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70">
                          <td className="py-3 pr-4">
                            <p className="font-bold text-slate-900">{c.name}</p>
                            <p className="text-[11px] text-slate-500">{c.email}</p>
                          </td>
                          <td className="py-3 pr-4">
                            <StatusBadge status={c.group} />
                          </td>
                          <td className="py-3 pr-4 text-slate-600">{c.city}</td>
                          <td className="py-3 pr-4 font-semibold">{c.orderCount}</td>
                          <td className="py-3 pr-4 font-bold text-slate-900">৳{c.totalSpend.toFixed(2)}</td>
                          <td className="py-3 pr-4 text-slate-500">{c.lastActivityAt}</td>
                          <td className="py-3 text-right">
                            <Link href={`/dashboard/customers/${encodeURIComponent(c.id)}`}>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                View Profile
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SectionCard>
        )}

        {tab === 'groups' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupCounts.map((grp) => {
              const members = safeCustomers.filter((c) => c.group === grp.key);
              const total = members.reduce((s, m) => s + m.totalSpend, 0);
              return (
                <SectionCard
                  key={grp.key}
                  title={grp.title}
                  subtitle={grp.desc}
                  right={<StatusBadge status={grp.key} />}
                >
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xl sm:text-2xl font-extrabold text-slate-950">{members.length} shoppers</p>
                      <p className="text-xs text-slate-500">Combined spend: ${total.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setGroupFilter(grp.key);
                        setTab('all');
                      }}
                    >
                      Filter Directory
                    </Button>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        )}

        {tab === 'reviews' && (
          <SectionCard
            title="Verified Customer Reviews & Ratings"
            subtitle="Reply publicly as the brand owner or flag inappropriate submissions for moderation."
            right={
              <div className="flex flex-wrap gap-1.5">
                {(['ALL', 'UNREPLIED', 'REPORTED'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setReviewFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                      reviewFilter === f
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            }
          >
            {filteredReviews.length === 0 ? (
              <EmptyState title="No reviews match this filter" description="Customer product ratings will appear here." />
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="font-bold text-slate-900">{r.customerName}</span>
                          {r.verifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3" /> Verified Purchase
                            </span>
                          )}
                          {r.reported && <StatusBadge status="FLAGGED" />}
                        </div>
                        <p className="text-slate-500 mt-0.5">
                          Product: <strong>{r.productName}</strong> • {r.createdAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-600 flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {r.rating}.0
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canEdit}
                          onClick={() => {
                            toggleReportReview(r.id);
                            recordAudit('REVIEW_FLAG_TOGGLED', r.id, r.reported ? 'Unflagged review' : 'Reported review');
                          }}
                          className="h-7 px-2 text-xs text-slate-500"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-slate-700 leading-relaxed">{r.comment}</p>

                    {r.reply ? (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1">
                        <p className="text-[11px] font-bold text-slate-700">Brand Owner Reply</p>
                        <p className="text-slate-600">{r.reply}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={replyDrafts[r.id] || ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))
                          }
                          placeholder="Write a helpful public response..."
                          className="w-full sm:flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                        />
                        <Button
                          size="sm"
                          disabled={!canEdit || !(replyDrafts[r.id] || '').trim()}
                          onClick={() => {
                            const text = (replyDrafts[r.id] || '').trim();
                            replyToReview(r.id, text);
                            recordAudit('REVIEW_REPLIED', r.productName, `Replied to ${r.customerName}`);
                            showToast('Published brand reply.');
                          }}
                          className="gap-1.5 w-full sm:w-auto justify-center"
                        >
                          <MessageSquareReply className="w-3.5 h-3.5" /> Reply
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </PermissionGate>
  );
}

