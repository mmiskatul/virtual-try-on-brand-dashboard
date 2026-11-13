'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Lock,
  PackageOpen,
  RefreshCw,
} from 'lucide-react';
import { PermissionAction, ResourceModule } from '../../types';
import { canPerform, ROLE_LABELS } from '../../config/permissions';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { Button } from '../ui/button';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80';

export function SafeImage({
  src,
  alt,
  fallbackSrc = FALLBACK_IMG,
  ...rest
}: ImageProps & { fallbackSrc?: string }) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  return (
    <Image
      {...rest}
      src={imgSrc || fallbackSrc}
      alt={alt || 'Brand asset'}
      onError={() => {
        if (imgSrc !== fallbackSrc) setImgSrc(fallbackSrc);
      }}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = String(status).toUpperCase();
  let cls = 'bg-slate-100 text-slate-700 border-slate-200';
  if (
    ['PUBLISHED', 'ACTIVE', 'VERIFIED', 'LIVE', 'COMPLETED', 'DELIVERED', 'PAID', 'CONNECTED', 'APPROVED', '200 OK'].includes(s)
  ) {
    cls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['PENDING', 'SCHEDULED', 'PROCESSING', 'UNDER_REVIEW', 'READY', 'SHIPPED', 'RETRYING', 'PENDING_REVIEW'].includes(s)) {
    cls = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (['FAILED', 'CANCELLED', 'REJECTED', 'REVOKED', 'SUSPENDED', 'REFUNDED'].includes(s)) {
    cls = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['DRAFT', 'UNPUBLISHED', 'ARCHIVED', 'HIDDEN', 'PAUSED'].includes(s)) {
    cls = 'bg-slate-100 text-slate-600 border-slate-300';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3.5 sm:gap-4 pb-3 border-b border-slate-200/80">
      <div className="space-y-1 min-w-0">
        {eyebrow && (
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-950 leading-tight break-words">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed break-words">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">{actions}</div>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  right,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 space-y-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] min-w-0 ${className}`}
    >
      {(title || right) && (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed break-words">
                {subtitle}
              </p>
            )}
          </div>
          {right && <div className="shrink-0 max-w-full">{right}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function KpiCard({
  label,
  value,
  change,
  positive = true,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}) {
  const [hintOpen, setHintOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 hover:border-slate-300 transition-colors min-w-0 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug break-words">
            {label}
          </span>
          {hint && (
            <button
              type="button"
              onClick={() => setHintOpen((v) => !v)}
              title={hint}
              aria-label={`More info about ${label}`}
              aria-expanded={hintOpen}
              className="text-slate-400 hover:text-slate-700 shrink-0 p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {icon && (
          <div className="p-1.5 sm:p-2 rounded-xl bg-slate-100 text-slate-800 shrink-0">{icon}</div>
        )}
      </div>

      <p className="text-lg sm:text-2xl font-extrabold text-slate-950 tracking-tight tabular-nums break-words">
        {value}
      </p>

      {change && (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] sm:text-xs">
          <span
            className={`inline-flex items-center gap-0.5 font-bold ${
              positive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {positive ? (
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
            )}
            {change}
          </span>
          <span className="text-slate-400 hidden sm:inline">vs previous period</span>
        </div>
      )}

      {hint && hintOpen && (
        <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}

export function PermissionGate({
  module,
  action = 'view',
  children,
}: {
  module: ResourceModule;
  action?: PermissionAction;
  children: React.ReactNode;
}) {
  const activeRole = useWorkspaceStore((s) => s.activeRole);
  const roleOverrides = useWorkspaceStore((s) => s.roleOverrides);

  const allowed = canPerform(activeRole, module, action, roleOverrides);
  if (allowed) return <>{children}</>;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-8 text-center space-y-3 max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
        <Lock className="w-5 h-5" />
      </div>
      <h3 className="text-base font-bold text-slate-900">Role Permission Restricted</h3>
      <p className="text-xs text-slate-600 leading-relaxed">
        Your active staff role (<strong>{ROLE_LABELS[activeRole].label}</strong>) does not have <code>{action}</code> permission on the <code>{module}</code> module. Switch role or ask the Workspace Owner to grant access under Team &rarr; Roles.
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 sm:p-10 text-center space-y-3">
      <PackageOpen className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 mx-auto" />
      <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 text-xs text-rose-800">
      <div className="flex items-start sm:items-center gap-2 min-w-0">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
        <span className="break-words">{message}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 font-bold underline"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="font-bold text-rose-700 hover:text-rose-950"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-slate-100 border border-slate-200/70" />
      ))}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{description}</p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            size="sm"
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SvgBarChart({
  data,
  valueKey,
  labelKey = 'label',
  color = '#0f172a',
  prefix = '',
}: {
  data: Array<Record<string, any>>;
  valueKey: string;
  labelKey?: string;
  color?: string;
  prefix?: string;
}) {
  if (!data || data.length === 0) {
    return <EmptyState title="No chart data" description="No records available for the selected range." />;
  }
  const maxVal = Math.max(1, ...data.map((d) => Number(d[valueKey] || 0)));

  return (
    <div className="overflow-x-auto no-scrollbar pb-1">
      <div
        className="grid gap-2.5 sm:gap-3 items-end h-44 sm:h-48 pt-4"
        style={{
          gridTemplateColumns: `repeat(${data.length}, minmax(44px, 1fr))`,
          minWidth: `${Math.max(260, data.length * 52)}px`,
        }}
      >
        {data.map((row, idx) => {
          const val = Number(row[valueKey] || 0);
          const pct = Math.max(8, Math.round((val / maxVal) * 100));
          return (
            <div key={idx} className="flex flex-col items-center justify-end h-full gap-1.5 group min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tabular-nums whitespace-nowrap">
                {prefix}
                {val.toLocaleString()}
              </span>
              <div className="w-full max-w-[44px] h-full flex items-end bg-slate-100 rounded-t-xl overflow-hidden">
                <div
                  className="w-full rounded-t-xl transition-all duration-300"
                  style={{ height: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 truncate max-w-full">
                {row[labelKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

