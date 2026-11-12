import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, RootState } from './index';
import { store } from './index';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<typeof store>();

/**
 * Creates a drop-in React-Redux facade hook with memoized slice selection
 * and stable singleton bound actions, plus `.getState()` for imperative callers.
 */
export function createSliceFacadeHook<TSlice, TActions extends object>(
  selectSlice: (state: RootState) => TSlice,
  boundActions: TActions
) {
  type Facade = TSlice & TActions;

  const selectFacade = createSelector([selectSlice], (slice): Facade => ({
    ...slice,
    ...boundActions,
  }));

  function useFacade(): Facade;
  function useFacade<TSelected>(selector: (state: Facade) => TSelected): TSelected;
  function useFacade<TSelected>(selector?: (state: Facade) => TSelected) {
    return useAppSelector((rootState) => {
      const facade = selectFacade(rootState);
      return selector ? selector(facade) : facade;
    });
  }

  useFacade.getState = (): Facade => selectFacade(store.getState());

  return useFacade;
}

