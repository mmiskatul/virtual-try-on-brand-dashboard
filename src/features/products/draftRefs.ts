import { isLocalRef } from '../../lib/draftStore';

/**
 * The photo fields of the Add Product form. While a product is unfinished they hold either a real link
 * (an already uploaded photo) or a local reference ("local:...") to a photo kept in the browser.
 */
export interface PhotoHolder {
  imageUrl: string;
  aiReferenceUrl: string;
  plan: { colors: Array<{ photo: string; aiPhoto: string }> };
}

/** Every photo that is still only in the browser, each listed once. */
export function collectLocalRefs(form: PhotoHolder): string[] {
  const all = [form.imageUrl, form.aiReferenceUrl, ...form.plan.colors.flatMap((c) => [c.photo, c.aiPhoto])];
  return Array.from(new Set(all.filter(isLocalRef)));
}

/** Swaps references for the values in `map` (a finished upload gives the link, a lost file gives an empty string). */
export function replaceRefs<T extends PhotoHolder>(form: T, map: Record<string, string>): T {
  const swap = (value: string) => (isLocalRef(value) && value in map ? map[value] : value);
  return {
    ...form,
    imageUrl: swap(form.imageUrl),
    aiReferenceUrl: swap(form.aiReferenceUrl),
    plan: {
      ...form.plan,
      colors: form.plan.colors.map((c) => ({ ...c, photo: swap(c.photo), aiPhoto: swap(c.aiPhoto) })),
    },
  };
}

/** Removes references whose files could not be recovered. */
export function stripRefs<T extends PhotoHolder>(form: T, refs: string[]): T {
  return replaceRefs(form, Object.fromEntries(refs.map((ref) => [ref, ''])));
}

/** How many references the form has that still need uploading. */
export const pendingUploads = (form: PhotoHolder): number => collectLocalRefs(form).length;

/**
 * Uploads every staged photo, a few at a time, and reports progress.
 * - `upload(ref)` uploads one photo and returns its link (it throws if it cannot).
 * - `onUploaded(ref, url)` is called right after each success, so the caller can keep the link
 *   (a retry after a failure then skips what is already uploaded).
 * Stops at the first failure and throws an error that says which photo failed.
 */
export async function uploadStagedPhotos<T extends PhotoHolder>(
  form: T,
  upload: (ref: string) => Promise<string>,
  options: { concurrency?: number; onProgress?: (done: number, total: number) => void; onUploaded?: (ref: string, url: string) => void } = {}
): Promise<T> {
  const refs = collectLocalRefs(form);
  const total = refs.length;
  if (total === 0) return form;
  const done: Record<string, string> = {};
  let finished = 0;
  let failure: Error | null = null;
  let next = 0;
  options.onProgress?.(0, total);

  const worker = async () => {
    while (!failure) {
      const index = next++;
      if (index >= refs.length) return;
      const ref = refs[index];
      try {
        const url = await upload(ref);
        done[ref] = url;
        finished += 1;
        options.onUploaded?.(ref, url);
        options.onProgress?.(finished, total);
      } catch (err) {
        failure = err instanceof Error ? err : new Error('A photo could not be uploaded.');
        return;
      }
    }
  };

  const workers = Array.from({ length: Math.min(options.concurrency ?? 3, total) }, () => worker());
  await Promise.all(workers);
  if (failure) throw failure;
  return replaceRefs(form, done);
}
