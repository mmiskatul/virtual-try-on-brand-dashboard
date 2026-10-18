/**
 * Production API Client for Brand Dashboard
 * Handles authenticated communication with brand-api (:4001) and ai-service (:8000)
 */

const BRAND_API_URL = process.env.NEXT_PUBLIC_BRAND_API_URL || 'http://localhost:4001';
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

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
  // Authentication
  login: (credentials: { email: string; password: string }) => {
    return request<{ token: string; user: any }>(`${BRAND_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
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
  },

  // AI Service Metrics
  getAiEngineStatus: () => {
    return request<any>(`${AI_SERVICE_URL}/health`);
  }
};
