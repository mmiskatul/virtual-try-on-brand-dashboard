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
  Lock,
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
import { GettingStartedWizard } from '../../features/onboarding/GettingStartedWizard';

export interface VerifiedBrandShellUser {
  userId: string;
  email: string;
  name?: string | null;
  role: string;
  tenantId?: string;
  onboardingCompleted?: boolean;
}

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

export function DashboardShell({
  children,
  verifiedUser,
}: {
  children: React.ReactNode;
  verifiedUser?: VerifiedBrandShellUser;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const { data: session } = useSession();
  const { syncNow, authInvalid } = useBrandSync(
    verifiedUser?.tenantId,
    Boolean(verifiedUser?.userId)
  );

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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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

  const { data: authSession, status: authSessionStatus } = useSession();
  const lastSyncedAt = useWorkspaceStore((s) => s.lastSyncedAt);
  const onboardedTenantIds = useWorkspaceStore((s) => s.onboardedTenantIds);
  const backendOnboardingStatusByTenant = useWorkspaceStore(
    (s) => s.backendOnboardingStatusByTenant
  );
  const onboardingProfileDrafts = useWorkspaceStore((s) => s.onboardingProfileDrafts);
  const saveOnboardingProfileForTenant = useWorkspaceStore((s) => s.saveOnboardingProfileForTenant);

  const [storeHydrated, setStoreHydrated] = useState(false);
  const syncedDraftKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setStoreHydrated(useWorkspaceStore.persist.hasHydrated());
    const unsub = useWorkspaceStore.persist.onFinishHydration(() => {
      setStoreHydrated(true);
    });
    return () => {
      unsub();
    };
  }, []);

  const effectiveRole = authSession?.user?.role || verifiedUser?.role || '';
  const activeTenantId = String(
    verifiedUser?.tenantId || authSession?.user?.tenantId || profile.id || 'tenant_aura'
  ).trim();
  const sessionRoleUpper = String(effectiveRole).toUpperCase();
  const isOwnerUser = sessionRoleUpper === 'BRAND_OWNER' || sessionRoleUpper === 'OWNER';
  const isAuthenticated = Boolean(verifiedUser?.userId) || authSessionStatus === 'authenticated';
  const backendOnboardingStatus = activeTenantId
    ? backendOnboardingStatusByTenant[activeTenantId]
    : undefined;
  const setBackendOnboardingStatus = useWorkspaceStore((s) => s.setBackendOnboardingStatus);
  const isBackendCheckPending =
    isAuthenticated &&
    isOwnerUser &&
    Boolean(activeTenantId) &&
    backendOnboardingStatus === undefined;
  const isTenantOnboarded =
    typeof backendOnboardingStatus === 'boolean'
      ? backendOnboardingStatus
      : typeof verifiedUser?.onboardingCompleted === 'boolean'
      ? verifiedUser.onboardingCompleted
      : activeTenantId
      ? onboardedTenantIds.includes(activeTenantId)
      : true;

  const isCheckingOnboardingGate =
    isAuthenticated && isOwnerUser && (!mounted || !storeHydrated || isBackendCheckPending);
  const isOnboardingGateActive =
    mounted &&
    storeHydrated &&
    !isBackendCheckPending &&
    isAuthenticated &&
    isOwnerUser &&
    Boolean(activeTenantId) &&
    !isTenantOnboarded;

  useEffect(() => {
    if (!authInvalid) return;
    let cancelled = false;
    void (async () => {
      const { logoutBrand } = await import('../../lib/logout');
      if (!cancelled) {
        await logoutBrand({ callbackUrl: '/login' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authInvalid]);

  useEffect(() => {
    if (!isCheckingOnboardingGate || !activeTenantId || !mounted || !storeHydrated) return;
    const retryTimer = setTimeout(() => {
      void syncNow();
    }, 2000);
    const fallbackTimer = setTimeout(() => {
      const currentStatus =
        useWorkspaceStore.getState().backendOnboardingStatusByTenant[activeTenantId];
      if (currentStatus === undefined) {
        setBackendOnboardingStatus(
          activeTenantId,
          typeof verifiedUser?.onboardingCompleted === 'boolean'
            ? verifiedUser.onboardingCompleted
            : null
        );
      }
    }, 6000);
    return () => {
      clearTimeout(retryTimer);
      clearTimeout(fallbackTimer);
    };
  }, [
    activeTenantId,
    isCheckingOnboardingGate,
    mounted,
    setBackendOnboardingStatus,
    storeHydrated,
    syncNow,
    verifiedUser?.onboardingCompleted,
  ]);

  useEffect(() => {
    if (!storeHydrated || !mounted || !activeTenantId) return;
    const syncKey = `${activeTenantId}:${profile.id || 'none'}:${isTenantOnboarded ? 'on' : 'off'}:${lastSyncedAt || 'init'}`;
    if (syncedDraftKeyRef.current === syncKey) return;
    syncedDraftKeyRef.current = syncKey;

    const savedDraft = onboardingProfileDrafts[activeTenantId];
    const liveMatchesTenant = profile.id === activeTenantId;
    const liveHasExplicitOnboarding =
      liveMatchesTenant &&
      (isTenantOnboarded ||
        Boolean(
          profile.seo?.title ||
            profile.slogan ||
            profile.shortDescription ||
            profile.legalName ||
            profile.businessType ||
            profile.specialties?.length ||
            profile.categoryFocus
        ));
    if (!savedDraft && !liveHasExplicitOnboarding) return;

    saveOnboardingProfileForTenant(activeTenantId, {
      ...(savedDraft || {}),
      ...(liveHasExplicitOnboarding && profile.name ? { name: profile.name } : {}),
      ...(liveHasExplicitOnboarding && profile.email ? { email: profile.email } : {}),
      ...(liveHasExplicitOnboarding && profile.owner ? { owner: profile.owner } : {}),
      ...(liveHasExplicitOnboarding && profile.legalName ? { legalName: profile.legalName } : {}),
      ...(liveHasExplicitOnboarding && profile.businessType ? { businessType: profile.businessType } : {}),
      ...(liveHasExplicitOnboarding && profile.phone ? { phone: profile.phone } : {}),
      ...(liveHasExplicitOnboarding && profile.city ? { city: profile.city } : {}),
      ...(liveHasExplicitOnboarding && profile.country ? { country: profile.country } : {}),
      ...(liveHasExplicitOnboarding && profile.address ? { address: profile.address } : {}),
      ...(liveHasExplicitOnboarding && profile.categoryFocus ? { categoryFocus: profile.categoryFocus } : {}),
      ...(liveHasExplicitOnboarding && profile.specialties?.length ? { specialties: profile.specialties } : {}),
      ...(liveHasExplicitOnboarding && profile.slogan ? { slogan: profile.slogan } : {}),
      ...(liveHasExplicitOnboarding && profile.shortDescription ? { shortDescription: profile.shortDescription } : {}),
      ...(liveHasExplicitOnboarding && profile.description ? { description: profile.description } : {}),
      ...(liveHasExplicitOnboarding && profile.brandStory ? { brandStory: profile.brandStory } : {}),
      ...(liveHasExplicitOnboarding && profile.logo ? { logo: profile.logo } : {}),
      ...(liveHasExplicitOnboarding && profile.banner ? { banner: profile.banner } : {}),
      ...(liveHasExplicitOnboarding && profile.primaryColor ? { primaryColor: profile.primaryColor } : {}),
      ...(liveHasExplicitOnboarding && profile.accentColor ? { accentColor: profile.accentColor } : {}),
      ...(liveHasExplicitOnboarding && profile.announcement ? { announcement: profile.announcement } : {}),
      ...(liveHasExplicitOnboarding && profile.seo?.title ? { seo: profile.seo } : {}),
      ...(liveHasExplicitOnboarding && profile.socialLinks ? { socialLinks: profile.socialLinks } : {}),
      ...(liveHasExplicitOnboarding && profile.settings ? { settings: profile.settings } : {}),
    });
  }, [
    storeHydrated,
    mounted,
    activeTenantId,
    lastSyncedAt,
    profile.id,
    profile.name,
    profile.email,
    profile.owner,
    profile.legalName,
    profile.businessType,
    profile.phone,
    profile.city,
    profile.country,
    profile.address,
    profile.categoryFocus,
    profile.specialties,
    profile.slogan,
    profile.shortDescription,
    profile.description,
    profile.brandStory,
    profile.logo,
    profile.banner,
    profile.primaryColor,
    profile.accentColor,
    profile.announcement,
    profile.seo,
    profile.socialLinks,
    profile.settings,
    isTenantOnboarded,
    onboardingProfileDrafts,
    saveOnboardingProfileForTenant,
  ]);

  useEffect(() => {
    if (!isOnboardingGateActive && !isCheckingOnboardingGate) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOnboardingGateActive, isCheckingOnboardingGate]);

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
          <Link href={isOnboardingGateActive ? '/dashboard/getting-started' : '/dashboard'} className="flex items-center gap-2.5 min-w-0">
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

        {isOnboardingGateActive && (!sidebarCollapsed || isMobile) && (
          <div className="mx-1 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Owner Setup Required</span>
            </p>
            <p className="text-amber-800 leading-relaxed">
              Complete brand onboarding profile, title, and starter setup to unlock workspace sections.
            </p>
          </div>
        )}

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
                      router.push(isOnboardingGateActive ? '/dashboard/getting-started' : visibleItems[0].href);
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
                      const lockedByOnboarding =
                        isOnboardingGateActive && !item.href.startsWith('/dashboard/getting-started');
                      const badgeVal = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

                      if (lockedByOnboarding) {
                        return (
                          <button
                            key={item.href}
                            type="button"
                            onClick={() => {
                              showToast('Complete Brand Onboarding first to access other workspace modules.');
                              setTimeout(hideToast, 3000);
                              if (isMobile) setMobileMenuOpen(false);
                              router.push('/dashboard/getting-started');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-100/60 font-medium cursor-not-allowed text-left"
                          >
                            <span className="truncate">{item.label}</span>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                              Setup
                            </span>
                          </button>
                        );
                      }

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

      {/* Bottom Public Storefront / Try-On Links + Role + Credits */}
      {(!sidebarCollapsed || isMobile) && (
        <div className="p-3 border-t border-slate-200 space-y-2.5 bg-slate-50/80">
          {isMobile && (
            <div className="md:hidden space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-slate-500">Staff Role</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isLiveBackend
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isLiveBackend ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {isLiveBackend ? 'Live Sync' : 'Demo'}
                </span>
              </div>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as StaffRole)}
                aria-label="Active Staff Role"
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none"
              >
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                  <option key={role} value={role}>
                    Role: {ROLE_LABELS[role].label}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              <span className="font-bold text-slate-900 tabular-nums">
                {profile.quotaUsed}/{profile.quotaMax}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-slate-950 rounded-full" style={{ width: `${quotaPct}%` }} />
            </div>
          </div>

          {isMobile && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setHelpOpen(true);
              }}
              className="sm:hidden w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Workspace Docs</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  const shellBlocked = isOnboardingGateActive || isCheckingOnboardingGate;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-clip">
      <ToastNotification message={toastMessage} />

      {/* Desktop Left Sidebar */}
      <aside
        aria-hidden={shellBlocked || undefined}
        className={`hidden lg:block sticky top-0 h-screen shrink-0 transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-[272px]'
        } ${shellBlocked ? 'pointer-events-none select-none opacity-40 blur-[2px]' : ''}`}
      >
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && !shellBlocked && (
        <div className="fixed inset-0 z-50 lg:hidden flex bg-black/50 backdrop-blur-sm">
          <div className="w-[85vw] max-w-72 h-full shadow-2xl">{renderSidebarBody(true)}</div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Column */}
      <div
        aria-hidden={shellBlocked || undefined}
        className={`flex-1 flex flex-col min-w-0 ${
          shellBlocked ? 'pointer-events-none select-none opacity-40 blur-[2px] h-screen overflow-hidden' : ''
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Sidebar Toggle + Mobile Brand + Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200/80 shrink-0"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <Link
              href={isOnboardingGateActive ? '/dashboard/getting-started' : '/dashboard'}
              className="md:hidden font-extrabold text-xs sm:text-sm text-slate-950 truncate max-w-[120px] sm:max-w-[180px]"
            >
              {profile.name}
            </Link>

            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              aria-label="Toggle sidebar width"
              className="hidden lg:inline-flex p-2 rounded-xl text-slate-500 hover:text-slate-950 hover:bg-slate-100 shrink-0"
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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSearchOpen((o) => !o)}
              aria-label="Toggle mobile search"
              className={`sm:hidden p-2 rounded-xl border transition-colors ${
                mobileSearchOpen
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

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
                <span className="max-w-[84px] sm:max-w-[140px] truncate font-semibold hidden min-[400px]:inline sm:inline">
                  {merchantDisplayName}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-1.5rem))] bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 z-50 text-xs">
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
                      onClick={async () => {
                        const { logoutBrand } = await import('../../lib/logout');
                        await logoutBrand({ callbackUrl: '/login' });
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

        {/* Expandable Mobile Search Strip (< sm) */}
        {mobileSearchOpen && (
          <div className="sm:hidden border-b border-slate-200 bg-white px-3 py-2.5 z-20">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, SKUs, orders, customers..."
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
              {searchQuery.trim() && (
                <div className="mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg p-1.5 max-h-64 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="text-xs text-slate-500 p-3 text-center">No matching workspace items found.</p>
                  ) : (
                    searchResults.map((res, idx) => (
                      <Link
                        key={idx}
                        href={res.href}
                        onClick={() => {
                          setSearchQuery('');
                          setMobileSearchOpen(false);
                        }}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 text-xs gap-2"
                      >
                        <span className="font-semibold text-slate-900 truncate">{res.label}</span>
                        <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
                          {res.category}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Workspace Content */}
        <main className="flex-1 px-3.5 py-4 pb-24 sm:p-6 lg:p-8 lg:pb-8 max-w-[1440px] w-full mx-auto space-y-5 sm:space-y-6">
          {shellBlocked ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
              <p className="text-sm font-bold text-slate-900">Brand Workspace Locked</p>
              <p className="text-xs text-slate-500">
                Complete the Setup Required popup to unlock dashboard access.
              </p>
            </div>
          ) : (
            children
          )}
        </main>

        {/* Mobile Quick Dock (< lg) */}
        <nav
          aria-label="Mobile quick navigation"
          className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1.5 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
        >
          {[
            { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, match: (p: string) => p === '/dashboard' || p === '/dashboard/overview' },
            { label: 'Products', href: '/dashboard/products', icon: ShoppingBag, match: (p: string) => p.startsWith('/dashboard/products') },
            { label: 'Orders', href: '/dashboard/orders', icon: PackageCheck, match: (p: string) => p.startsWith('/dashboard/orders') },
            { label: 'Try-On', href: '/dashboard/virtual-try-on', icon: Sparkles, match: (p: string) => p.startsWith('/dashboard/virtual-try-on') },
          ].map((nav) => {
            const NavIcon = nav.icon;
            const active = nav.match(pathname);
            return (
              <Link
                key={nav.href}
                href={nav.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-colors min-w-[58px] ${
                  active ? 'text-slate-950 bg-slate-100' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <NavIcon className="w-4 h-4" />
                <span>{nav.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900 min-w-[58px]"
          >
            <Menu className="w-4 h-4" />
            <span>Modules</span>
          </button>
        </nav>
      </div>

      {/* Help Center Modal */}
      {helpOpen && !shellBlocked && (
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

      {/* Initial Hydration Guard for Owner Onboarding */}
      {isCheckingOnboardingGate && (
        <div className="fixed inset-0 z-[100] bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-sm w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 text-white mx-auto flex items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <p className="text-sm font-bold text-slate-950">Verifying Brand Workspace Setup</p>
            <p className="text-xs text-slate-500">Checking your brand onboarding status...</p>
          </div>
        </div>
      )}

      {/* Blocking Setup Required Popup Overlay (Owner must complete before accessing Dashboard) */}
      {isOnboardingGateActive && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="setup-required-dialog-title"
          className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-start sm:items-center justify-center p-2.5 sm:p-6 overflow-y-auto"
        >
          <div className="my-auto max-w-5xl w-full rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                      Setup Needed
                    </span>
                    <h2
                      id="setup-required-dialog-title"
                      className="text-sm sm:text-base font-extrabold text-slate-950 truncate"
                    >
                      Finish Your Shop Setup to Open Dashboard
                    </h2>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                    Signed in as {authSession?.user?.email || verifiedUser?.email || profile.email} — fill in the quick steps below to start using your shop dashboard.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const { logoutBrand } = await import('../../lib/logout');
                  await logoutBrand({ callbackUrl: '/login' });
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-700 text-xs font-bold shrink-0 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 bg-[#F8FAFC]">
              <GettingStartedWizard
                embeddedInModal
                verifiedTenantId={activeTenantId}
                verifiedName={authSession?.user?.name ?? verifiedUser?.name}
                verifiedEmail={authSession?.user?.email ?? verifiedUser?.email}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

