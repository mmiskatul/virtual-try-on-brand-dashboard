import {
  DEMO_BRAND_PROFILE,
  DEMO_FABRICS,
  DEMO_ORDERS,
  DEMO_PRODUCTS,
} from '../data/brandDemoSeed';

export const initialBrands = {
  aura: DEMO_BRAND_PROFILE,
  vogue: {
    ...DEMO_BRAND_PROFILE,
    id: 'tenant_vogue',
    name: 'Vogue Nova',
    slug: 'vogue-nova',
    owner: 'Marcus Sterling',
    email: 'marcus@voguenova.com',
  },
};

export const initialProducts = DEMO_PRODUCTS;
export const initialFabrics = DEMO_FABRICS;
export const initialOrders = DEMO_ORDERS;
