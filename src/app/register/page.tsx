'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { brandRegisterSchema, BrandRegisterFormValues } from '../../lib/schemas';
import { brandApi } from '../../lib/api';
import { AuthShell } from '../../components/auth/AuthShell';
import { PasswordField } from '../../components/auth/PasswordField';
import { GoogleAuthButton, formatBrandOAuthError } from '../../components/auth/GoogleAuthButton';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

function sanitizeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw === '/' || raw.startsWith('/register')) {
    return '/dashboard';
  }
  return raw;
}

function BrandRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'));
  const oauthError = formatBrandOAuthError(searchParams.get('error'));
  const [errorMsg, setErrorMsg] = useState<string | null>(oauthError);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (oauthError) {
      setErrorMsg(oauthError);
    }
  }, [oauthError]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BrandRegisterFormValues>({
    resolver: zodResolver(brandRegisterSchema),
    defaultValues: {
      brandName: '',
      ownerName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordVal = watch('password') || '';

  const onSubmit = async (data: BrandRegisterFormValues) => {
    setErrorMsg(null);
    try {
      const res = await brandApi.register({
        brandName: data.brandName,
        ownerName: data.ownerName,
        email: data.email,
        password: data.password,
      });
      setRedirecting(true);
      const slugParam = res.tenant?.slug ? `&slug=${encodeURIComponent(res.tenant.slug)}` : '';
      const warningParam = res.warning ? `&warning=${encodeURIComponent(res.warning)}` : '';
      router.push(
        `/verify-email?email=${encodeURIComponent(res.user.email)}&from=register${slugParam}${warningParam}`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to register brand account.');
    }
  };

  const isBusy = isSubmitting || redirecting;

  return (
    <AuthShell
      authTab="register"
      title="Create brand account"
      subtitle="Set up your brand workspace."
    >
      <GoogleAuthButton mode="signup" callbackUrl={callbackUrl} disabled={isBusy} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-[10px] text-stone-500 uppercase font-mono tracking-wider whitespace-nowrap shrink-0">
          or register with email
        </span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Brand Name</label>
          <Input
            type="text"
            placeholder="Lumiere Couture"
            {...register('brandName')}
            className={errors.brandName ? 'border-rose-500' : ''}
          />
          {errors.brandName && <p className="text-rose-600 text-[11px] font-medium">{errors.brandName.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Owner Full Name</label>
          <Input
            type="text"
            placeholder="Claire Moreau"
            autoComplete="name"
            {...register('ownerName')}
            className={errors.ownerName ? 'border-rose-500' : ''}
          />
          {errors.ownerName && <p className="text-rose-600 text-[11px] font-medium">{errors.ownerName.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700">Business Email</label>
          <Input
            type="email"
            placeholder="claire@lumiere.com"
            autoComplete="email"
            {...register('email')}
            className={errors.email ? 'border-rose-500' : ''}
          />
          {errors.email && <p className="text-rose-600 text-[11px] font-medium">{errors.email.message}</p>}
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

        <Button type="submit" disabled={isBusy} className="w-full h-11 font-bold gap-2">
          {isBusy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Brand Workspace...</span>
            </>
          ) : (
            <>
              <span>Create Brand Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function BrandRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <BrandRegisterContent />
    </Suspense>
  );
}

