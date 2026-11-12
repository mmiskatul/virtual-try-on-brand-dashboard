import { Fabric } from '../types';
import { store } from '../store';
import { createSliceFacadeHook } from '../store/hooks';
import { selectFabricState } from '../store/selectors';
import { fabricActions } from '../store/slices/legacyBrandSlices';

const fabricBoundActions = {
  setFabrics: (fabrics: Fabric[]) => {
    store.dispatch(fabricActions.setFabrics(fabrics));
  },
  addFabric: (fabric: Fabric) => {
    store.dispatch(fabricActions.addFabric(fabric));
  },
};

export const useFabricStore = createSliceFacadeHook(selectFabricState, fabricBoundActions);
