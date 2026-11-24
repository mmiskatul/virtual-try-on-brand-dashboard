import { ResourceModule } from '../types';

export interface NavItem {
  label: string;
  href: string;
  module: ResourceModule;
  badgeKey?: 'orders' | 'lowStock' | 'draftPosts';
  /** Sub-pages live in the page's own tab bar: hidden from the sidebar but still searchable. */
  hidden?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  icon:
    | 'LayoutDashboard'
    | 'Palette'
    | 'Store'
    | 'ShoppingBag'
    | 'Globe'
    | 'Sparkles'
    | 'PackageCheck'
    | 'Boxes'
    | 'Users'
    | 'MessageSquare'
    | 'Megaphone'
    | 'BarChart3'
    | 'UserCog'
    | 'CreditCard'
    | 'Plug'
    | 'Settings';
  items: NavItem[];
}

export const SIDEBAR_NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: 'OVERVIEW',
    icon: 'LayoutDashboard',
    items: [
      { label: 'Dashboard', href: '/dashboard', module: 'overview' },
    ],
  },
  {
    id: 'products',
    label: 'PRODUCT MANAGEMENT',
    icon: 'ShoppingBag',
    items: [
      { label: 'Products', href: '/dashboard/products', module: 'products' },
      { label: 'Product Categories', href: '/dashboard/categories', module: 'products', hidden: true },
      { label: 'Collections', href: '/dashboard/collections', module: 'products', hidden: true },
    ],
  },
  {
    id: 'marketplace',
    label: 'MARKETPLACE',
    icon: 'Globe',
    items: [
      { label: 'Marketplace', href: '/dashboard/marketplace', module: 'marketplace', badgeKey: 'draftPosts' },
      { label: 'Published Posts', href: '/dashboard/marketplace/posts', module: 'marketplace', hidden: true },
      { label: 'Create Post', href: '/dashboard/marketplace/create', module: 'marketplace', hidden: true },
      { label: 'Draft Posts', href: '/dashboard/marketplace/drafts', module: 'marketplace', hidden: true },
      { label: 'Scheduled Posts', href: '/dashboard/marketplace/scheduled', module: 'marketplace', hidden: true },
    ],
  },
  {
    id: 'virtual-try-on',
    label: 'VIRTUAL TRY-ON',
    icon: 'Sparkles',
    items: [
      { label: 'Virtual Try-On', href: '/dashboard/virtual-try-on', module: 'tryon' },
      { label: 'Garments', href: '/dashboard/try-on-garments', module: 'tryon', hidden: true },
      { label: 'Sessions', href: '/dashboard/try-on-sessions', module: 'tryon', hidden: true },
    ],
  },
  {
    id: 'commerce',
    label: 'COMMERCE & ORDERS',
    icon: 'PackageCheck',
    items: [
      { label: 'Orders', href: '/dashboard/orders', module: 'orders', badgeKey: 'orders' },
    ],
  },
  {
    id: 'inventory',
    label: 'INVENTORY',
    icon: 'Boxes',
    items: [
      { label: 'Inventory', href: '/dashboard/inventory', module: 'inventory', badgeKey: 'lowStock' },
      { label: 'Inventory History', href: '/dashboard/inventory-history', module: 'inventory', hidden: true },
    ],
  },
  // Hidden from the sidebar until the backend for this module exists (pages stay reachable by URL).
  {
    id: 'reviews',
    label: 'REVIEWS',
    icon: 'MessageSquare',
    items: [{ label: 'Reviews', href: '/dashboard/reviews', module: 'customers' }],
  },
  {
    id: 'customers',
    label: 'CUSTOMERS',
    icon: 'Users',
    items: [{ label: 'Customers', href: '/dashboard/customers', module: 'customers' }],
  },
  {
    id: 'marketing',
    label: 'MARKETING',
    icon: 'Megaphone',
    items: [{ label: 'Discounts', href: '/dashboard/marketing', module: 'marketing' }],
  },
  {
    id: 'analytics',
    label: 'ANALYTICS',
    icon: 'BarChart3',
    items: [
      { label: 'Analytics', href: '/dashboard/analytics', module: 'analytics' },
    ],
  },
  {
    id: 'team',
    label: 'TEAM MANAGEMENT',
    icon: 'UserCog',
    items: [{ label: 'Team', href: '/dashboard/team', module: 'team' }],
  },
  {
    id: 'billing',
    label: 'BILLING & CREDITS',
    icon: 'CreditCard',
    items: [
      { label: 'Billing & Credits', href: '/dashboard/billing', module: 'billing' },
    ],
  },
  {
    id: 'settings',
    label: 'SETTINGS',
    icon: 'Settings',
    items: [
      { label: 'Settings', href: '/dashboard/settings', module: 'settings' },
      { label: 'Support', href: '/dashboard/support', module: 'settings', hidden: true },
    ],
  },
];

