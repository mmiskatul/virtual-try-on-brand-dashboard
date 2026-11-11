'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getProviders, getSession, useSession, signOut } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2, MailCheck, ArrowRight } from 'lucide-react';
import { brandLoginSchema, BrandLoginFormValues } from '../../lib/schemas';
import { brandApi } from '../../lib/api';
import { AuthShell } from '../../components/auth/AuthShell';
import { PasswordField } from '../../components/auth/PasswordField';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

function sanitizeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw === '/' || raw.startsWith('/login')) {
    return '/dashboard';
  }
  return raw;
}

function BrandLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'));
  const verifiedParam = searchParams.get('verified');
  const resetParam = searchParams.get('reset');
  const prefillEmail = searchParams.get('email') || '';

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);

  useEffect(() => {
    getProviders()
      .then((providers) => {
        if (providers?.google) setHasGoogle(true);
      })
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<BrandLoginFormValues>({
    resolver: zodResolver(brandLoginSchema),
    defaultValues: {
      email: prefillEmail,
      password: '',
    },
  });

  const performLogin = async (email: string, password: string) => {
    setErrorMsg(null);
    setNeedsVerificationEmail(null);
    setResendMessage(null);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      if (result.error === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerificationEmail(email);
        setErrorMsg('Please verify your business email address before accessing your brand workspace.');
      } else if (result.error === 'TENANT_SUSPENDED') {
        setErrorMsg('Your brand account has been suspended by platform administration.');
      } else if (result.error === 'SERVICE_UNAVAILABLE') {
        setErrorMsg('Backend server is unreachable. Please ensure the backend API is running on port 4000.');
      } else {
        setErrorMsg(result.error === 'CredentialsSignin' ? 'Invalid merchant email or password.' : result.error);
      }
      return;
    }

    const updatedSession = await getSession();
    if (updatedSession?.backendToken && typeof window !== 'undefined') {
      localStorage.setItem('brand_token', updatedSession.backendToken);
    }

    if (typeof window !== 'undefined') {
      window.location.assign(callbackUrl);
    } else {
      router.replace(callbackUrl);
      router.refresh();
    }
  };

  const onSubmit = async (data: BrandLoginFormValues) => {
    await performLogin(data.email, data.password);
  };

  const handleResendVerification = async () => {
    const email = needsVerificationEmail || getValues('email');
    if (!email) return;
    setResendLoading(true);
    setResendMessage(null);
    try {
      const res = await brandApi.resendVerification(email);
      setResendMessage(res.message);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthShell
      authTab="login"
      title="Log in to Brand Workspace"
      subtitle="Manage your garments, fabrics, inventory, orders, and custom storefront."
      badge="Merchant Account"
      footer={
        <p>
          Launching a new fashion label?{' '}
          <Link href="/register" className="text-black hover:text-gray-700 font-semibold">
            Register your brand
          </Link>
        </p>
      }
    >
      {session?.user && (
        <div className="p-3.5 rounded-2xl bg-gray-100 border border-gray-300 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-gray-900 font-semibold">Signed in as {session.user.name || session.user.email}</p>
            <p className="text-gray-500 text-[11px]">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={callbackUrl}
              className="px-3 py-1.5 rounded-lg bg-black hover:bg-gray-800 text-white font-bold"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') localStorage.removeItem('brand_token');
                signOut({ redirect: false });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Switch
            </button>
          </div>
        </div>
      )}

      {verifiedParam === '1' && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Merchant email verified! Sign in to enter your workspace.</span>
        </div>
      )}

      {resetParam === '1' && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Password updated! Sign in with your new credentials.</span>
        </div>
      )}

      {hasGoogle && (
        <>
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full h-11 px-4 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-900 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.25-.96 2.31-2.04 3.02l3.3 2.56c1.92-1.77 3.03-4.38 3.03-7.48 0-.72-.06-1.41-.19-2.08H12z" />
              <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.42l-3.3-2.56c-.91.61-2.08.98-3.31.98-2.54 0-4.69-1.71-5.46-4.02H3.13v2.64C4.77 19.87 8.13 22 12 22z" />
              <path fill="#4A90E2" d="M6.54 13.98A5.99 5.99 0 0 1 6.23 12c0-.69.12-1.35.31-1.98V7.38H3.13A9.97 9.97 0 0 0 2 12c0 1.61.39 3.13 1.13 4.62l3.41-2.64z" />
              <path fill="#FBBC05" d="M12 6.01c1.47 0 2.78.51 3.82 1.5l2.86-2.86C16.95 3.04 14.7 2 12 2 8.13 2 4.77 4.13 3.13 7.38l3.41 2.64C7.31 7.72 9.46 6.01 12 6.01z" />
            </svg>
            <span>Continue with Google</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-[10px] text-stone-500 uppercase font-mono tracking-wider whitespace-nowrap shrink-0">
              or merchant credentials
            </span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {needsVerificationEmail && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-800 font-semibold"
                >
                  {resendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MailCheck className="w-3.5 h-3.5" />}
                  <span>Resend Verification Email</span>
                </button>
                <Link
                  href={`/verify-email?email=${encodeURIComponent(needsVerificationEmail)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold"
                >
                  <span>Enter 6-Digit Code</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        {resendMessage && (
          <div className="p-3 rounded-xl bg-gray-100 border border-gray-300 text-black text-xs">
            {resendMessage}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Business Email</label>
          <Input
            type="email"
            placeholder="elena@auraatelier.com"
            autoComplete="email"
            {...register('email')}
            className={errors.email ? 'border-rose-500 focus-visible:border-rose-500' : ''}
          />
          {errors.email && <p className="text-rose-600 text-[11px] font-medium">{errors.email.message}</p>}
        </div>

        <PasswordField
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          rightSlot={
            <Link href="/forgot-password" className="text-[11px] text-black hover:text-gray-700 font-medium">
              Forgot password?
            </Link>
          }
          {...register('password')}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full h-11 font-bold gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <>
              <span>Log In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

      </form>
    </AuthShell>
  );
}

export default function BrandLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <BrandLoginContent />
    </Suspense>
  );
}

