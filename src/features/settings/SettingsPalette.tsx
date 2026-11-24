'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, Search } from 'lucide-react';
import { searchSettingsModules, settingsHref } from '../../config/settingsModules';

/** Ctrl+K (or Cmd+K) opens a quick "jump to a setting" box anywhere inside Settings. */
export function SettingsPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchSettingsModules(query), [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    // Hub search box and other places can ask for the palette too.
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('settings:open-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('settings:open-palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const go = (index: number) => {
    const m = results[index];
    if (!m) return;
    setOpen(false);
    router.push(settingsHref(m.id));
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(active);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/40 px-4 pt-[15vh]" onMouseDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to a setting"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Jump to a setting… (delivery, logo, password)"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">Esc</kbd>
        </div>
        <ul role="listbox" className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">No setting matches “{query}”.</li>}
          {results.map((m, i) => {
            const Icon = m.icon;
            return (
              <li key={m.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(i)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === active ? 'bg-slate-100' : ''}`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-700" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{m.title}</span>
                    <span className="block truncate text-xs text-slate-500">{m.description}</span>
                  </span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">{m.group}</span>
                  {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
