export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  brandStorefrontPublished: boolean;
  marketplacePublished: boolean;
  isTryOnEligible: boolean;
  tryOnCategory: string;
  image: string;
}

export interface Fabric {
  id: string;
  name: string;
  composition: string;
  stretch: string;
  thickness: string;
  care: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';
  itemCount: number;
  date: string;
}

export interface BrandProfile {
  name: string;
  slug: string;
  owner: string;
  email: string;
  logo: string;
  banner: string;
  quotaUsed: number;
  quotaMax: number;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  announcement: string;
  primaryColor: string;
}

export type TabType = 'overview' | 'products' | 'fabrics' | 'inventory' | 'storefront' | 'orders' | 'ai';
