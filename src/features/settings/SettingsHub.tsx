'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ExternalLink, Search } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { brandWorkspaceApi, type StoreSettings } from '../../services/brandService';
import type { BrandVerificationSummary } from '../../services';
import { PageHeader, PermissionGate } from '../../components/shared/UiPrimitives';
import {
  SETTINGS_GROUPS,
  SETTINGS_MODULES,
  searchSettingsModules,
  settingsHref,
  type SettingsModuleId,
} from '../../config/settingsModules';

type Tone = 'good' | 'warn' | 'plain';
interface Status {
  text: string;
  tone: Tone;
}

const TONE: Record<Tone, string> = {
  good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warn: 'bg-amber-50 text-amber-800 border-amber-200',
  plain: 'bg-slate-50 text-slate-600 border-slate-200',
};

const money = (n: number) => `৳${n.toLocaleString()}`;

export function SettingsHub() {
  const profile = useWorkspaceStore((s) => s.profile);
  const tryOnConfig = useWorkspaceStore((s) => s.tryOnConfig);
  const [store, setStore] = useState<StoreSettings | null>(null);
  const [verification, setVerification] = useState<BrandVerificationSummary | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    brandWorkspaceApi.getStoreSettings().then((s) => alive && setStore(s)).catch(() => undefined);
    brandWorkspaceApi.getVerification().then((v) => alive && setVerification(v)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const status = useMemo<Partial<Record<SettingsModuleId, Status>>>(() => {
    const socials = Object.values(profile.socialLinks || {}).filter(Boolean).length;
    const media = [profile.logo, profile.banner].filter(Boolean).length;
    const out: Partial<Record<SettingsModuleId, Status>> = {
      profile: profile.name ? { text: profile.name, tone: 'plain' } : { text: 'Add your brand name', tone: 'warn' },
      business: profile.legalName || profile.registrationNumber
        ? { text: profile.legalName || 'Details added', tone: 'plain' }
        : { text: 'Not filled in', tone: 'warn' },
      social: socials ? { text: `${socials} link${socials > 1 ? 's' : ''} added`, tone: 'plain' } : { text: 'None added', tone: 'warn' },
      theme: { text: profile.headingFont || 'Default theme', tone: 'plain' },
      media: media === 2 ? { text: 'Logo and banner set', tone: 'good' } : { text: `${media} of 2 images added`, tone: 'warn' },
      privacy: {
        text: `${tryOnConfig.retentionDays} days · consent ${tryOnConfig.requireConsent ? 'on' : 'off'}`,
        tone: 'plain',
      },
      account: profile.owner ? { text: profile.owner, tone: 'plain' } : undefined,
    };
    if (verification) {
      out.verification = {
        text: `${verification.verificationScore}% complete`,
        tone: verification.verificationScore >= 100 ? 'good' : 'warn',
      };
    }
    if (store) {
      out.store = { text: store.open ? 'Open' : 'Closed', tone: store.open ? 'good' : 'warn' };
      out.delivery = {
        text: store.shipping.freeOver !== null
          ? `${money(store.shipping.defaultFee)} · free over ${money(store.shipping.freeOver)}`
          : `${money(store.shipping.defaultFee)} flat`,
        tone: 'plain',
      };
      out.seo = store.seo.title.trim() ? { text: 'Custom title set', tone: 'good' } : { text: 'Using automatic title', tone: 'plain' };
    }
    return out;
  }, [profile, tryOnConfig, store, verification]);

  const matches = useMemo(() => new Set(searchSettingsModules(query).map((m) => m.id)), [query]);

  return (
    <PermissionGate module="settings" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Settings"
          title="Settings"
          subtitle="Pick what you want to change. Each one opens on its own page with a back button."
          actions={
            <Link
              href={`/brands/${profile.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              View live shop <ExternalLink className="h-3 w-3" />
            </Link>
          }
        />

        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search settings… (delivery, logo, password)"
            aria-label="Search settings"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-20 text-sm focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10"
          />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('settings:open-palette'))}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-50"
            title="Jump to a setting from anywhere in Settings"
          >
            Ctrl K
          </button>
        </div>

        {matches.size === 0 && <p className="text-sm text-slate-500">No setting matches “{query}”.</p>}

        {SETTINGS_GROUPS.map((group) => {
          const items = SETTINGS_MODULES.filter((m) => m.group === group && matches.has(m.id));
          if (items.length === 0) return null;
          return (
            <section key={group} className="space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{group}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((m) => {
                  const Icon = m.icon;
                  const st = status[m.id];
                  return (
                    <Link
                      key={m.id}
                      href={settingsHref(m.id)}
                      className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-400"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-900">
                          <Icon className="h-5 w-5" />
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-slate-950">{m.title}</h3>
                        <p className="text-xs text-slate-500">{m.description}</p>
                      </div>
                      {st && (
                        <span className={`mt-auto inline-flex w-fit max-w-full items-center truncate rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONE[st.tone]}`}>
                          {st.text}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </PermissionGate>
  );
}
