/**
 * Browser-side storage for unfinished products.
 *
 *  - Drafts: the half-filled Add Product form, saved as the brand types, so a refresh loses nothing.
 *  - Staged images: photos picked in the form are kept here as files and only uploaded when the product is saved.
 *    Until then the form holds a local reference ("local:<scope>:<id>") instead of a link.
 *
 * Everything lives in IndexedDB. If IndexedDB is not available (private mode, old browser) it degrades gracefully:
 * staged images are kept in memory for the current page visit and drafts are simply not saved.
 */

const DB_NAME = 'vtry-brand-drafts';
const DB_VERSION = 1;
const DRAFTS = 'drafts';
const IMAGES = 'images';

/** Bump this when the form changes shape, so an old draft is ignored instead of breaking the page. */
export const DRAFT_VERSION = 1;

export interface ProductDraft {
  id: string;
  version: number;
  /** Which brand the draft belongs to, so brands never see each other's drafts on a shared computer. */
  tenantKey: string;
  /** The form exactly as it was (JSON). Photos are links or local references. */
  form: unknown;
  step: number;
  maxReached: number;
  /** For the list: what to call it. */
  title: string;
  updatedAt: number;
}

interface StagedImageRecord {
  ref: string;
  scope: string;
  blob: Blob;
  name: string;
  type: string;
}

const LOCAL_PREFIX = 'local:';
export const isLocalRef = (value: unknown): value is string => typeof value === 'string' && value.startsWith(LOCAL_PREFIX);

// ─── Database ────────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(DRAFTS)) db.createObjectStore(DRAFTS, { keyPath: 'id' });
          if (!db.objectStoreNames.contains(IMAGES)) {
            const images = db.createObjectStore(IMAGES, { keyPath: 'ref' });
            images.createIndex('scope', 'scope', { unique: false });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

function run<T>(store: string, mode: IDBTransactionMode, action: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve) => {
        if (!db) return resolve(undefined);
        try {
          const tx = db.transaction(store, mode);
          const request = action(tx.objectStore(store));
          tx.oncomplete = () => resolve(request ? (request.result as T) : undefined);
          tx.onerror = () => resolve(undefined);
          tx.onabort = () => resolve(undefined);
        } catch {
          resolve(undefined);
        }
      })
  );
}

// ─── Staged images ───────────────────────────────────────────────────────────

/** Files held in memory (used when IndexedDB is unavailable, and as a fast cache). */
const memoryFiles = new Map<string, File>();
/** Preview links (blob URLs) for staged images, so the form can show them straight away. */
const previews = new Map<string, string>();

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function registerPreview(ref: string, blob: Blob) {
  const existing = previews.get(ref);
  if (existing) URL.revokeObjectURL(existing);
  previews.set(ref, URL.createObjectURL(blob));
}

/** What to put in an <img src>: the preview of a staged photo, or the link itself. */
export function resolveImageSrc(ref: string | undefined | null): string {
  if (!ref) return '';
  if (isLocalRef(ref)) return previews.get(ref) ?? '';
  return ref;
}

/** Keeps the photo in the browser and returns the reference to store in the form. Nothing is uploaded. */
export async function stageImage(scope: string, file: File): Promise<string> {
  const ref = `${LOCAL_PREFIX}${scope}:${newId()}`;
  memoryFiles.set(ref, file);
  registerPreview(ref, file);
  const record: StagedImageRecord = { ref, scope, blob: file, name: file.name, type: file.type };
  await run(IMAGES, 'readwrite', (s) => s.put(record));
  return ref;
}

/** The staged file, for uploading at save time. */
export async function getStagedFile(ref: string): Promise<File | undefined> {
  const cached = memoryFiles.get(ref);
  if (cached) return cached;
  const record = await run<StagedImageRecord>(IMAGES, 'readonly', (s) => s.get(ref));
  if (!record) return undefined;
  const file = new File([record.blob], record.name || 'photo', { type: record.type || record.blob.type });
  memoryFiles.set(ref, file);
  return file;
}

export async function deleteStagedImage(ref: string): Promise<void> {
  if (!isLocalRef(ref)) return;
  memoryFiles.delete(ref);
  const preview = previews.get(ref);
  if (preview) URL.revokeObjectURL(preview);
  previews.delete(ref);
  await run(IMAGES, 'readwrite', (s) => s.delete(ref));
}

/**
 * Brings previews back after a refresh. Returns the references whose file could not be found
 * (for example if the browser cleared its storage), so the form can ask for those photos again.
 */
export async function restorePreviews(refs: string[]): Promise<string[]> {
  const missing: string[] = [];
  for (const ref of Array.from(new Set(refs.filter(isLocalRef)))) {
    if (previews.has(ref)) continue;
    const file = await getStagedFile(ref);
    if (file) registerPreview(ref, file);
    else missing.push(ref);
  }
  return missing;
}

// ─── Drafts ──────────────────────────────────────────────────────────────────

export async function saveDraft(draft: ProductDraft): Promise<boolean> {
  const ok = await run(DRAFTS, 'readwrite', (s) => s.put(draft));
  return ok !== undefined;
}

export async function loadDraft(id: string): Promise<ProductDraft | undefined> {
  const draft = await run<ProductDraft>(DRAFTS, 'readonly', (s) => s.get(id));
  return draft && draft.version === DRAFT_VERSION ? draft : undefined;
}

/** A brand's drafts, newest first. */
export async function listDrafts(tenantKey: string): Promise<ProductDraft[]> {
  const all = (await run<ProductDraft[]>(DRAFTS, 'readonly', (s) => s.getAll())) ?? [];
  return all.filter((d) => d.tenantKey === tenantKey && d.version === DRAFT_VERSION).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Removes the draft and every staged photo that belongs to it. */
export async function deleteDraft(id: string): Promise<void> {
  const db = await openDb();
  for (const [ref] of Array.from(memoryFiles)) {
    if (ref.startsWith(`${LOCAL_PREFIX}${id}:`)) {
      memoryFiles.delete(ref);
      const preview = previews.get(ref);
      if (preview) URL.revokeObjectURL(preview);
      previews.delete(ref);
    }
  }
  await run(DRAFTS, 'readwrite', (s) => s.delete(id));
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IMAGES, 'readwrite');
      const index = tx.objectStore(IMAGES).index('scope');
      const cursorRequest = index.openKeyCursor(IDBKeyRange.only(id));
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          tx.objectStore(IMAGES).delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Drops drafts nobody touched for a while, so the browser's storage does not fill up. */
export async function pruneOldDrafts(maxAgeMs = 30 * 24 * 60 * 60 * 1000): Promise<void> {
  const all = (await run<ProductDraft[]>(DRAFTS, 'readonly', (s) => s.getAll())) ?? [];
  const cutoff = Date.now() - maxAgeMs;
  for (const draft of all) if (draft.updatedAt < cutoff) await deleteDraft(draft.id);
}

/** A short random id for a new draft. */
export const newDraftId = (): string => `d${newId().replace(/-/g, '').slice(0, 16)}`;
