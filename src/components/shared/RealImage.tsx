'use client';

import React, { useState } from 'react';

/**
 * Shows a real try-on picture (the shopper's photo or the generated result).
 *
 * Unlike the catalogue image component it never swaps in a stock photo when loading fails: a made-up picture would look
 * like a result. It works with any image address (Cloudinary, the backend, a data URL), and it keeps the picture's own
 * proportions, so nothing is cropped to a fixed shape.
 */
export function RealImage({
  src,
  alt,
  className = '',
  onSize,
}: {
  src: string;
  alt: string;
  className?: string;
  /** Called once the picture has loaded, with its natural size. */
  onSize?: (width: number, height: number) => void;
}) {
  // Remember which address failed, so a new picture (a new src) starts fresh without any effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  if (failedSrc === src) {
    return (
      <div className="flex min-h-[12rem] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-stone-100 p-6 text-center">
        <p className="text-xs font-semibold text-stone-700">This picture could not be loaded.</p>
        <button
          type="button"
          onClick={() => {
            setFailedSrc(null);
            setAttempt((n) => n + 1);
          }}
          className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-bold text-stone-800 hover:bg-stone-50"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    // A plain <img> on purpose: the picture can come from any host, and we must not fall back to a stock photo.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={attempt}
      src={src}
      alt={alt}
      className={className}
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={(e) => onSize?.(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
      onError={() => setFailedSrc(src)}
    />
  );
}
