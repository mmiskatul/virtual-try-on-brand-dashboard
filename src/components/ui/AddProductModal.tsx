'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Product } from '../../types';
import { productSchema, ProductFormValues } from '../../lib/schemas';
import { Button } from './button';
import { Input } from './input';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: Product) => void;
}

export function AddProductModal({ isOpen, onClose, onAdd }: AddProductModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: 'Tops',
      price: 150,
      sku: 'AUR-NEW-01',
      stock: 20,
      brandStorefrontPublished: true,
      marketplacePublished: true,
      isTryOnEligible: true
    }
  });

  if (!isOpen) return null;

  const onFormSubmit = (data: ProductFormValues) => {
    const prod: Product = {
      id: `prod_${Date.now()}`,
      name: data.name,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      sku: data.sku.toUpperCase(),
      category: data.category,
      price: data.price,
      stock: data.stock,
      brandStorefrontPublished: data.brandStorefrontPublished,
      marketplacePublished: data.marketplacePublished,
      isTryOnEligible: data.isTryOnEligible,
      tryOnCategory: data.category.toLowerCase(),
      image: data.image || 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80'
    };

    onAdd(prod);
    reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-white">Create New Apparel Item</h3>
            <p className="text-[11px] text-slate-400">Validated via React Hook Form & Zod Schema</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Product Title *</label>
            <Input
              {...register('name')}
              placeholder="e.g. Asymmetrical Bias-Cut Silk Dress"
              className={errors.name ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
            />
            {errors.name && (
              <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Category *</label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500 text-xs"
              >
                <option value="Tops">Tops</option>
                <option value="Bottoms">Bottoms</option>
                <option value="Dresses">Dresses</option>
                <option value="Outerwear">Outerwear</option>
              </select>
              {errors.category && (
                <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.category.message}</p>
              )}
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Price (USD) *</label>
              <Input
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className={errors.price ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
              />
              {errors.price && (
                <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">SKU *</label>
              <Input
                {...register('sku')}
                className={`font-mono ${errors.sku ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
              />
              {errors.sku && (
                <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.sku.message}</p>
              )}
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Initial Stock Quantity *</label>
              <Input
                type="number"
                {...register('stock', { valueAsNumber: true })}
                className={errors.stock ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
              />
              {errors.stock && (
                <p className="text-rose-400 text-[11px] mt-1 font-medium">{errors.stock.message}</p>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <span className="block font-semibold text-slate-200">Publication & AI Configuration:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('brandStorefrontPublished')}
                className="rounded accent-sky-500"
              />
              <span className="text-slate-300">Publish immediately to Brand Boutique Storefront</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('marketplacePublished')}
                className="rounded accent-emerald-500"
              />
              <span className="text-slate-300">Publish to Central Multi-Brand Marketplace</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isTryOnEligible')}
                className="rounded accent-purple-500"
              />
              <span className="text-purple-300 font-medium">Enable AI Virtual Try-On for this garment</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-sky-500 text-slate-950 font-bold hover:bg-sky-400"
            >
              Save & Validate
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
