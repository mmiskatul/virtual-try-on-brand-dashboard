import { describe, expect, it } from 'vitest';
import { moduleLevel, serverCan, type ServerAccess } from '@/config/access';
import type { ResourceModule } from '@/types';

// The permissions each server role really has (copied from the backend role catalog).
const ROLES: Record<string, string[]> = {
  BRAND_OWNER: ['brand:products:read', 'brand:products:write', 'brand:orders:read', 'brand:orders:write', 'brand:analytics:read', 'brand:staff:manage', 'brand:billing:manage', 'brand:tryon:use'],
  BRAND_ADMIN: ['brand:products:read', 'brand:products:write', 'brand:orders:read', 'brand:orders:write', 'brand:analytics:read', 'brand:staff:manage', 'brand:tryon:use'],
  CATALOG_MANAGER: ['brand:products:read', 'brand:products:write', 'brand:tryon:use'],
  INVENTORY_MANAGER: ['brand:products:read', 'brand:products:write'],
  ORDER_MANAGER: ['brand:orders:read', 'brand:orders:write', 'brand:products:read'],
  SUPPORT_AGENT: ['brand:orders:read', 'brand:products:read'],
  ANALYTICS_VIEWER: ['brand:analytics:read', 'brand:products:read', 'brand:orders:read'],
};
const access = (role: string): ServerAccess => ({ role, permissions: ROLES[role] });

const MODULES: ResourceModule[] = ['overview', 'products', 'marketplace', 'tryon', 'orders', 'inventory', 'customers', 'marketing', 'analytics', 'team', 'billing', 'integrations', 'settings'];
const visible = (role: string) => MODULES.filter((m) => serverCan(access(role), m, 'view'));

describe('menu per server role', () => {
  it('the owner sees everything', () => {
    expect(visible('BRAND_OWNER')).toEqual(MODULES);
  });

  it('an admin sees everything except billing, which only the owner can manage', () => {
    expect(visible('BRAND_ADMIN')).toEqual(MODULES.filter((m) => m !== 'billing'));
  });

  it('order and support roles see orders and customers, but never team, billing, developers or analytics', () => {
    for (const role of ['ORDER_MANAGER', 'SUPPORT_AGENT']) {
      const v = visible(role);
      expect(v).toContain('orders');
      expect(v).toContain('customers');
      for (const hidden of ['team', 'billing', 'integrations', 'analytics']) expect(v).not.toContain(hidden);
    }
  });

  it('catalog and inventory roles see products but never orders, customers, discounts or analytics', () => {
    for (const role of ['CATALOG_MANAGER', 'INVENTORY_MANAGER']) {
      const v = visible(role);
      expect(v).toContain('products');
      expect(v).toContain('inventory');
      for (const hidden of ['orders', 'customers', 'marketing', 'analytics', 'team', 'billing', 'integrations']) expect(v).not.toContain(hidden);
    }
  });

  it('an analytics viewer sees reports and orders but cannot change anything', () => {
    const a = access('ANALYTICS_VIEWER');
    expect(serverCan(a, 'analytics', 'view')).toBe(true);
    for (const m of MODULES) {
      for (const action of ['create', 'edit', 'delete', 'publish'] as const) {
        expect(serverCan(a, m, action), `${m} ${action}`).toBe(false);
      }
    }
  });
});

describe('view versus change', () => {
  it('lets an order manager process orders but only look at products', () => {
    const a = access('ORDER_MANAGER');
    expect(serverCan(a, 'orders', 'edit')).toBe(true);
    expect(serverCan(a, 'products', 'view')).toBe(true);
    expect(serverCan(a, 'products', 'create')).toBe(false);
    expect(serverCan(a, 'inventory', 'edit')).toBe(false);
  });

  it('lets a catalog manager edit products and use try-on', () => {
    const a = access('CATALOG_MANAGER');
    expect(serverCan(a, 'products', 'create')).toBe(true);
    expect(serverCan(a, 'tryon', 'view')).toBe(true);
    expect(serverCan(a, 'orders', 'view')).toBe(false);
  });

  it('only owners and admins can create discounts, though order roles may look at them', () => {
    expect(serverCan(access('ORDER_MANAGER'), 'marketing', 'view')).toBe(true);
    expect(serverCan(access('ORDER_MANAGER'), 'marketing', 'create')).toBe(false);
    expect(serverCan(access('BRAND_ADMIN'), 'marketing', 'create')).toBe(true);
  });

  it('keeps unknown roles and empty permissions locked out', () => {
    expect(moduleLevel({ role: 'SOMETHING_NEW', permissions: [] }, 'products')).toBe('none');
    expect(moduleLevel({ role: 'SOMETHING_NEW', permissions: [] }, 'settings')).toBe('none');
    expect(moduleLevel({ role: 'BRAND_OWNER', permissions: ROLES.BRAND_OWNER }, 'nonexistent' as ResourceModule)).toBe('none');
  });
});
