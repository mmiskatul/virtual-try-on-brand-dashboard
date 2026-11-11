'use client';

import React, { useState } from 'react';
import { Mail, Copy, Check, ExternalLink } from 'lucide-react';
import { DevEmailPreview } from '../../lib/api';

interface DevEmailPreviewCardProps {
  preview?: DevEmailPreview | null;
  actionLabel?: string;
}

export function DevEmailPreviewCard({ preview, actionLabel = 'Open Email Link' }: DevEmailPreviewCardProps) {
  const [copied, setCopied] = useState(false);

  if (!preview || (!preview.actionUrl && !preview.otpCode)) {
    return null;
  }

  const handleCopyCode = async () => {
    if (!preview.otpCode) return;
    try {
      await navigator.clipboard.writeText(preview.otpCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2.5 text-xs">
      <div className="flex items-center gap-2 text-amber-700 font-bold">
        <Mail className="w-4 h-4 shrink-0" />
        <span>Local Dev Email Preview</span>
      </div>
      <p className="text-[11px] text-amber-800/80 leading-relaxed">
        SMTP/Resend is not configured in this environment, so your email content is surfaced here for testing:
      </p>

      {preview.otpCode && (
        <div className="flex items-center justify-between rounded-xl bg-white/70 border border-gray-200 px-3 py-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 block">6-Digit Code</span>
            <span className="font-mono text-base font-extrabold tracking-[0.25em] text-gray-900">
              {preview.otpCode}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-semibold text-gray-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}

      {preview.actionUrl && (
        <a
          href={preview.actionUrl}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs transition-colors"
        >
          <span>{actionLabel}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

