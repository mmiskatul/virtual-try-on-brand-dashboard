'use client';

import { signOut } from 'next-auth/react';
import { brandApi } from './api';
import { WORKSPACE_STORAGE_KEY } from '../store/middleware/persistence';

/** Business details and role overrides saved in the browser must not outlive the session. */
function clearSavedWorkspace() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  } catch {
    // storage can be blocked; nothing else to do
  }
}

export async function logoutBrand(options: { callbackUrl?: string; redirect?: boolean } = {}) {
  try {
    await brandApi.logout();
  } catch {
    // Still clear NextAuth session cookie even if backend is temporarily unreachable
  }

  if (typeof window !== 'undefined' && localStorage.getItem('brand_token')) {
    localStorage.removeItem('brand_token');
  }

  clearSavedWorkspace();

  if (options.redirect === false) {
    await signOut({ redirect: false });
    return;
  }

  await signOut({ callbackUrl: options.callbackUrl || '/login' });
}

