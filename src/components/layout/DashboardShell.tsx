'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Globe,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  PackageCheck,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { SIDEBAR_NAV_GROUPS } from '../../config/navigation';
import { canPerform, ROLE_LABELS } from '../../config/permissions';
import { StaffRole } from '../../types';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { useBrandSync } from '../../hooks/useBrandSync';
import { useMounted } from '../../hooks/useMounted';
import { ToastNotification } from '../ui/ToastNotification';
import { SafeImage } from '../shared/UiPrimitives';

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Palette,
  Store,
  ShoppingBag,
  Globe,
  Sparkles,
  PackageCheck,
  Boxes,
  Users,
  Megaphone,
  BarChart3,
  UserCog,
  CreditCard,
  Plug,
  Settings,
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const { data: session } = useSession();
  const { syncNow } = useBrandSync();

  const profile = useWorkspaceStore((s) => s.profile);
  const products = useWorkspaceStore((s) => s.products);
  const orders = useWorkspaceStore((s) => s.orders);
  const customers = useWorkspaceStore((s) => s.customers);
  const marketplacePosts = useWorkspaceStore((s) => s.marketplacePosts);
  const isLiveBackend = useWorkspaceStore((s) => s.isLiveBackend);
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);
  const sidebarCollapsed = useWorkspaceStore((s) => s.sidebarCollapsed);
  const openGroups = useWorkspaceStore((s) => s.openGroups);

  const setActiveRole = useWorkspaceStore((s) => s.setActiveRole);
  const toggleSidebarCollapsed = useWorkspaceStore((s) => s.toggleSidebarCollapsed);
  const toggleNavGroup = useWorkspaceStore((s) => s.toggleNavGroup);

  const toastMessage = useUiStore((s) => s.toastMessage);
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const accountWrapperRef = useRef<HTMLDivElement>(null);
  const notifWrapperRef = useRef<HTMLDivElement>(null);
  const quickCreateWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (accountWrapperRef.current && !accountWrapperRef.current.contains(target)) {
        setAccountMenuOpen(false);
      }
      if (notifWrapperRef.current && !notifWrapperRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (quickCreateWrapperRef.current && !quickCreateWrapperRef.current.contains(target)) {
        setQuickCreateOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAccountMenuOpen(false);
        setNotifOpen(false);
        setQuickCreateOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const merchantDisplayName = session?.user?.name?.trim() || profile.owner || 'Merchant';
  const merchantInitial = merchantDisplayName.charAt(0).toUpperCase() || 'M';

  const safeProducts = mounted ? products : [];
  const safeOrders = mounted ? orders : [];
  const safeCustomers = mounted ? customers : [];
  const safePosts = mounted ? marketplacePosts : [];

  const pendingOrdersCount = safeOrders.filter((o) => o.status === 'PENDING' || o.status === 'PROCESSING').length;
  const lowStockCount = safeProducts.filter((p) => p.stock < (p.lowStockThreshold || 5)).length;
  const draftPostsCount = safePosts.filter((p) => p.status === 'DRAFT').length;

  const badgeCounts: Record<string, number> = {
    orders: pendingOrdersCount,
    lowStock: lowStockCount,
    draftPosts: draftPostsCount,
  };

  // Dynamic Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const segs = pathname.split('/').filter(Boolean);
    return segs.map((seg, idx) => ({
      label: seg.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      href: '/' + segs.slice(0, idx + 1).join('/'),
      isLast: idx === segs.length - 1,
    }));
  }, [pathname]);

  // Permission-filtered Global Search Results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{ category: string; label: string; href: string }> = [];

    if (canPerform(activeRole, 'products', 'view', roleOverrides)) {
      safeProducts
        .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
        .slice(0, 4)
        .forEach((p) =>
          results.push({ category: 'Product', label: `${p.name} (${p.sku})`, href: `/dashboard/products/${p.id}` })
        );
    }
    if (canPerform(activeRole, 'orders', 'view', roleOverrides)) {
      safeOrders
        .filter((o) => o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach((o) =>
          results.push({ category: 'Order', label: `${o.id} — ${o.customerName}`, href: `/dashboard/orders/${o.id}` })
        );
    }
    if (canPerform(activeRole, 'customers', 'view', roleOverrides)) {
      safeCustomers
        .filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach((c) =>
          results.push({ category: 'Customer', label: `${c.name} (${c.city})`, href: `/dashboard/customers/${c.id}` })
        );
    }
    SIDEBAR_NAV_GROUPS.forEach((g) => {
      g.items.forEach((item) => {
        if (item.label.toLowerCase().includes(q) && canPerform(activeRole, item.module, 'view', roleOverrides)) {
          results.push({ category: g.label, label: item.label, href: item.href });
        }
      });
    });

    return results.slice(0, 10);
  }, [searchQuery, safeProducts, safeOrders, safeCustomers, activeRole, roleOverrides]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const live = await syncNow();
    setRefreshing(false);
    showToast(live ? 'Synchronized tenant workspace with backend.' : 'Showing workspace data (backend offline or unauthenticated).');
    setTimeout(hideToast, 3000);
  };

  const quotaPct = profile.quotaMax > 0 ? Math.min(100, Math.round((profile.quotaUsed / profile.quotaMax) * 100)) : 0;

  const renderSidebarBody = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between bg-white border-r border-slate-200">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Workspace Identity */}
        <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
              <SafeImage src={profile.logo} alt={profile.name} fill className="object-cover" />
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-950 truncate flex items-center gap-1.5">
                  <span>{profile.name}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                    {profile.plan}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 truncate">/{profile.slug}</p>
              </div>
            )}
          </Link>
          {isMobile && (
            <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Collapsible Navigation Groups */}
        <nav className="space-y-1.5" aria-label="Brand Dashboard Navigation">
          {SIDEBAR_NAV_GROUPS.map((group) => {
            const Icon = GROUP_ICONS[group.icon] || LayoutDashboard;
            const visibleItems = group.items.filter((item) =>
              canPerform(activeRole, item.module, 'view', roleOverrides)
            );
            if (visibleItems.length === 0) return null;

            const groupExpanded = openGroups.includes(group.id) || visibleItems.some((i) => pathname === i.href);

            return (
              <div key={group.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (sidebarCollapsed && !isMobile) {
                      router.push(visibleItems[0].href);
                    } else {
                      toggleNavGroup(group.id);
                    }
                  }}
                  title={group.label}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-slate-700" />
                    {(!sidebarCollapsed || isMobile) && <span className="truncate">{group.label}</span>}
                  </span>
                  {(!sidebarCollapsed || isMobile) && (
                    groupExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                {groupExpanded && (!sidebarCollapsed || isMobile) && (
                  <div className="pl-7 pr-1 space-y-0.5">
                    {visibleItems.map((item) => {
                      const active = pathname === item.href;
                      const badgeVal = item.badgeKey ? badgeCounts[item.badgeKey] : 0;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => isMobile && setMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            active
                              ? 'bg-slate-950 text-white font-bold shadow-sm'
                              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <span className="truncate">{item.label}</span>
                          {badgeVal > 0 && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                active ? 'bg-white text-slate-950' : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {badgeVal}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Public Storefront / Try-On Links + Credits */}
      {(!sidebarCollapsed || isMobile) && (
        <div className="p-3 border-t border-slate-200 space-y-2.5 bg-slate-50/80">
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href={`/brands/${profile.slug}`}
              target="_blank"
              className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-900 text-[11px] font-bold text-slate-800 transition-colors"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href={`/try/${profile.slug}`}
              target="_blank"
              className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Public Try-On</span>
            </Link>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 font-medium">AI Try-On Credits</span>
              <span className="font-bold text-slate-900">
                {profile.quotaUsed}/{profile.quotaMax}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-slate-950 rounded-full" style={{ width: `${quotaPct}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      <ToastNotification message={toastMessage} />

      {/* Desktop Left Sidebar */}
      <aside className={`hidden lg:block sticky top-0 h-screen shrink-0 transition-all duration-200 ${sidebarCollapsed ? 'w-16' : 'w-68 w-[272px]'}`}>
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex bg-black/50 backdrop-blur-sm">
          <div className="w-72 max-w-[85vw] h-full shadow-2xl">{renderSidebarBody(true)}</div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Left: Sidebar Toggle + Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              aria-label="Toggle sidebar width"
              className="hidden lg:inline-flex p-2 rounded-xl text-slate-500 hover:text-slate-950 hover:bg-slate-100"
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-xs truncate">
              {breadcrumbs.map((b) => (
                <React.Fragment key={b.href}>
                  <Link
                    href={b.href}
                    className={`truncate ${b.isLast ? 'font-bold text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    {b.label}
                  </Link>
                  {!b.isLast && <span className="text-slate-300">/</span>}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Center: Global Search */}
          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, SKUs, orders, customers, settings..."
              className="w-full pl-9 pr-8 py-2 rounded-full bg-slate-100 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {searchFocused && searchQuery.trim() && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 max-h-80 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-slate-500 p-3 text-center">No matching workspace items found.</p>
                ) : (
                  searchResults.map((res, idx) => (
                    <Link
                      key={idx}
                      href={res.href}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 text-xs"
                    >
                      <span className="font-semibold text-slate-900 truncate">{res.label}</span>
                      <span className="text-[10px] font-bold uppercase text-slate-400 ml-2 shrink-0">
                        {res.category}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2">
            {/* Live Connection Badge */}
            <span
              title={isLiveBackend ? 'Connected to live backend at port 4000' : 'Running with local workspace data (Sign in or start backend to sync live)'}
              className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                isLiveBackend
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveBackend ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isLiveBackend ? 'Live Sync' : 'Demo Workspace'}
            </span>

            {/* Active Staff Role Selector (Tests & Enforces RBAC) */}
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as StaffRole)}
              title="Active Staff Role View"
              className="hidden md:block px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-800 focus:outline-none"
            >
              {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                <option key={role} value={role}>
                  Role: {ROLE_LABELS[role].label}
                </option>
              ))}
            </select>

            {/* Quick Create Dropdown */}
            <div ref={quickCreateWrapperRef} className="relative">
              <button
                type="button"
                onClick={() => setQuickCreateOpen((o) => !o)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quick Create</span>
              </button>
              {quickCreateOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 text-xs">
                  <Link href="/dashboard/products/create" onClick={() => setQuickCreateOpen(false)} className="block px-3 py-2 rounded-xl hover:bg-slate-100 font-semibold">
                    + Add Garment Product
                  </Link>
                  <Link href="/dashboard/marketplace/create" onClick={() => setQuickCreateOpen(false)} className="block px-3 py-2 rounded-xl hover:bg-slate-100 font-semibold">
                    + Create Marketplace Post
                  </Link>
                  <Link href="/dashboard/marketing/discounts" onClick={() => setQuickCreateOpen(false)} className="block px-3 py-2 rounded-xl hover:bg-slate-100 font-semibold">
                    + New Discount Code
                  </Link>
                  <Link href="/dashboard/virtual-try-on/studio" onClick={() => setQuickCreateOpen(false)} className="block px-3 py-2 rounded-xl hover:bg-slate-100 font-semibold">
                    Open Try-On Studio
                  </Link>
                </div>
              )}
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              title="Sync Workspace"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Notifications */}
            <div ref={notifWrapperRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
                className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600"
              >
                <Bell className="w-4 h-4" />
                {(lowStockCount > 0 || pendingOrdersCount > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 z-50 space-y-2 text-xs">
                  <p className="font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Workspace Alerts
                  </p>
                  {lowStockCount > 0 && (
                    <Link href="/dashboard/inventory" onClick={() => setNotifOpen(false)} className="block p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                      {lowStockCount} product(s) below safety stock threshold
                    </Link>
                  )}
                  {pendingOrdersCount > 0 && (
                    <Link href="/dashboard/orders" onClick={() => setNotifOpen(false)} className="block p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                      {pendingOrdersCount} order(s) awaiting fulfillment
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Help Center */}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="Help & Documentation"
              className="hidden sm:inline-flex p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Account */}
            <div ref={accountWrapperRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setAccountMenuOpen((o) => !o);
                  setNotifOpen(false);
                  setQuickCreateOpen(false);
                }}
                aria-expanded={accountMenuOpen}
                aria-label="Open merchant profile menu"
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-900 transition-colors"
              >
                <div className="relative w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  <span>{merchantInitial}</span>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <span className="max-w-[110px] sm:max-w-[140px] truncate font-semibold">
                  {merchantDisplayName}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 z-50 text-xs">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                    <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {merchantInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-950 truncate">{merchantDisplayName}</p>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{session?.user?.email || profile.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <Link
                      href="/dashboard/products"
                      onClick={() => setAccountMenuOpen(false)}
                      className="p-2 rounded-xl border border-slate-100 hover:border-slate-300 bg-white text-center transition-colors"
                    >
                      <p className="font-bold text-slate-950 text-sm">{safeProducts.length}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Products</p>
                    </Link>
                    <Link
                      href="/dashboard/orders"
                      onClick={() => setAccountMenuOpen(false)}
                      className="p-2 rounded-xl border border-slate-100 hover:border-slate-300 bg-white text-center transition-colors"
                    >
                      <p className="font-bold text-slate-950 text-sm">{pendingOrdersCount}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Pending</p>
                    </Link>
                    <Link
                      href="/dashboard/marketplace"
                      onClick={() => setAccountMenuOpen(false)}
                      className="p-2 rounded-xl border border-slate-100 hover:border-slate-300 bg-white text-center transition-colors"
                    >
                      <p className="font-bold text-slate-950 text-sm">{safePosts.length}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Posts</p>
                    </Link>
                  </div>

                  <div className="space-y-0.5">
                    <Link href="/dashboard/brand/profile" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 font-medium text-slate-800">
                      <Store className="w-3.5 h-3.5 text-slate-600" />
                      <span>Brand Profile</span>
                    </Link>
                    <Link href="/dashboard/virtual-try-on/studio" onClick={() => setAccountMenuOpen(false)} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 font-medium text-slate-800">
                      <span className="inline-flex items-center gap-2.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Virtual Try-On Test Studio</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">Test</span>
                    </Link>
                    <Link href="/dashboard/orders" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 font-medium text-slate-800">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                      <span>Orders &amp; Fulfillment</span>
                    </Link>
                    <Link href="/dashboard/team" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 font-medium text-slate-800">
                      <Users className="w-3.5 h-3.5 text-slate-600" />
                      <span>Team &amp; Permissions</span>
                    </Link>
                    <Link href="/dashboard/billing" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 font-medium text-slate-800">
                      <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                      <span>Billing &amp; AI Credits</span>
                    </Link>
                    <Link href="/dashboard/settings/account" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 font-medium text-slate-800">
                      <Settings className="w-3.5 h-3.5 text-slate-600" />
                      <span>Account &amp; Settings</span>
                    </Link>
                  </div>

                  {session?.user ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') localStorage.removeItem('brand_token');
                        signOut({ callbackUrl: '/login' });
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 font-bold text-rose-600 flex items-center gap-2.5 mt-2 border-t border-slate-100 pt-2.5"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  ) : (
                    <Link href="/login" className="block px-3 py-2 rounded-xl bg-slate-950 text-white font-bold text-center mt-2">
                      Merchant Sign In
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Help Center Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base">Brand Workspace Documentation</h3>
              <button type="button" onClick={() => setHelpOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Dual Publishing Model:</strong> Every product lives in your private tenant catalog first. Enable <em>Storefront Visibility</em> to show it on your dedicated boutique (<code>/brands/{profile.slug}</code>), or explicitly create a <em>Marketplace Post</em> to publish into global discovery.
              </p>
              <p>
                <strong>Dedicated Try-On Experience:</strong> Your public try-on URL (<code>/try/{profile.slug}</code>) displays strictly garments belonging to your brand tenant and uses platform AI generation jobs.
              </p>
              <p>
                <strong>Role-Based Access:</strong> Test permissions live via the Top Header Role switcher (`Owner`, `Product Manager`, `Marketing Manager`, etc.).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

