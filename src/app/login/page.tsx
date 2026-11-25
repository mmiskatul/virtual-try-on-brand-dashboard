'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2, MailCheck, ArrowRight } from 'lucide-react';
import { brandLoginSchema, BrandLoginFormValues } from '../../lib/schemas';
import { brandApi } from '../../lib/api';
import { AuthShell } from '../../components/auth/AuthShell';
import { PasswordField } from '../../components/auth/PasswordField';
import { GoogleAuthButton, formatBrandOAuthError } from '../../components/auth/GoogleAuthButton';
import { AuthToast, useAuthToast } from '../../components/auth/AuthToast';
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
  const { data: session, status } = useSession();

  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'));

  // Already signed in: skip the login page and go straight to the dashboard.
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    }
  }, [status, callbackUrl, router]);
  const verifiedParam = searchParams.get('verified');
  const resetParam = searchParams.get('reset');
  const prefillEmail = searchParams.get('email') || '';
  const oauthError = formatBrandOAuthError(searchParams.get('error'));

  const [errorMsg, setErrorMsg] = useState<string | null>(oauthError);
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const { toast, showToast, dismissToast } = useAuthToast();

  // Show an error both inline (stays on screen) and as a toast (hard to miss).
  const fail = (message: string) => {
    setErrorMsg(message);
    showToast('error', message);
  };

  useEffect(() => {
    if (oauthError) {
      setErrorMsg(oauthError);
      showToast('error', oauthError);
    } else if (verifiedParam === '1') {
      showToast('success', 'Email verified! Sign in to enter your workspace.');
    } else if (resetParam === '1') {
      showToast('success', 'Password updated! Sign in with your new password.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oauthError, verifiedParam, resetParam]);

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

    try {
      await brandApi.login({ email, password });
    } catch (err: any) {
      if (err?.data?.code === 'EMAIL_NOT_VERIFIED') {
        // Credentials were correct but the email is unverified: send a fresh code and go straight to verification.
        setNeedsVerificationEmail(email);
        setErrorMsg('Your email is not verified yet. Sending a new verification code...');
        showToast('error', 'Your email is not verified yet. Sending a new verification code...');
        const target = `/verify-email?email=${encodeURIComponent(email)}&from=login`;
        try {
          const sent = await brandApi.resendVerification(email);
          if (sent.status === 'VERIFICATION_SENT') {
            showToast('success', 'Verification code sent to your email.');
            router.push(target);
          } else if (sent.status === 'ALREADY_VERIFIED') {
            fail('Your email is already verified. Please try signing in again.');
          } else {
            fail(sent.message || 'Could not send a verification code. Please try again.');
          }
        } catch (resendErr: any) {
          const warning = resendErr?.message || 'Could not send a new verification code. Please use Resend.';
          router.push(`${target}&warning=${encodeURIComponent(warning)}`);
        }
      } else if (err?.data?.error === 'TenantSuspended') {
        fail('Your brand account has been suspended by platform administration.');
      } else if (err?.status === 429) {
        fail(err?.message || 'Too many attempts. Please wait a moment and try again.');
      } else if (err?.status === 401 || err?.status === 400) {
        fail('Invalid email or password. Please check your details and try again.');
      } else if (!err?.status) {
        fail('Could not reach the server. Check your connection and try again.');
      } else {
        fail(err?.message || 'Login failed. Please try again.');
      }
      return;
    }

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      if (result.error === 'SERVICE_UNAVAILABLE') {
        fail('Server is unreachable right now. Please try again in a moment.');
      } else {
        fail(result.error === 'CredentialsSignin' ? 'Could not start your session. Please try again.' : result.error);
      }
      return;
    }

    const established = await getSession();
    if (!established?.user) {
      fail('Signed in, but your session could not be started. Make sure cookies are enabled and try again.');
      return;
    }

    showToast('success', 'Login successful! Redirecting to your dashboard...', 4000);
    // Brief pause so the success toast is visible before the full-page navigation.
    await new Promise((resolve) => setTimeout(resolve, 700));

    if (typeof window !== 'undefined') {
      window.location.assign(callbackUrl);
    } else {
      router.replace(callbackUrl);
      router.refresh();
    }
  };

  const onSubmit = async (data: BrandLoginFormValues) => {
    try {
      await performLogin(data.email, data.password);
    } catch {
      fail('Something went wrong while signing in. Please try again.');
    }
  };

  const onInvalid = () => {
    showToast('error', 'Please fix the highlighted fields and try again.');
  };

  const handleResendVerification = async () => {
    const email = needsVerificationEmail || getValues('email');
    if (!email) return;
    setResendLoading(true);
    setResendMessage(null);
    try {
      const res = await brandApi.resendVerification(email);
      setResendMessage(res.message);
      showToast('success', res.message);
    } catch (err: any) {
      fail(err?.message || 'Could not resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthShell
      authTab="login"
      title="Welcome back"
      subtitle="Sign in to your brand account."
    >
      <AuthToast toast={toast} onClose={dismissToast} />
      {session?.user && (
        <div className="p-3.5 rounded-2xl bg-gray-100 border border-gray-300 flex items-center gap-2 text-xs text-gray-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Signed in as {session.user.name || session.user.email}. Redirecting to your dashboard...</span>
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

      <GoogleAuthButton mode="login" callbackUrl={callbackUrl} disabled={isSubmitting} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-[11px] text-stone-500 uppercase font-mono tracking-wider whitespace-nowrap shrink-0">
          or log in with email
        </span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        {errorMsg && (
          <div role="alert" className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs space-y-2">
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
          <label htmlFor="f-login-email" className="block text-xs font-medium text-gray-700">Email</label>
          <Input id="f-login-email"
            type="email"
            placeholder="you@brand.com"
            autoComplete="email"
            {...register('email')}
            className={errors.email ? 'border-rose-500 focus-visible:border-rose-500' : ''}
          />
          {errors.email && <p role="alert" className="text-rose-600 text-[11px] font-medium">{errors.email.message}</p>}
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

