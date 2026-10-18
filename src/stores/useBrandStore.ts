import { create } from 'zustand';
import { BrandProfile } from '../types';
import { initialBrands } from '../lib/mock_data';

interface BrandState {
  profile: BrandProfile;
  setProfile: (profile: BrandProfile) => void;
  updateStorefrontSettings: (settings: { announcement: string; primaryColor: string }) => void;
  incrementTryOnUsed: () => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  profile: initialBrands.aura,
  setProfile: (profile) => set({ profile }),
  updateStorefrontSettings: ({ announcement, primaryColor }) =>
    set((state) => ({
      profile: {
        ...state.profile,
        announcement,
        primaryColor
      }
    })),
  incrementTryOnUsed: () =>
    set((state) => ({
      profile: {
        ...state.profile,
        quotaUsed: state.profile.quotaUsed + 1
      }
    }))
}));
