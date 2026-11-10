'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { brandApi } from '../../lib/api';
import { AuthShell } from '../../components/auth/AuthShell';
import { PasswordField } from '../../components/auth/PasswordField';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const resetFormSchema = z
  .object({
    email: z.string().optional(),
    code: z.string().optional(),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/[A-Za-z]/, 'Password must include at least one letter')
      .regex(/[0-9]/, 'Password must include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetFormSchema>;

function BrandResetPasswordContent() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');
  const urlEmail = searchParams.get('email') || '';

  const [tokenState, setTokenState] = useState<'checking' | 'valid' | 'invalid' | 'manual'>(
    urlToken ? 'checking' : 'manual'
  );
  const [tokenEmail, setTokenEmail] = useState<string>(urlEmail);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { email: urlEmail, code: '', newPassword: '', confirmPassword: '' },
  });

  const newPasswordVal = watch('newPassword') || '';

  useEffect(() => {
    if (!urlToken) {
      setTokenState('manual');
      return;
    }

    setTokenState('checking');
    brandApi
      .verifyResetToken({ token: urlToken })
      .then((res) => {
        setTokenState('valid');
        if (res.email) setTokenEmail(res.email);
      })
      .catch((err: any) => {
        setTokenState('invalid');
        setErrorMsg(err?.message || 'This password reset link is invalid or has expired.');
      });
  }, [urlToken]);

  const onSubmit = async (data: ResetFormValues) => {
    setErrorMsg(null);
    if (!urlToken) {
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        setErrorMsg('Please enter a valid business email address.');
        return;
      }
      if (!data.code || !/^\d{6}$/.test(data.code.trim())) {
        setErrorMsg('Please enter the 6-digit reset code from your email.');
        return;
      }
    }

    try {
      await brandApi.resetPassword({
        ...(urlToken ? { token: urlToken } : { email: data.email?.trim(), code: data.code?.trim() }),
        newPassword: data.newPassword,
      });
      setResetDone(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to reset password.');
    }
  };

  if (tokenState === 'checking') {
    return (
      <AuthShell title="Validating reset link..." subtitle="Please wait while we verify your recovery token." badge="Password Reset">
        <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-xs text-slate-300">Checking reset token validity...</p>
        </div>
      </AuthShell>
    );
  }

  if (tokenState === 'invalid') {
    return (
      <AuthShell title="Reset link expired or invalid" subtitle="For your security, reset links expire after 30 minutes and can only be used once." badge="Password Reset">
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
        <Link
          href="/forgot-password"
          className="w-full h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-2 transition-all"
        >
          <span>Request a New Reset Link</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </AuthShell>
    );
  }

  if (resetDone) {
    return (
      <AuthShell title="Password reset successful" subtitle="Your merchant credentials have been updated." badge="Password Updated">
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">Password updated!</p>
            <p>Sign in with your new merchant password.</p>
          </div>
        </div>
        <Link
          href={`/login?reset=1${tokenEmail ? `&email=${encodeURIComponent(tokenEmail)}` : ''}`}
          className="w-full h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
        >
          <span>Continue to Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new merchant password"
      subtitle={
        urlToken && tokenEmail
          ? `Choose a strong new password for ${tokenEmail}.`
          : 'Enter your business email, 6-digit reset code, and choose a new password.'
      }
      badge="Password Reset"
      footer={
        <p>
          Need a new reset code?{' '}
          <Link href="/forgot-password" className="text-sky-400 hover:text-sky-300 font-semibold">
            Request again
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!urlToken && (
          <>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">Business Email</label>
              <Input type="email" placeholder="elena@auraatelier.com" {...register('email')} />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">6-Digit Reset Code</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="font-mono text-center text-base tracking-[0.4em]"
                {...register('code')}
              />
            </div>
          </>
        )}

        <PasswordField
          label="New Password"
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          showStrength
          watchedValue={newPasswordVal}
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />

        <PasswordField
          label="Confirm New Password"
          placeholder="Re-enter your new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          <span>{isSubmitting ? 'Updating Password...' : 'Reset Password'}</span>
        </Button>
      </form>
    </AuthShell>
  );
}

export default function BrandResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <BrandResetPasswordContent />
    </Suspense>
  );
}

