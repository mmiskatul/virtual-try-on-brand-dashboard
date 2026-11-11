import { PermissionAction, ResourceModule, StaffRole } from '../types';

const ALL_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
  'publish',
  'export',
  'manage_settings',
];

export const DEFAULT_ROLE_PERMISSIONS: Record<
  StaffRole,
  Partial<Record<ResourceModule, PermissionAction[]>>
> = {
  OWNER: {
    overview: ALL_ACTIONS,
    brand: ALL_ACTIONS,
    storefront: ALL_ACTIONS,
    products: ALL_ACTIONS,
    marketplace: ALL_ACTIONS,
    tryon: ALL_ACTIONS,
    orders: ALL_ACTIONS,
    inventory: ALL_ACTIONS,
    customers: ALL_ACTIONS,
    marketing: ALL_ACTIONS,
    analytics: ALL_ACTIONS,
    team: ALL_ACTIONS,
    billing: ALL_ACTIONS,
    integrations: ALL_ACTIONS,
    settings: ALL_ACTIONS,
  },
  ADMINISTRATOR: {
    overview: ALL_ACTIONS,
    brand: ALL_ACTIONS,
    storefront: ALL_ACTIONS,
    products: ALL_ACTIONS,
    marketplace: ALL_ACTIONS,
    tryon: ALL_ACTIONS,
    orders: ALL_ACTIONS,
    inventory: ALL_ACTIONS,
    customers: ALL_ACTIONS,
    marketing: ALL_ACTIONS,
    analytics: ALL_ACTIONS,
    team: ['view', 'create', 'edit'],
    billing: ['view', 'export'],
    integrations: ['view', 'edit', 'manage_settings'],
    settings: ['view', 'edit', 'manage_settings'],
  },
  PRODUCT_MANAGER: {
    overview: ['view'],
    brand: ['view'],
    products: ['view', 'create', 'edit', 'delete', 'export'],
    inventory: ['view', 'create', 'edit', 'export'],
    tryon: ['view', 'edit'],
    analytics: ['view'],
  },
  MARKETING_MANAGER: {
    overview: ['view'],
    brand: ['view', 'edit'],
    storefront: ['view', 'create', 'edit', 'publish'],
    marketplace: ['view', 'create', 'edit', 'publish', 'delete'],
    marketing: ['view', 'create', 'edit', 'delete', 'publish'],
    customers: ['view'],
    analytics: ['view', 'export'],
  },
  ORDER_MANAGER: {
    overview: ['view'],
    orders: ['view', 'edit', 'export'],
    inventory: ['view', 'edit'],
    customers: ['view', 'edit'],
    analytics: ['view'],
  },
  CUSTOMER_SUPPORT: {
    overview: ['view'],
    orders: ['view', 'edit'],
    customers: ['view', 'edit'],
    products: ['view'],
    tryon: ['view'],
  },
  TRYON_MANAGER: {
    overview: ['view'],
    products: ['view', 'edit'],
    tryon: ['view', 'create', 'edit', 'publish', 'manage_settings'],
    analytics: ['view', 'export'],
    settings: ['view'],
  },
};

export const ROLE_LABELS: Record<StaffRole, { label: string; summary: string }> = {
  OWNER: { label: 'Owner', summary: 'Full workspace control including billing, team, and security.' },
  ADMINISTRATOR: { label: 'Administrator', summary: 'Operational access across products, storefront, orders, and integrations.' },
  PRODUCT_MANAGER: { label: 'Product Manager', summary: 'Manages products, variants, categories, collections, and inventory.' },
  MARKETING_MANAGER: { label: 'Marketing Manager', summary: 'Controls marketplace posts, storefront content, and campaigns.' },
  ORDER_MANAGER: { label: 'Order Manager', summary: 'Handles order fulfillment, tracking, returns, and refunds.' },
  CUSTOMER_SUPPORT: { label: 'Customer Support', summary: 'Assists shoppers, reviews, and return inquiries.' },
  TRYON_MANAGER: { label: 'Virtual Try-On Manager', summary: 'Configures garment eligibility, try-on appearance, and AI studio telemetry.' },
};

export function canPerform(
  role: StaffRole,
  module: ResourceModule,
  action: PermissionAction,
  overrides?: Partial<Record<StaffRole, Partial<Record<ResourceModule, PermissionAction[]>>>>
): boolean {
  const matrix = overrides?.[role]?.[module] || DEFAULT_ROLE_PERMISSIONS[role]?.[module] || [];
  return matrix.includes(action);
}

