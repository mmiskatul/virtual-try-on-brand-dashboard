import { ResourceModule } from '../types';

export interface NavItem {
  label: string;
  href: string;
  module: ResourceModule;
  badgeKey?: 'orders' | 'lowStock' | 'draftPosts';
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
      { label: 'Getting Started', href: '/dashboard/getting-started', module: 'overview' },
    ],
  },
  {
    id: 'brand',
    label: 'BRAND & STOREFRONT',
    icon: 'Palette',
    items: [
      { label: 'Brand Hub', href: '/dashboard/brand', module: 'brand' },
      { label: 'Brand Profile', href: '/dashboard/brand/profile', module: 'brand' },
      { label: 'Visual Identity', href: '/dashboard/brand/identity', module: 'brand' },
      { label: 'Brand Media Library', href: '/dashboard/brand/media', module: 'brand' },
      { label: 'Storefront Builder', href: '/dashboard/storefront/editor', module: 'storefront' },
      { label: 'Website Pages', href: '/dashboard/storefront/pages', module: 'storefront' },
      { label: 'Navigation & Menus', href: '/dashboard/storefront/navigation', module: 'storefront' },
      { label: 'Storefront Domain', href: '/dashboard/storefront/domain', module: 'storefront' },
      { label: 'Storefront SEO', href: '/dashboard/storefront/seo', module: 'storefront' },
    ],
  },
  {
    id: 'products',
    label: 'PRODUCT MANAGEMENT',
    icon: 'ShoppingBag',
    items: [
      { label: 'All Products', href: '/dashboard/products', module: 'products' },
      { label: 'Add Product', href: '/dashboard/products/create', module: 'products' },
      { label: 'Product Categories', href: '/dashboard/products/categories', module: 'products' },
      { label: 'Collections', href: '/dashboard/products/collections', module: 'products' },
      { label: 'Attributes & Fabrics', href: '/dashboard/products/attributes', module: 'products' },
      { label: 'Bulk Import (CSV)', href: '/dashboard/products/import', module: 'products' },
      { label: 'Export Catalog', href: '/dashboard/products/export', module: 'products' },
    ],
  },
  {
    id: 'marketplace',
    label: 'MARKETPLACE',
    icon: 'Globe',
    items: [
      { label: 'Marketplace Overview', href: '/dashboard/marketplace', module: 'marketplace' },
      { label: 'Published Posts', href: '/dashboard/marketplace/posts', module: 'marketplace' },
      { label: 'Create Post', href: '/dashboard/marketplace/create', module: 'marketplace' },
      { label: 'Draft Posts', href: '/dashboard/marketplace/drafts', module: 'marketplace', badgeKey: 'draftPosts' },
      { label: 'Scheduled Posts', href: '/dashboard/marketplace/scheduled', module: 'marketplace' },
      { label: 'Marketplace Analytics', href: '/dashboard/marketplace/analytics', module: 'marketplace' },
    ],
  },
  {
    id: 'virtual-try-on',
    label: 'VIRTUAL TRY-ON',
    icon: 'Sparkles',
    items: [
      { label: 'Try-On Overview', href: '/dashboard/virtual-try-on', module: 'tryon' },
      { label: 'Try-On Studio', href: '/dashboard/virtual-try-on/studio', module: 'tryon' },
      { label: 'Configuration', href: '/dashboard/virtual-try-on/configuration', module: 'tryon' },
      { label: 'Garment Eligibility', href: '/dashboard/virtual-try-on/products', module: 'tryon' },
      { label: 'Appearance Editor', href: '/dashboard/virtual-try-on/appearance', module: 'tryon' },
      { label: 'Widget & Embed', href: '/dashboard/virtual-try-on/embedding', module: 'tryon' },
      { label: 'Generation History', href: '/dashboard/virtual-try-on/history', module: 'tryon' },
      { label: 'Try-On Analytics', href: '/dashboard/virtual-try-on/analytics', module: 'tryon' },
      { label: 'Privacy & Consent', href: '/dashboard/virtual-try-on/privacy', module: 'tryon' },
    ],
  },
  {
    id: 'commerce',
    label: 'COMMERCE & ORDERS',
    icon: 'PackageCheck',
    items: [
      { label: 'Orders', href: '/dashboard/orders', module: 'orders', badgeKey: 'orders' },
      { label: 'Abandoned Carts', href: '/dashboard/orders/abandoned', module: 'orders' },
      { label: 'Returns', href: '/dashboard/orders/returns', module: 'orders' },
      { label: 'Refunds & Ledger', href: '/dashboard/orders/refunds', module: 'orders' },
    ],
  },
  {
    id: 'inventory',
    label: 'INVENTORY',
    icon: 'Boxes',
    items: [
      { label: 'Stock Overview', href: '/dashboard/inventory', module: 'inventory', badgeKey: 'lowStock' },
      { label: 'Warehouses / Locations', href: '/dashboard/inventory/locations', module: 'inventory' },
      { label: 'Stock Adjustments', href: '/dashboard/inventory/adjustments', module: 'inventory' },
      { label: 'Inventory History', href: '/dashboard/inventory/history', module: 'inventory' },
    ],
  },
  {
    id: 'customers',
    label: 'CUSTOMERS',
    icon: 'Users',
    items: [
      { label: 'All Customers', href: '/dashboard/customers', module: 'customers' },
      { label: 'Customer Groups', href: '/dashboard/customers/groups', module: 'customers' },
      { label: 'Reviews & Ratings', href: '/dashboard/customers/reviews', module: 'customers' },
    ],
  },
  {
    id: 'marketing',
    label: 'MARKETING',
    icon: 'Megaphone',
    items: [
      { label: 'Marketing Overview', href: '/dashboard/marketing', module: 'marketing' },
      { label: 'Campaigns', href: '/dashboard/marketing/campaigns', module: 'marketing' },
      { label: 'Discounts', href: '/dashboard/marketing/discounts', module: 'marketing' },
      { label: 'Coupons', href: '/dashboard/marketing/coupons', module: 'marketing' },
      { label: 'Newsletter', href: '/dashboard/marketing/newsletter', module: 'marketing' },
    ],
  },
  {
    id: 'analytics',
    label: 'ANALYTICS',
    icon: 'BarChart3',
    items: [
      { label: 'Business Analytics', href: '/dashboard/analytics', module: 'analytics' },
      { label: 'Sales Reports', href: '/dashboard/analytics/sales', module: 'analytics' },
      { label: 'Product Performance', href: '/dashboard/analytics/products', module: 'analytics' },
      { label: 'Customer Analytics', href: '/dashboard/analytics/customers', module: 'analytics' },
      { label: 'Marketplace Analytics', href: '/dashboard/analytics/marketplace', module: 'analytics' },
      { label: 'Virtual Try-On Reports', href: '/dashboard/analytics/virtual-try-on', module: 'analytics' },
    ],
  },
  {
    id: 'team',
    label: 'TEAM MANAGEMENT',
    icon: 'UserCog',
    items: [
      { label: 'Team Overview', href: '/dashboard/team', module: 'team' },
      { label: 'Team Members', href: '/dashboard/team/members', module: 'team' },
      { label: 'Roles & Permissions', href: '/dashboard/team/roles', module: 'team' },
      { label: 'Activity Logs', href: '/dashboard/team/activity', module: 'team' },
    ],
  },
  {
    id: 'billing',
    label: 'BILLING & CREDITS',
    icon: 'CreditCard',
    items: [
      { label: 'Billing Overview', href: '/dashboard/billing', module: 'billing' },
      { label: 'Subscription Plan', href: '/dashboard/billing/plan', module: 'billing' },
      { label: 'AI Usage & Credits', href: '/dashboard/billing/usage', module: 'billing' },
      { label: 'Invoices', href: '/dashboard/billing/invoices', module: 'billing' },
      { label: 'Payment Methods', href: '/dashboard/billing/payment-methods', module: 'billing' },
    ],
  },
  {
    id: 'integrations',
    label: 'INTEGRATIONS & API',
    icon: 'Plug',
    items: [
      { label: 'Integrations Hub', href: '/dashboard/integrations', module: 'integrations' },
      { label: 'Payment Gateways', href: '/dashboard/integrations/payments', module: 'integrations' },
      { label: 'Shipping Providers', href: '/dashboard/integrations/shipping', module: 'integrations' },
      { label: 'Analytics Integrations', href: '/dashboard/integrations/analytics', module: 'integrations' },
      { label: 'API Credentials', href: '/dashboard/developer/api', module: 'integrations' },
      { label: 'Webhooks', href: '/dashboard/developer/webhooks', module: 'integrations' },
    ],
  },
  {
    id: 'settings',
    label: 'SETTINGS',
    icon: 'Settings',
    items: [
      { label: 'All Settings', href: '/dashboard/settings', module: 'settings' },
      { label: 'General', href: '/dashboard/settings/general', module: 'settings' },
      { label: 'Business Information', href: '/dashboard/settings/business', module: 'settings' },
      { label: 'Store Availability', href: '/dashboard/settings/store', module: 'settings' },
      { label: 'Domains', href: '/dashboard/settings/domains', module: 'settings' },
      { label: 'Localization', href: '/dashboard/settings/localization', module: 'settings' },
      { label: 'Currency & Taxes', href: '/dashboard/settings/tax', module: 'settings' },
      { label: 'Shipping Rules', href: '/dashboard/settings/shipping', module: 'settings' },
      { label: 'Notifications', href: '/dashboard/settings/notifications', module: 'settings' },
      { label: 'Privacy & Data', href: '/dashboard/settings/privacy', module: 'settings' },
      { label: 'Security', href: '/dashboard/settings/security', module: 'settings' },
      { label: 'Account Settings', href: '/dashboard/settings/account', module: 'settings' },
    ],
  },
];

