/**
 * Production API Client for Brand Dashboard
 * Handles authenticated communication with backend-api (:4000) and ai-service (:8000)
 */

const BRAND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject Authorization token if stored in localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('brand_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

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
    return request<{ token: string; user: any; tenant?: any }>(`${BRAND_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
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
