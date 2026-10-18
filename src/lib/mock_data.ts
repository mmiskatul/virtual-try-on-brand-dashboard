import { Product, Fabric, Order, BrandProfile } from '../types';

export const initialBrands: Record<'aura' | 'vogue', BrandProfile> = {
  aura: {
    name: 'Aura Atelier',
    slug: 'aura-atelier',
    owner: 'Elena Rostova',
    email: 'elena@auraatelier.com',
    logo: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
    quotaUsed: 124,
    quotaMax: 1000,
    plan: 'PRO',
    announcement: 'Free worldwide express shipping on orders over $150',
    primaryColor: '#0f172a'
  },
  vogue: {
    name: 'Vogue Nova',
    slug: 'vogue-nova',
    owner: 'Marcus Sterling',
    email: 'marcus@voguenova.com',
    logo: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    quotaUsed: 890,
    quotaMax: 5000,
    plan: 'ENTERPRISE',
    announcement: 'New Autumn/Winter Drop Available Now',
    primaryColor: '#18181b'
  }
};

export const initialProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Elysian Draped Silk Slip Dress',
    slug: 'elysian-draped-silk-slip-dress',
    sku: 'AUR-DRS-001',
    category: 'Dresses',
    price: 245,
    stock: 44,
    brandStorefrontPublished: true,
    marketplacePublished: true,
    isTryOnEligible: true,
    tryOnCategory: 'dresses',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod_2',
    name: 'Sculpted Linen Cross-Halter Top',
    slug: 'sculpted-linen-cross-halter-top',
    sku: 'AUR-TOP-044',
    category: 'Tops',
    price: 135,
    stock: 35,
    brandStorefrontPublished: true,
    marketplacePublished: false,
    isTryOnEligible: true,
    tryOnCategory: 'tops',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'prod_3',
    name: 'Aura Tailored Pleat Trousers',
    slug: 'aura-tailored-pleat-trousers',
    sku: 'AUR-TRS-108',
    category: 'Bottoms',
    price: 180,
    stock: 3,
    brandStorefrontPublished: true,
    marketplacePublished: true,
    isTryOnEligible: true,
    tryOnCategory: 'bottoms',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80'
  }
];

export const initialFabrics: Fabric[] = [
  {
    id: 'fab_1',
    name: 'Mulberry Silk Crepe',
    composition: '100% Organic Mulberry Silk',
    stretch: 'LOW',
    thickness: 'LIGHT',
    care: 'Dry clean only or delicate cold hand wash.'
  },
  {
    id: 'fab_2',
    name: 'Belgian Washed Slub Linen',
    composition: '100% Eco-Linen',
    stretch: 'NONE',
    thickness: 'MEDIUM',
    care: 'Machine wash 30°C, line dry in shade.'
  }
];

export const initialOrders: Order[] = [
  {
    id: 'ORD-77492',
    customerName: 'Sarah Miller',
    customerEmail: 'sarah.miller@example.com',
    total: 245,
    status: 'CONFIRMED',
    itemCount: 1,
    date: 'Today, 2:15 PM'
  },
  {
    id: 'ORD-77318',
    customerName: 'Chloe Bennett',
    customerEmail: 'chloe.b@fashion.org',
    total: 315,
    status: 'SHIPPED',
    itemCount: 2,
    date: 'Yesterday'
  }
];
