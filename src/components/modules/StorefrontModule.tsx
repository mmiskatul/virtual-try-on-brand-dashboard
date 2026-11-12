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
          <h3 className="font-bold text-base text-gray-900">Storefront Theme & Branding</h3>
          <p className="text-[11px] text-gray-500">Validated via React Hook Form & Zod schema</p>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-500 mb-1 font-medium">Storefront Announcement Banner *</label>
            <Input
              {...register('announcement')}
              placeholder="e.g. Complimentary express shipping on orders over ৳2,500"
              className={errors.announcement ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
            />
            {errors.announcement && (
              <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.announcement.message}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-500 mb-1 font-medium">Hero Banner Image URL *</label>
            <Input
              {...register('banner')}
              placeholder="https://images.unsplash.com/..."
              className={errors.banner ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
            />
            {errors.banner && (
              <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.banner.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-gray-500 mb-1 font-medium">Primary Accent Color *</label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  {...register('primaryColor')}
                  placeholder="#000000"
                  className={`font-mono ${errors.primaryColor ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                />
              </div>
              {errors.primaryColor && (
                <p className="text-rose-600 text-[11px] mt-1 font-medium">{errors.primaryColor.message}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-500 mb-1 font-medium">Storefront Slug</label>
              <span className="font-mono text-black block py-2">{brand.slug}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex flex-wrap justify-between items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="bg-black text-white font-bold text-xs hover:bg-gray-800"
            >
              Save Changes
            </Button>

            <Link
              href={`/storefront/${brand.slug}`}
              target="_blank"
              className="flex items-center gap-2 text-xs font-semibold text-black hover:text-gray-700"
            >
              Open Live Storefront Preview <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
