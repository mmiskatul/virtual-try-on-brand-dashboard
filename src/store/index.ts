import { configureStore } from '@reduxjs/toolkit';
import workspaceReducer from './slices/workspaceSlice';
import uiReducer from './slices/uiSlice';
import { workspacePersistenceMiddleware } from './middleware/persistence';

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).prepend(workspacePersistenceMiddleware.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

