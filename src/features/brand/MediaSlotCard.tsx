'use client';

import React, { useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { SafeImage } from '../../components/shared/UiPrimitives';

interface MediaSlotCardProps {
  label: string;
  dims: string;
  /** 'wide' = hero/banner style preview, 'square' = logo style preview */
  shape: 'wide' | 'square';
  src?: string;
  busy: boolean;
  /** Shown as a small pill, e.g. "Used in storefront" or "Optional" */
  badge: string;
  badgeActive: boolean;
  onPick: () => void;
  onDropFile: (file: File) => void;
  onRemove: () => void;
}

// Checkerboard so transparent PNG logos are easy to judge.
const CHECKER =
  'bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%),linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px] bg-white';

export function MediaSlotCard({
  label,
  dims,
  shape,
  src,
  busy,
  badge,
  badgeActive,
  onPick,
  onDropFile,
  onRemove,
}: MediaSlotCardProps) {
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !busy) onDropFile(file);
  };

  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    },
    onDrop: handleDrop,
  };

  const badgeEl = (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        badgeActive ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {badge}
    </span>
  );

  const busyOverlay = busy && (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 backdrop-blur-[1px]">
      <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
      <span className="text-xs font-semibold text-slate-700">Uploading…</span>
    </div>
  );

  const frame = `relative overflow-hidden rounded-xl border transition-all ${
    dragging
      ? 'border-slate-900 ring-2 ring-slate-900/20 bg-slate-50'
      : src
        ? 'border-slate-200'
        : 'border-dashed border-slate-300 bg-slate-50/60 hover:border-slate-500 hover:bg-slate-50'
  }`;

  const emptyInner = (compact: boolean) => (
    <button
      type="button"
      disabled={busy}
      onClick={onPick}
      className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-3 text-center"
    >
      <span
        className={`flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 ${
          compact ? 'h-9 w-9' : 'h-11 w-11'
        }`}
      >
        {dragging ? <UploadCloud className="h-5 w-5 text-slate-900" /> : <ImagePlus className="h-5 w-5 text-slate-500" />}
      </span>
      <span className="text-xs font-semibold text-slate-800">
        {dragging ? 'Drop to upload' : compact ? 'Drop image' : 'Drag & drop or click to browse'}
      </span>
      {!compact && <span className="text-[11px] text-slate-400">PNG, JPG or WEBP · up to 10MB</span>}
    </button>
  );

  // ---- Logo-style card: square preview on the left, details + actions on the right ----
  if (shape === 'square') {
    return (
      <div
        {...dropHandlers}
        className={`rounded-2xl border bg-white p-4 ${badgeActive ? 'border-slate-300 shadow-sm' : 'border-slate-200'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`${frame} h-32 w-32 shrink-0 ${src ? CHECKER : ''}`}>
            {src ? <SafeImage src={src} alt={label} fill className="object-contain p-3" /> : emptyInner(true)}
            {busyOverlay}
          </div>
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-900 leading-tight">{label}</p>
                {badgeEl}
              </div>
              <p className="text-[11px] text-slate-500">{dims}</p>
              {src && (
                <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Saved
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onPick}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {src ? <RefreshCw className="h-3.5 w-3.5" /> : <UploadCloud className="h-3.5 w-3.5" />}
                {src ? 'Replace' : 'Upload'}
              </button>
              {src && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onRemove}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">PNG, JPG or WEBP · up to 10MB</p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Banner-style card: full-width wide preview ----
  return (
    <div
      className={`group rounded-2xl border bg-white p-4 ${badgeActive ? 'border-slate-300 shadow-sm' : 'border-slate-200'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight">{label}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{dims}</p>
        </div>
        <div className="flex items-center gap-2">
          {badgeEl}
          {src && (
            <button
              type="button"
              disabled={busy}
              onClick={onRemove}
              aria-label={`Remove ${label}`}
              className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div {...dropHandlers} className={`${frame} mt-3 h-52`}>
        {src ? (
          <>
            <SafeImage src={src} alt={label} fill className="object-cover" />
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm">
              <CheckCircle2 className="h-3 w-3" /> Saved
            </span>
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                disabled={busy}
                onClick={onPick}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-slate-900 shadow hover:bg-slate-100 disabled:opacity-60"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Replace image
              </button>
            </div>
          </>
        ) : (
          emptyInner(false)
        )}
        {busyOverlay}
      </div>
    </div>
  );
}
