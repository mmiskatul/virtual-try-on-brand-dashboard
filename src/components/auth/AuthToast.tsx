'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type AuthToastKind = 'success' | 'error';

interface ToastState {
  id: number;
  kind: AuthToastKind;
  message: string;
}

/**
 * Lightweight toast for the public auth pages (login/register/verify), which render outside the dashboard shell.
 * Usage: const { toast, showToast, dismissToast } = useAuthToast(); ... <AuthToast toast={toast} onClose={dismissToast} />
 */
export function useAuthToast(durationMs = 5000) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const dismissToast = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  }, []);

  const showToast = useCallback(
    (kind: AuthToastKind, message: string, ms: number = durationMs) => {
      if (timer.current) clearTimeout(timer.current);
      counter.current += 1;
      setToast({ id: counter.current, kind, message });
      timer.current = setTimeout(() => setToast(null), ms);
    },
    [durationMs],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { toast, showToast, dismissToast };
}

export function AuthToast({ toast, onClose }: { toast: ToastState | null; onClose: () => void }) {
  if (!toast) return null;
  const isError = toast.kind === 'error';
  return (
    <div
      key={toast.id}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`fixed top-5 right-5 left-5 sm:left-auto sm:max-w-sm z-[120] flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl shadow-black/15 border text-sm font-medium ${
        isError
          ? 'bg-rose-50 border-rose-200 text-rose-800'
          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
      )}
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
