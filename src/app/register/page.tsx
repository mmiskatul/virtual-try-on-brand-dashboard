'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2, Mail, ArrowRight } from 'lucide-react';
import { brandRegisterSchema, BrandRegisterFormValues } from '../../lib/schemas';
import { brandApi, DevEmailPreview } from '../../lib/api';
import { AuthShell } from '../../components/auth/AuthShell';
import { PasswordField } from '../../components/auth/PasswordField';
import { DevEmailPreviewCard } from '../../components/auth/DevEmailPreviewCard';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function BrandRegisterContent() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [registeredSlug, setRegisteredSlug] = useState<string | null>(null);
  const [devPreview, setDevPreview] = useState<DevEmailPreview | null>(null);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BrandRegisterFormValues>({
    resolver: zodResolver(brandRegisterSchema),
    defaultValues: {
      brandName: '',
      slug: '',
      ownerName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordVal = watch('password') || '';
  const slugVal = watch('slug') || '';

  const onSubmit = async (data: BrandRegisterFormValues) => {
    setErrorMsg(null);
    try {
      const res = await brandApi.register({
        brandName: data.brandName,
        slug: data.slug,
        ownerName: data.ownerName,
        email: data.email,
        password: data.password,
      });
      setRegisteredEmail(res.user.email);
      setRegisteredSlug(res.tenant?.slug || data.slug);
      setDevPreview(res.devPreview || null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to register brand account.');
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResending(true);
    setResendStatus(null);
    try {
      const res = await brandApi.resendVerification(registeredEmail);
      setResendStatus(res.message);
      if (res.devPreview) setDevPreview(res.devPreview);
    } catch (err: any) {
      setResendStatus(err?.message || 'Unable to resend verification email right now.');
    } finally {
      setResending(false);
    }
  };

  if (registeredEmail) {
    return (
      <AuthShell
        title="Verify your brand email"
        subtitle="Your storefront tenant is provisioned — verify your email to unlock your Brand Command Center."
        badge="Check Your Inbox"
        footer={
          <p>
            Already verified?{' '}
            <Link href="/login" className="text-sky-400 hover:text-sky-300 font-semibold">
              Sign in to workspace
            </Link>
          </p>
        }
      >
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Brand registered! Verification email sent</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Storefront <span className="font-mono text-sky-300">/storefront/{registeredSlug}</span> is ready. Verify{' '}
            <span className="font-semibold text-white">{registeredEmail}</span> using the link or 6-digit code we sent.
          </p>
        </div>

        <DevEmailPreviewCard preview={devPreview} actionLabel="Verify Brand Email" />

        {resendStatus && (
          <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs">
            {resendStatus}
          </div>
        )}

        <div className="space-y-2.5">
          <Link
            href={`/verify-email?email=${encodeURIComponent(registeredEmail)}`}
            className="w-full h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
          >
            <span>Enter 6-Digit Verification Code</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={resending}
            className="w-full gap-2"
          >
            {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            <span>Resend Verification Email</span>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Register your fashion brand"
      subtitle="Launch your dedicated AI Virtual Try-On storefront and catalog workspace."
      badge="Brand Onboarding"
      footer={
        <p>
          Already registered?{' '}
          <Link href="/login" className="text-sky-400 hover:text-sky-300 font-semibold">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">Brand / Atelier Name</label>
          <Input
            type="text"
            placeholder="Lumiere Couture"
            {...register('brandName', {
              onChange: (e) => {
                if (!slugTouched) {
                  setValue('slug', toSlug(e.target.value), { shouldValidate: true });
                }
              },
            })}
            className={errors.brandName ? 'border-rose-500' : ''}
          />
          {errors.brandName && <p className="text-rose-400 text-[11px] font-medium">{errors.brandName.message}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-300">Storefront Slug</label>
            <span className="text-[10px] font-mono text-sky-400">/storefront/{slugVal || 'your-brand'}</span>
          </div>
          <Input
            type="text"
            placeholder="lumiere-couture"
            {...register('slug', {
              onChange: () => setSlugTouched(true),
            })}
            className={`font-mono ${errors.slug ? 'border-rose-500' : ''}`}
          />
          {errors.slug && <p className="text-rose-400 text-[11px] font-medium">{errors.slug.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">Owner Full Name</label>
          <Input
            type="text"
            placeholder="Claire Moreau"
            autoComplete="name"
            {...register('ownerName')}
            className={errors.ownerName ? 'border-rose-500' : ''}
          />
          {errors.ownerName && <p className="text-rose-400 text-[11px] font-medium">{errors.ownerName.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-300">Business Email</label>
          <Input
            type="email"
            placeholder="claire@lumiere.com"
            autoComplete="email"
            {...register('email')}
            className={errors.email ? 'border-rose-500' : ''}
          />
          {errors.email && <p className="text-rose-400 text-[11px] font-medium">{errors.email.message}</p>}
        </div>

        <PasswordField
          label="Password"
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          showStrength
          watchedValue={passwordVal}
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordField
          label="Confirm Password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Brand Workspace...
            </span>
          ) : (
            'Create Brand Account'
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function BrandRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <BrandRegisterContent />
    </Suspense>
  );
}

