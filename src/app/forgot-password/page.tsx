'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Mail, ArrowRight } from 'lucide-react';
import { forgotPasswordSchema, ForgotPasswordFormValues } from '../../lib/schemas';
import { brandApi, DevEmailPreview } from '../../lib/api';
import { AuthShell } from '../../components/auth/AuthShell';
import { DevEmailPreviewCard } from '../../components/auth/DevEmailPreviewCard';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

function BrandForgotPasswordContent() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';

  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [devPreview, setDevPreview] = useState<DevEmailPreview | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: prefillEmail },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendReset = async (email: string) => {
    setErrorMsg(null);
    const res = await brandApi.forgotPassword(email);
    setSubmittedEmail(email);
    setStatusMsg(res.message);
    setDevPreview(res.devPreview || null);
    setCooldown(30);
  };

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await sendReset(data.email);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to process password reset request.');
    }
  };

  const handleResend = async () => {
    if (!submittedEmail || cooldown > 0) return;
    setResending(true);
    try {
      await sendReset(submittedEmail);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to resend reset link.');
    } finally {
      setResending(false);
    }
  };

  if (submittedEmail) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We sent password recovery instructions for your Brand Merchant account."
        badge="Password Recovery"
        footer={
          <p>
            Remembered your password?{' '}
            <Link href="/login" className="text-black hover:text-gray-700 font-semibold">
              Back to Sign In
            </Link>
          </p>
        }
      >
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Reset instructions sent</span>
          </div>
          <p className="text-gray-700 leading-relaxed">
            {statusMsg} Check <span className="font-semibold text-gray-900">{submittedEmail}</span> for your reset link and 6-digit code.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <DevEmailPreviewCard preview={devPreview} actionLabel="Open Reset Password Page" />

        <div className="space-y-2.5">
          <Link
            href={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}
            className="w-full h-10 px-4 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-black/10 transition-all"
          >
            <span>Enter 6-Digit Reset Code</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Button
            type="button"
            variant="outline"
            disabled={resending || cooldown > 0}
            onClick={handleResend}
            className="w-full gap-2"
          >
            {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            <span>{cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Reset Email'}</span>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your merchant password?"
      subtitle="Enter your business email address and we will send a password reset link and 6-digit recovery code."
      badge="Password Recovery"
      footer={
        <p>
          Remembered your password?{' '}
          <Link href="/login" className="text-black hover:text-gray-700 font-semibold">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Business Email</label>
          <Input
            type="email"
            placeholder="elena@auraatelier.com"
            autoComplete="email"
            {...register('email')}
            className={errors.email ? 'border-rose-500' : ''}
          />
          {errors.email && <p className="text-rose-600 text-[11px] font-medium">{errors.email.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          <span>{isSubmitting ? 'Sending Reset Link...' : 'Send Reset Instructions'}</span>
        </Button>
      </form>
    </AuthShell>
  );
}

export default function BrandForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <BrandForgotPasswordContent />
    </Suspense>
  );
}

