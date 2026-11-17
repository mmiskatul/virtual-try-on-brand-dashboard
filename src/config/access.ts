import { useSyncExternalStore } from 'react';
import type { PermissionAction, ResourceModule } from '../types';

/**
 * What the signed-in person may do, as decided by the SERVER (their real role and permissions).
 * The menu and the pages follow this, so a limited team member only sees what works for them.
 * The server still enforces every request; this only avoids showing doors that are locked.
 */
export interface ServerAccess {
  role: string;
  permissions: string[];
}

export const ROLE_TITLES: Record<string, string> = {
  BRAND_OWNER: 'Owner',
  BRAND_ADMIN: 'Admin',
  CATALOG_MANAGER: 'Catalog Manager',
  INVENTORY_MANAGER: 'Inventory Manager',
  ORDER_MANAGER: 'Order Manager',
  SUPPORT_AGENT: 'Support Agent',
  ANALYTICS_VIEWER: 'Analytics Viewer',
  STORE_MANAGER: 'Store Manager',
};

type Level = 'none' | 'view' | 'manage';

/** Mirrors the server's guards, route group by route group. */
export function moduleLevel(access: ServerAccess, module: ResourceModule): Level {
  const has = (p: string) => access.permissions.includes(p);
  const isOwnerOrAdmin = access.role === 'BRAND_OWNER' || access.role === 'BRAND_ADMIN';
  const lvl = (read: boolean, write: boolean): Level => (write ? 'manage' : read ? 'view' : 'none');

  switch (module) {
    case 'overview':
      return has('brand:products:read') ? 'view' : 'none';
    case 'products':
    case 'marketplace':
    case 'inventory':
      return lvl(has('brand:products:read'), has('brand:products:write'));
    case 'tryon':
      return lvl(has('brand:tryon:use') || has('brand:products:read'), has('brand:tryon:use') && has('brand:products:write'));
    case 'orders':
    case 'customers':
      return lvl(has('brand:orders:read'), has('brand:orders:write'));
    case 'marketing':
      return lvl(has('brand:orders:read'), isOwnerOrAdmin);
    case 'analytics':
      return has('brand:analytics:read') ? 'view' : 'none';
    case 'team':
    case 'integrations':
      return isOwnerOrAdmin ? 'manage' : 'none';
    case 'billing':
      return has('brand:billing:manage') ? 'manage' : 'none';
    case 'brand':
    case 'storefront':
    case 'settings':
      // everyone can open Settings (password, devices); changing the shop itself is for owners and admins
      return isOwnerOrAdmin ? 'manage' : has('brand:products:read') ? 'view' : 'none';
    default:
      return 'none';
  }
}

export function serverCan(access: ServerAccess, module: ResourceModule, action: PermissionAction): boolean {
  const level = moduleLevel(access, module);
  if (level === 'none') return false;
  return action === 'view' ? true : level === 'manage';
}

// ---- a tiny shared store so components re-render when the access arrives ------------------
let current: ServerAccess | null = null;
const listeners = new Set<() => void>();

export function setServerAccess(next: ServerAccess | null) {
  current = next;
  listeners.forEach((l) => l());
}

export function getServerAccess(): ServerAccess | null {
  return current;
}

export function useServerAccess(): ServerAccess | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getServerAccess,
    () => null
  );
}
