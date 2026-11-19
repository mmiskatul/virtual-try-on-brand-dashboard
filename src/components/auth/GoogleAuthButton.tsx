'use client';

import React, { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface GoogleAuthButtonProps {
  mode: 'login' | 'signup';
  callbackUrl?: string;
  disabled?: boolean;
}

export function formatBrandOAuthError(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case 'PortalMismatch':
      return 'This email address is already registered under another portal. Please use a different Google account or business email.';
    case 'TenantSuspended':
      return 'Your brand account has been suspended by platform administration.';
    case 'GoogleSyncFailed':
      return 'Unable to complete Google sign-in with the backend. Please try again.';
    case 'AccessDenied':
      return 'Google sign-in was cancelled or denied.';
    case 'OAuthSignin':
    case 'OAuthCallback':
      return 'Google sign-in failed. Please try again, or use email and password.';
    case 'OAuthAccountNotLinked':
      return 'This email is already linked with another sign-in method.';
    case 'SessionCookieMissing':
      return 'Your login succeeded but the server session cookie was not accepted by the browser. This happens when the site and the API are on different domains (for example localhost with the live API). Point the app at a local backend, or use the deployed site.';
    case 'Callback':
    case 'Configuration':
      return 'Google sign-in is temporarily unavailable. Please try again later.';
    default:
      return 'Google sign-in could not be completed. Please try again.';
  }
}

export function GoogleAuthButton({
  mode,
  callbackUrl = '/dashboard',
  disabled = false,
}: GoogleAuthButtonProps) {
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Retry a couple of times so a transient failure (e.g. rate limit) doesn't leave Google disabled.
    const load = async (attempt: number) => {
      try {
        const providers = await getProviders();
        if (cancelled) return;
        if (providers) {
          setGoogleConfigured(Boolean(providers.google));
          return;
        }
      } catch {
        // fall through to retry
      }
      if (!cancelled && attempt < 3) {
        setTimeout(() => load(attempt + 1), 1500 * (attempt + 1));
      }
    };
    load(0);
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = async () => {
    if (loading) return;
    setNotice(null);

    let configured = googleConfigured;
    if (!configured) {
      // Re-check on click in case the initial lookup failed.
      try {
        const providers = await getProviders();
        configured = Boolean(providers?.google);
        setGoogleConfigured(configured);
      } catch {
        setNotice('Could not reach the sign-in service. Check your connection and try again.');
        return;
      }
    }

    if (!configured) {
      setNotice('Google sign-in is not available right now. Please use email and password instead.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('google', { callbackUrl, redirect: true });
      // With redirect enabled the browser navigates away; reaching here means it failed to start.
      if (result?.error) {
        setNotice(formatBrandOAuthError(result.error) || 'Google sign-in could not be started.');
        setLoading(false);
      }
    } catch {
      setNotice('Could not start Google sign-in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="w-full h-11 px-4 rounded-xl bg-white hover:bg-stone-50 disabled:opacity-60 border border-stone-300 text-stone-900 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-stone-700" />
            <span>Redirecting to Google...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.24 1.25-.96 2.31-2.04 3.02l3.3 2.56c1.92-1.77 3.03-4.38 3.03-7.48 0-.72-.06-1.41-.19-2.08H12z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.7 0 4.96-.9 6.61-2.42l-3.3-2.56c-.91.61-2.08.98-3.31.98-2.54 0-4.69-1.71-5.46-4.02H3.13v2.64C4.77 19.87 8.13 22 12 22z"
              />
              <path
                fill="#4A90E2"
                d="M6.54 13.98A5.99 5.99 0 0 1 6.23 12c0-.69.12-1.35.31-1.98V7.38H3.13A9.97 9.97 0 0 0 2 12c0 1.61.39 3.13 1.13 4.62l3.41-2.64z"
              />
              <path
                fill="#FBBC05"
                d="M12 6.01c1.47 0 2.78.51 3.82 1.5l2.86-2.86C16.95 3.04 14.7 2 12 2 8.13 2 4.77 4.13 3.13 7.38l3.41 2.64C7.31 7.72 9.46 6.01 12 6.01z"
              />
            </svg>
            <span>{mode === 'login' ? 'Log in with Google' : 'Sign up with Google'}</span>
          </>
        )}
      </button>

      {notice && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-[11px] leading-relaxed">
          {notice}
        </div>
      )}
    </div>
  );
}

