'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, Palette, ShieldCheck, Store } from 'lucide-react';

const SETTINGS_TABS = [
  { href: '/dashboard/settings', label: 'Brand', hint: 'Profile, theme, logos', icon: Palette },
  { href: '/dashboard/settings/store', label: 'Store', hint: 'Open, delivery, Google', icon: Store },
  { href: '/dashboard/settings/privacy', label: 'Try-on privacy', hint: 'Photos and consent', icon: Lock },
  { href: '/dashboard/settings/account', label: 'Account & security', hint: 'Owner, password, devices', icon: ShieldCheck },
] as const;

/** The one tab bar shared by every settings page. */
export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
      {SETTINGS_TABS.map((t) => {
        const active = t.href === '/dashboard/settings' ? pathname === t.href : pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-w-fit flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-colors ${
              active ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">
              <span className="block text-xs font-bold leading-tight">{t.label}</span>
              <span className={`hidden text-[10px] leading-tight sm:block ${active ? 'text-slate-300' : 'text-slate-400'}`}>{t.hint}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
