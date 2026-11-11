'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getProviders, getSession, useSession, signOut } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2, MailCheck, ArrowRight } from 'lucide-react';
import { brandLoginSchema, BrandLoginFormValues } from '../../lib/schemas';
import { brandApi, DevEmailPreview } from '../../lib/api';
import { AuthShell } from '../../components/auth/AuthShell';
import { PasswordField } from '../../components/auth/PasswordField';
import { DevEmailPreviewCard } from '../../components/auth/DevEmailPreviewCard';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

function sanitizeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/';
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
  const [devPreview, setDevPreview] = useState<DevEmailPreview | null>(null);
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
    setDevPreview(null);

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

    router.push(callbackUrl);
    router.refresh();
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
      if (res.devPreview) setDevPreview(res.devPreview);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in to Brand Portal"
      subtitle="Manage your garments, fabrics, inventory, orders, and custom storefront."
      badge="Merchant Sign In"
      footer={
        <p>
          Launching a new fashion label?{' '}
          <Link href="/register" className="text-sky-400 hover:text-sky-300 font-semibold">
            Register your brand
          </Link>
        </p>
      }
    >
      {session?.user && (
        <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-white font-semibold">Signed in as {session.user.name || session.user.email}</p>
            <p className="text-slate-400 text-[11px]">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={callbackUrl}
              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') localStorage.removeItem('brand_token');
                signOut({ redirect: false });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Switch
            </button>
          </div>
        </div>
      )}

      {verifiedParam === '1' && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Merchant email verified! Sign in to enter your workspace.</span>
        </div>
      )}

      {resetParam === '1' && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Password updated! Sign in with your new credentials.</span>
        </div>
      )}

      {hasGoogle && (
        <>
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            Continue with Google
          </button>
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase font-mono">or merchant credentials</span>
            <div className="border-t border-slate-800 w-full" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-2">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold"
                >
                  {resendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MailCheck className="w-3.5 h-3.5" />}
                  <span>Resend Verification Email</span>
                </button>
                <Link
                  href={`/verify-email?email=${encodeURIComponent(needsVerificationEmail)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                >
                  <span>Enter 6-Digit Code</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        {resendMessage && (
          <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs">
            {resendMessage}
          </div>
        )}

        <DevEmailPreviewCard preview={devPreview} actionLabel="Verify Merchant Email" />

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">Business Email</label>
          <Input
            type="email"
            placeholder="elena@auraatelier.com"
            autoComplete="email"
            {...register('email')}
            className={errors.email ? 'border-rose-500 focus-visible:border-rose-500' : ''}
          />
          {errors.email && <p className="text-rose-400 text-[11px] font-medium">{errors.email.message}</p>}
        </div>

        <PasswordField
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          rightSlot={
            <Link href="/forgot-password" className="text-[11px] text-sky-400 hover:text-sky-300 font-medium">
              Forgot password?
            </Link>
          }
          {...register('password')}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing In...
            </span>
          ) : (
            'Sign In to Brand Workspace'
          )}
        </Button>

      </form>
    </AuthShell>
  );
}

export default function BrandLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <BrandLoginContent />
    </Suspense>
  );
}

