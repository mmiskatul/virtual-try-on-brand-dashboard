import { createListenerMiddleware } from '@reduxjs/toolkit';
import {
  PERSISTED_WORKSPACE_KEYS,
  PersistedWorkspaceSlice,
  WorkspaceSliceState,
} from '../slices/workspaceSlice';

export const WORKSPACE_STORAGE_KEY = 'vton_brand_workspace_v2';

type HydrationListener = () => void;
const hydrationListeners = new Set<HydrationListener>();
let workspaceHydratedFlag = false;

export function isWorkspaceHydrated(): boolean {
  return workspaceHydratedFlag;
}

export function subscribeWorkspaceHydration(listener: HydrationListener): () => void {
  if (workspaceHydratedFlag) {
    listener();
    return () => {};
  }
  hydrationListeners.add(listener);
  return () => {
    hydrationListeners.delete(listener);
  };
}

export function notifyWorkspaceHydrated(): void {
  workspaceHydratedFlag = true;
  hydrationListeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // ignore subscriber failure
    }
  });
  hydrationListeners.clear();
}

export function readPersistedWorkspaceState(): Partial<PersistedWorkspaceSlice> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const candidate = parsed && typeof parsed === 'object' && 'state' in parsed ? parsed.state : parsed;
    if (!candidate || typeof candidate !== 'object') return null;
    return candidate as Partial<PersistedWorkspaceSlice>;
  } catch {
    return null;
  }
}

function pickPersistedWorkspace(workspace: WorkspaceSliceState): PersistedWorkspaceSlice {
  const snapshot = {} as PersistedWorkspaceSlice;
  for (const key of PERSISTED_WORKSPACE_KEYS) {
    // @ts-expect-error key belongs to PERSISTED_WORKSPACE_KEYS
    snapshot[key] = workspace[key];
  }
  return snapshot;
}

export const workspacePersistenceMiddleware = createListenerMiddleware();

workspacePersistenceMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    if (typeof window === 'undefined') return false;
    if (!action.type.startsWith('workspace/')) return false;
    if (action.type === 'workspace/hydrateWorkspace' || action.type === 'workspace/markHydrated') {
      return false;
    }
    const curr = (currentState as { workspace: WorkspaceSliceState }).workspace;
    const prev = (previousState as { workspace: WorkspaceSliceState }).workspace;
    if (!curr._hydrated || curr === prev) return false;
    return PERSISTED_WORKSPACE_KEYS.some((key) => curr[key] !== prev[key]);
  },
  effect: (_action, listenerApi) => {
    if (typeof window === 'undefined') return;
    try {
      const workspace = (listenerApi.getState() as { workspace: WorkspaceSliceState }).workspace;
      const persisted = pickPersistedWorkspace(workspace);
      window.localStorage.setItem(
        WORKSPACE_STORAGE_KEY,
        JSON.stringify({ state: persisted, version: 0 })
      );
    } catch {
      // Ignore storage quota or private-mode failures
    }
  },
});

