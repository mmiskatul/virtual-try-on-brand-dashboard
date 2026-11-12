'use client';

import { signOut } from 'next-auth/react';
import { brandApi } from './api';

export async function logoutBrand(options: { callbackUrl?: string; redirect?: boolean } = {}) {
  try {
    await brandApi.logout();
  } catch {
    // Still clear NextAuth session cookie even if backend is temporarily unreachable
  }

  if (typeof window !== 'undefined' && localStorage.getItem('brand_token')) {
    localStorage.removeItem('brand_token');
  }

  if (options.redirect === false) {
    await signOut({ redirect: false });
    return;
  }

  await signOut({ callbackUrl: options.callbackUrl || '/login' });
}

