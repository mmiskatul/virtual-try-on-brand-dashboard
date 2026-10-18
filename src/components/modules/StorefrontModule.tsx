'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink } from 'lucide-react';
import { BrandProfile } from '../../types';
import { storefrontSchema, StorefrontFormValues } from '../../lib/schemas';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface StorefrontProps {
  brand: BrandProfile;
  onSave: (data: StorefrontFormValues) => void;
}

export function StorefrontModule({ brand, onSave }: StorefrontProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting }
  } = useForm<StorefrontFormValues>({
    resolver: zodResolver(storefrontSchema),
    defaultValues: {
      announcement: brand.announcement,
      banner: brand.banner,
      primaryColor: brand.primaryColor
    }
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="glass-panel p-6 rounded-2xl space-y-5">
        <div>
          <h3 className="font-bold text-base text-white">Storefront Theme & Branding</h3>
          <p className="text-[11px] text-slate-400">Validated via React Hook Form & Zod schema</p>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Storefront Announcement Banner *</label>
            <Input
              {...register('announcement')}
              placeholder="e.g. Complimentary worldwide express shipping on orders over $250"
              className={errors.announcement ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
            />
            {errors.announcement && (
              <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.announcement.message}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Hero Banner Image URL *</label>
            <Input
              {...register('banner')}
              placeholder="https://images.unsplash.com/..."
              className={errors.banner ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
            />
            {errors.banner && (
              <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.banner.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Primary Accent Color *</label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  {...register('primaryColor')}
                  placeholder="#0ea5e9"
                  className={`font-mono ${errors.primaryColor ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                />
              </div>
              {errors.primaryColor && (
                <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.primaryColor.message}</p>
              )}
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Storefront Slug</label>
              <span className="font-mono text-sky-400 block py-2">{brand.slug}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400"
            >
              Save Changes
            </Button>

            <Link
              href={`/storefront/${brand.slug}`}
              target="_blank"
              className="flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-300"
            >
              Open Live Storefront Preview <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
