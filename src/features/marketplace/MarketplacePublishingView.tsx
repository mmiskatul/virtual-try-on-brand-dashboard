'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, Eye, Globe, MousePointerClick, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { PublicationStatus } from '../../types';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useUiStore } from '../../stores/useUiStore';
import { brandWorkspaceApi } from '../../services';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  PermissionGate,
  SafeImage,
  SectionCard,
  StatusBadge,
} from '../../components/shared/UiPrimitives';
import { Button } from '../../components/ui/button';

export type MarketplaceTab = 'overview' | 'posts' | 'create' | 'drafts' | 'scheduled' | 'analytics';

export function MarketplacePublishingView({ initialTab = 'overview' }: { initialTab?: MarketplaceTab }) {
  const [tab, setTab] = useState<MarketplaceTab>(initialTab);

  const products = useWorkspaceStore((s) => s.products);
  const posts = useWorkspaceStore((s) => s.marketplacePosts);
  const profile = useWorkspaceStore((s) => s.profile);
  const addMarketplacePost = useWorkspaceStore((s) => s.addMarketplacePost);
  const updateMarketplacePost = useWorkspaceStore((s) => s.updateMarketplacePost);
  const deleteMarketplacePost = useWorkspaceStore((s) => s.deleteMarketplacePost);
  const updateProduct = useWorkspaceStore((s) => s.updateProduct);
  const showToast = useUiStore((s) => s.showToast);
  const hideToast = useUiStore((s) => s.hideToast);

  // Create Post form tied strictly to existing catalog productId
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const selectedProd = products.find((p) => p.id === selectedProdId) || products[0];
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [promoText, setPromoText] = useState('');
  const [postCollection, setPostCollection] = useState('Summer Collection');
  const [featuredRequested, setFeaturedRequested] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  const notify = (msg: string) => {
    showToast(msg);
    setTimeout(hideToast, 3000);
  };

  const visiblePosts = useMemo(() => {
    if (tab === 'drafts') return posts.filter((p) => p.status === 'DRAFT' || p.status === 'READY' || p.status === 'UNPUBLISHED');
    if (tab === 'scheduled') return posts.filter((p) => p.status === 'SCHEDULED');
    if (tab === 'posts') return posts.filter((p) => p.status === 'PUBLISHED');
    return posts;
  }, [posts, tab]);

  const handleTransitionStatus = async (postId: string, productId: string, nextStatus: PublicationStatus) => {
    updateMarketplacePost(postId, {
      status: nextStatus,
      publishedAt: nextStatus === 'PUBLISHED' ? new Date().toISOString() : undefined,
    });
    // Sync underlying product's marketplace visibility cleanly WITHOUT deleting catalog record!
    const isPublic = nextStatus === 'PUBLISHED';
    updateProduct(productId, { marketplacePublished: isPublic });
    try {
      await brandWorkspaceApi.setPublication(productId, 'marketplacePublished', isPublic);
    } catch {
      // Updated in workspace
    }
    notify(`Marketplace post transitioned to ${nextStatus}. Original catalog product remains intact.`);
  };

  const handleCreatePost = async (status: PublicationStatus) => {
    if (!selectedProd) return;
    const newPost = {
      id: `post_${Date.now()}`,
      tenantId: profile.id || 'tenant_aura',
      productId: selectedProd.id,
      title: postTitle.trim() || selectedProd.name,
      description: postDesc.trim() || selectedProd.description || '',
      category: selectedProd.category,
      collection: postCollection,
      promotionalText: promoText.trim() || undefined,
      tags: selectedProd.tags || [],
      featuredImage: selectedProd.image,
      gallery: selectedProd.images || [selectedProd.image],
      status,
      featuredRequested,
      scheduledFor: status === 'SCHEDULED' ? scheduleDate : undefined,
      publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : undefined,
      impressions: 0,
      clicks: 0,
      favorites: 0,
      orders: 0,
      revenue: 0,
    };
    addMarketplacePost(newPost);

    if (status === 'PUBLISHED') {
      updateProduct(selectedProd.id, { marketplacePublished: true });
      try {
        await brandWorkspaceApi.setPublication(selectedProd.id, 'marketplacePublished', true);
      } catch {}
    }

    setPostTitle('');
    setPostDesc('');
    notify(`Marketplace post created (${status}).`);
    setTab('overview');
  };

  const totalImpressions = posts.reduce((s, p) => s + p.impressions, 0);
  const totalClicks = posts.reduce((s, p) => s + p.clicks, 0);
  const totalRev = posts.reduce((s, p) => s + p.revenue, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

  return (
    <PermissionGate module="marketplace" action="view">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Global Marketplace Channel"
          title="Marketplace Publishing & Posts"
          subtitle="Explicitly promote selected catalog items to the public marketplace without creating duplicate SKUs."
          actions={
            <PermissionGate module="marketplace" action="publish">
              <Button size="sm" onClick={() => setTab('create')} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create Marketplace Post
              </Button>
            </PermissionGate>
          }
        />

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
          {(
            [
              ['overview', `All Posts (${posts.length})`],
              ['posts', 'Published'],
              ['drafts', 'Drafts & Unpublished'],
              ['scheduled', 'Scheduled'],
              ['analytics', 'Publication Analytics'],
              ['create', '+ Create Post'],
            ] as Array<[MarketplaceTab, string]>
          ).map(([k, lbl]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-3.5 py-2 rounded-xl border whitespace-nowrap ${
                tab === k ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {tab === 'analytics' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="Total Impressions" value={totalImpressions.toLocaleString()} icon={<Eye className="w-4 h-4" />} />
            <KpiCard label="Product Clicks" value={totalClicks.toLocaleString()} change={`${ctr}% CTR`} icon={<MousePointerClick className="w-4 h-4" />} />
            <KpiCard label="Attributed Orders" value={posts.reduce((s, p) => s + p.orders, 0)} icon={<ShoppingBag className="w-4 h-4" />} />
            <KpiCard label="Marketplace Revenue" value={`$${totalRev.toLocaleString()}`} icon={<Globe className="w-4 h-4" />} />
          </div>
        )}

        {tab === 'create' ? (
          <SectionCard title="Create Marketplace Post from Existing Product" subtitle="Links directly to your original catalog item rather than duplicating it">
            <div className="space-y-4 text-xs max-w-2xl">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Catalog Garment *</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — ${p.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marketplace Headline</label>
                  <input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder={selectedProd?.name} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Collection</label>
                  <input value={postCollection} onChange={(e) => setPostCollection(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Promotional Copy</label>
                <textarea rows={3} value={postDesc} onChange={(e) => setPostDesc(e.target.value)} placeholder={selectedProd?.description} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Promo Badge Text</label>
                  <input value={promoText} onChange={(e) => setPromoText(e.target.value)} placeholder="e.g. Limited Eid Silk Drop" className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Optional Schedule Time</label>
                  <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200" />
                </div>
              </div>

              <label className="flex items-center gap-2 font-semibold text-slate-700">
                <input type="checkbox" checked={featuredRequested} onChange={(e) => setFeaturedRequested(e.target.checked)} className="rounded accent-slate-950" />
                Request Featured Marketplace Placement
              </label>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleCreatePost('DRAFT')}>Save as Draft</Button>
                <Button size="sm" variant="outline" onClick={() => handleCreatePost('SCHEDULED')} className="gap-1"><Calendar className="w-3.5 h-3.5" /> Schedule Post</Button>
                <Button size="sm" onClick={() => handleCreatePost('PUBLISHED')}>Publish Immediately</Button>
              </div>
            </div>
          </SectionCard>
        ) : visiblePosts.length === 0 ? (
          <EmptyState
            title="No marketplace posts in this view"
            description="Select any catalog garment to craft a Marketplace publication post."
            actionLabel="Create Marketplace Post"
            onAction={() => setTab('create')}
          />
        ) : (
          <SectionCard>
            <div className="space-y-3">
              {visiblePosts.map((post) => (
                <div key={post.id} className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <SafeImage src={post.featuredImage} alt={post.title} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={post.status} />
                        <span className="text-[11px] font-semibold text-slate-500">{post.collection}</span>
                      </div>
                      <p className="font-bold text-slate-950 truncate">{post.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {post.impressions.toLocaleString()} views • {post.clicks} clicks • {post.orders} orders (${post.revenue.toLocaleString()})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link href={`/dashboard/products/${post.productId}`} className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-100">
                      Linked SKU
                    </Link>
                    {post.status !== 'PUBLISHED' ? (
                      <Button size="sm" onClick={() => handleTransitionStatus(post.id, post.productId, 'PUBLISHED')}>
                        Publish
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleTransitionStatus(post.id, post.productId, 'UNPUBLISHED')}>
                        Unpublish
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteMarketplacePost(post.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                      aria-label="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </PermissionGate>
  );
}

