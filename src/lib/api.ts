/**
 * Production API Client for Brand Dashboard
 * Uses HttpOnly cookies (`vtry_brand_access`, `vtry_brand_refresh`, `vtry_brand_sid`) + single-flight refresh.
 */

export const BRAND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshInFlight: Promise<boolean> | null = null;

function isBackendUrl(url: string): boolean {
  return url.startsWith(BRAND_API_URL) || url.startsWith('/');
}

function shouldAttemptRefresh(url: string): boolean {
  const lower = url.toLowerCase();
  return !(
    lower.includes('/auth/login') ||
    lower.includes('/auth/register') ||
    lower.includes('/auth/refresh') ||
    lower.includes('/auth/logout')
  );
}

export async function refreshBrandSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BRAND_API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Auth-Portal': 'brand',
          'X-Auth-Transport': 'cookie',
        },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function brandFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const backendCall = isBackendUrl(url);
  if (backendCall) {
    headers.set('X-Auth-Portal', 'brand');
    headers.set('X-Auth-Transport', 'cookie');
  }

  const doFetch = () =>
    fetch(url, {
      ...options,
      headers,
      credentials: backendCall ? 'include' : options.credentials,
    });

  let response = await doFetch();
  if (response.status === 401 && backendCall && shouldAttemptRefresh(url)) {
    const refreshed = await refreshBrandSession();
    if (refreshed) {
      response = await doFetch();
    }
  }
  return response;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await brandFetch(url, options);

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, errorData?.message || `HTTP ${response.status}`, errorData);
  }

  return response.json();
}

export const brandApi = {
  // Authentication & Recovery
  login: (credentials: { email: string; password: string }) => {
    return request<{ sessionId?: string; user: any; tenant?: any }>(`${BRAND_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  session: () => {
    return request<{
      authenticated: boolean;
      refreshed?: boolean;
      sessionId?: string | null;
      user: any | null;
      tenant?: any;
    }>(`${BRAND_API_URL}/api/v1/auth/session`, {
      method: 'GET',
      cache: 'no-store',
    });
  },

  logout: () => {
    return request<{ ok: boolean; loggedOut: boolean; message: string }>(
      `${BRAND_API_URL}/api/v1/auth/logout`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );
  },

  register: (payload: {
    brandName: string;
    ownerName: string;
    email: string;
    password: string;
  }) => {
    return request<{
      message: string;
      requiresEmailVerification: boolean;
      emailDelivered?: boolean;
      warning?: string;
      user: any;
      tenant: any;
    }>(`${BRAND_API_URL}/api/v1/auth/register`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  verifyEmail: (payload: { token?: string; email?: string; code?: string }) => {
    return request<{ message: string; user: any }>(`${BRAND_API_URL}/api/v1/auth/verify-email`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  resendVerification: (email: string) => {
    return request<{
      message: string;
      alreadyVerified?: boolean;
    }>(`${BRAND_API_URL}/api/v1/auth/resend-verification`, {
      method: 'POST',
      body: JSON.stringify({ email, portal: 'brand' })
    });
  },

  forgotPassword: (email: string) => {
    return request<{ message: string }>(
      `${BRAND_API_URL}/api/v1/auth/forgot-password`,
      {
        method: 'POST',
        body: JSON.stringify({ email, portal: 'brand' })
      }
    );
  },

  verifyResetToken: (payload: { token?: string; email?: string; code?: string }) => {
    return request<{ valid: boolean; email: string; expiresAt: number }>(
      `${BRAND_API_URL}/api/v1/auth/verify-reset-token`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );
  },

  resetPassword: (payload: { token?: string; email?: string; code?: string; newPassword: string }) => {
    return request<{ message: string }>(`${BRAND_API_URL}/api/v1/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, portal: 'brand' })
    });
  },

  // Products
  getProducts: () => {
    return request<any[]>(`${BRAND_API_URL}/api/v1/products`);
  },

  createProduct: (payload: any) => {
    return request<any>(`${BRAND_API_URL}/api/v1/products`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  setPublication: (productId: string, channel: 'brandStorefrontPublished' | 'marketplacePublished', published: boolean) => {
    return request<any>(`${BRAND_API_URL}/api/v1/products/${productId}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ channel, published })
    });
  },

  // Concurrency-safe inventory
  adjustInventory: (payload: { productId: string; variantSku: string; change: number; reason: string }) => {
    return request<{ success: boolean; newStock: number }>(`${BRAND_API_URL}/api/v1/inventory/adjust`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Fabrics
  getFabrics: () => {
    return request<any[]>(`${BRAND_API_URL}/api/v1/fabrics`);
  },

  createFabric: (fabric: any) => {
    return request<any>(`${BRAND_API_URL}/api/v1/fabrics`, {
      method: 'POST',
      body: JSON.stringify(fabric)
    });
  },

  // Orders
  getOrders: () => {
    return request<any[]>(`${BRAND_API_URL}/api/v1/brand/orders`);
  },

  updateOrderStatus: (orderId: string, status: string) => {
    return request<any>(`${BRAND_API_URL}/api/v1/brand/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Storefront Customization
  updateStorefrontSettings: (settings: any) => {
    return request<any>(`${BRAND_API_URL}/api/v1/brand/storefront-settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
};
