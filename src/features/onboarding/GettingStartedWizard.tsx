'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services';
import { PageHeader, SectionCard } from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

const STEPS = [
  '1. Business Info',
  '2. Brand Identity',
  '3. Storefront',
  '4. First Product',
  '5. Virtual Try-On',
  '6. Marketplace Guide',
  '7. Launch',
];

export function GettingStartedWizard() {
  const profile = useWorkspaceStore((s) => s.profile);
  const updateProfile = useWorkspaceStore((s) => s.updateProfile);
  const addProduct = useWorkspaceStore((s) => s.addProduct);
  const tryOnConfig = useWorkspaceStore((s) => s.tryOnConfig);
  const updateTryOnConfig = useWorkspaceStore((s) => s.updateTryOnConfig);
  const step = useWorkspaceStore((s) => s.onboardingStep);
  const setStep = useWorkspaceStore((s) => s.setOnboardingStep);
  const toggleChecklist = useWorkspaceStore((s) => s.toggleOnboardingChecklist);
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  const [bizName, setBizName] = useState(profile.legalName || profile.name);
  const [bizEmail, setBizEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || '');
  const [city, setCity] = useState(profile.city || 'Dhaka');
  const [country, setCountry] = useState(profile.country || 'Bangladesh');

  const [brandName, setBrandName] = useState(profile.name);
  const [slogan, setSlogan] = useState(profile.slogan || '');
  const [primaryColor, setPrimaryColor] = useState(profile.primaryColor || '#0F172A');

  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('165');

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  const handleSaveBusiness = async () => {
    updateProfile({ legalName: bizName, email: bizEmail, phone, city, country });
    try {
      await brandWorkspaceApi.updateProfile({ contactEmail: bizEmail });
    } catch {
      // Saved in local workspace state cleanly
    }
    notify('Step 1 business details saved.');
    setStep(2);
  };

  const handleSaveIdentity = () => {
    updateProfile({ name: brandName, slogan, primaryColor });
    notify('Step 2 brand identity saved.');
    setStep(3);
  };

  const handleCreateQuickProduct = async () => {
    if (!prodName.trim()) {
      notify('Enter a garment title or skip ahead.');
      return;
    }
    addProduct({
      id: `prod_${Date.now()}`,
      name: prodName.trim(),
      slug: prodName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Dresses',
      price: Number(prodPrice) || 150,
      stock: 25,
      catalogStatus: 'ACTIVE',
      brandStorefrontPublished: true,
      marketplacePublished: false,
      isTryOnEligible: true,
      tryOnCategory: 'dresses',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
    });
    toggleChecklist('chk_product');
    notify('Garment created inside your private catalog!');
    setStep(5);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Guided Merchant Onboarding"
        title="Getting Started Wizard"
        subtitle="Configure your brand identity, first garments, Virtual Try-On experience, and marketplace visibility step-by-step."
      />

      {/* Step Indicator */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {STEPS.map((label, idx) => {
          const n = idx + 1;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setStep(n)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border whitespace-nowrap ${
                step === n
                  ? 'bg-slate-950 text-white border-slate-950'
                  : step > n
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <SectionCard title={STEPS[step - 1]} subtitle="Progress saves automatically so you can resume anytime.">
        {step === 1 && (
          <div className="space-y-4 text-xs max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Legal Business Name</label>
                <input value={bizName} onChange={(e) => setBizName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Business Email</label>
                <input value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">City &amp; Country</label>
                <input value={`${city}, ${country}`} onChange={(e) => { const [c1, c2] = e.target.value.split(','); setCity(c1?.trim() || ''); setCountry(c2?.trim() || ''); }} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
            </div>
            <Button onClick={handleSaveBusiness} size="sm">Save &amp; Continue &rarr;</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-xs max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Brand Display Name</label>
                <input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Accent Color</label>
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-20 h-9 rounded-lg border border-slate-200 p-1" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Brand Slogan</label>
                <input value={slogan} onChange={(e) => setSlogan(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>&larr; Back</Button>
              <Button size="sm" onClick={handleSaveIdentity}>Save &amp; Continue &rarr;</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-xs max-w-2xl">
            <p className="text-slate-600">
              Your dedicated public storefront is hosted cleanly at <code>/brands/{profile.slug}</code>. Customize sections, navigation, and pages inside the Storefront Builder.
            </p>
            <div className="flex gap-2">
              <Link href="/dashboard/storefront/editor">
                <Button variant="outline" size="sm">Open Visual Storefront Editor</Button>
              </Link>
              <Button size="sm" onClick={() => setStep(4)}>Next: Product Setup &rarr;</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-xs max-w-xl">
            <p className="text-slate-600">Create a garment in your private catalog first. Marketplace visibility remains OFF until you explicitly publish it.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="Garment Name (e.g. Raw Silk Coat)" className="px-3 py-2 rounded-xl border border-slate-200" />
              <input type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} placeholder="Price ($)" className="px-3 py-2 rounded-xl border border-slate-200" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep(3)}>&larr; Back</Button>
              <Button size="sm" onClick={handleCreateQuickProduct}>Create Garment &amp; Continue</Button>
              <Button variant="outline" size="sm" onClick={() => setStep(5)}>Skip</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 text-xs max-w-2xl">
            <label className="flex items-center gap-2 font-bold text-slate-900">
              <input type="checkbox" checked={tryOnConfig.enabled} onChange={(e) => updateTryOnConfig({ enabled: e.target.checked })} className="rounded accent-slate-950" />
              Enable Brand Virtual Try-On Experience (<code>/try/{profile.slug}</code>)
            </label>
            <p className="text-slate-600">Shoppers visiting your brand try-on URL only see eligible garments belonging strictly to {profile.name}.</p>
            <div className="flex gap-2">
              <Link href="/dashboard/virtual-try-on/appearance"><Button variant="outline" size="sm">Customize Try-On UI</Button></Link>
              <Button size="sm" onClick={() => setStep(6)}>Continue to Marketplace Setup &rarr;</Button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4 text-xs max-w-2xl">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900">Catalog vs. Global Marketplace Publication</p>
              <p className="text-slate-600">
                1. Adding a garment stores it privately inside your brand catalog.<br />
                2. Turning on <strong>Storefront Visible</strong> lists it at <code>/brands/{profile.slug}</code>.<br />
                3. Creating a <strong>Marketplace Post</strong> publishes selected styles to global marketplace discovery.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/marketplace/create"><Button variant="outline" size="sm">Create Marketplace Post</Button></Link>
              <Button size="sm" onClick={() => setStep(7)}>Review Launch Checklist &rarr;</Button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" /> Brand Workspace Ready for Operations
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard"><Button size="sm" className="gap-1"><Check className="w-3.5 h-3.5" /> Enter Command Center</Button></Link>
              <Link href={`/brands/${profile.slug}`} target="_blank"><Button variant="outline" size="sm" className="gap-1">View Public Storefront <ExternalLink className="w-3 h-3" /></Button></Link>
              <Link href={`/try/${profile.slug}`} target="_blank"><Button variant="outline" size="sm" className="gap-1"><Sparkles className="w-3.5 h-3.5" /> Open Public Try-On Page</Button></Link>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

