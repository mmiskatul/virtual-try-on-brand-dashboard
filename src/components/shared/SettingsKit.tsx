'use client';

import React, { useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

/** One look for every settings input. */
export const INPUT_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 disabled:bg-slate-50 disabled:text-slate-400';

/** A labelled text box (or text area). Use `className="sm:col-span-2"` to make it full width in a 2-column grid. */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
  rows,
  hint,
  error,
  required,
  disabled,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  /** Set to show a text area with this many rows. */
  rows?: number;
  hint?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const id = React.useId();
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-xs font-semibold text-slate-700">
        <span>
          {label}
          {required && <span className="text-rose-600"> *</span>}
        </span>
        {maxLength ? (
          <span className="text-[11px] font-normal text-slate-400">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </label>
      {rows ? (
        <textarea id={id} rows={rows} value={value} maxLength={maxLength} disabled={disabled} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={INPUT_CLASS} />
      ) : (
        <input id={id} type={type} value={value} maxLength={maxLength} disabled={disabled} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={INPUT_CLASS} />
      )}
      {hint && !error && <p className="text-[11px] text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-[11px] font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** The one Save bar used by every settings page. Sticks to the bottom so it is always in reach. */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  canEdit = true,
  error,
  label = 'Save changes',
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard?: () => void;
  canEdit?: boolean;
  error?: string | null;
  label?: string;
}) {
  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <Button type="button" size="sm" disabled={!canEdit || saving || !dirty} onClick={onSave} className="gap-1.5">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        {saving ? 'Saving…' : label}
      </Button>
      {onDiscard && dirty && !saving && (
        <Button type="button" size="sm" variant="outline" onClick={onDiscard}>
          Discard
        </Button>
      )}
      {!canEdit && <span className="text-xs text-slate-500">Only an owner or admin can change this.</span>}
      {canEdit && !dirty && !error && <span className="text-xs text-slate-400">Nothing to save</span>}
      {canEdit && dirty && !error && <span className="text-xs font-semibold text-amber-700">You have unsaved changes</span>}
      {error && (
        <p role="alert" className="text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** Warns before closing the tab or clicking a link to another page while there are unsaved changes. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm('You have unsaved changes. Leave without saving?')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);
}
