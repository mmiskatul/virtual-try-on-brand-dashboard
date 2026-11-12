import { BrandProfile } from '../types';
import { store } from '../store';
import { createSliceFacadeHook } from '../store/hooks';
import { selectBrandState } from '../store/selectors';
import { brandActions } from '../store/slices/legacyBrandSlices';

const brandBoundActions = {
  setProfile: (profile: BrandProfile) => {
    store.dispatch(brandActions.setProfile(profile));
  },
  updateStorefrontSettings: (settings: { announcement: string; primaryColor: string }) => {
    store.dispatch(brandActions.updateStorefrontSettings(settings));
  },
  incrementTryOnUsed: () => {
    store.dispatch(brandActions.incrementTryOnUsed());
  },
};

export const useBrandStore = createSliceFacadeHook(selectBrandState, brandBoundActions);
