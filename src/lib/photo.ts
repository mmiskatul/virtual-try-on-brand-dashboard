/**
 * Turns a picked or captured picture into a smaller JPEG data URL.
 * Phone cameras make 5-12 MB pictures; the try-on only needs about 1280 px on the long side.
 * Shrinking here keeps the upload fast and lets shoppers send photos without signing in.
 */
export async function fileToJpegDataUrl(
  file: Blob,
  maxSide = 1280,
  quality = 0.88,
): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
  if (!file.type.startsWith('image/')) return { ok: false, error: 'Please choose a JPG, PNG or WebP picture.' };
  if (file.size > 15 * 1024 * 1024) return { ok: false, error: 'That picture is too large. Please use one under 15 MB.' };
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, error: 'This browser cannot prepare the picture.' };
    ctx.fillStyle = '#ffffff'; // flatten transparent PNGs onto white
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return { ok: true, dataUrl: canvas.toDataURL('image/jpeg', quality) };
  } catch {
    return { ok: false, error: 'That picture could not be opened. Please try another one.' };
  }
}
