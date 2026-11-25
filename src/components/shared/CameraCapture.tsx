'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';

/**
 * Full-screen camera: shows the live view, takes one photo, and hands it back as a picture file.
 * Shows a clear message (and the caller's normal upload button stays available) when the camera is blocked or missing.
 */
export function CameraCapture({
  open,
  onClose,
  onCapture,
  accent = '#0F172A',
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  accent?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot open the camera. Please upload a photo instead.');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1600 } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          void v.play().then(() => setReady(true)).catch(() => setReady(true));
        }
      })
      .catch((err: DOMException) => {
        if (cancelled) return;
        setError(
          err?.name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow the camera in your browser, or upload a photo instead.'
            : err?.name === 'NotFoundError'
              ? 'No camera was found on this device. Please upload a photo instead.'
              : 'The camera could not start. Please upload a photo instead.',
        );
      });
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, facing, stop]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (facing === 'user') {
      // The preview is mirrored like a mirror; save the photo the right way round.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stop();
        onCapture(new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        onClose();
      },
      'image/jpeg',
      0.92,
    );
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Take a photo" className="fixed inset-0 z-[90] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <p className="text-sm font-bold">Take your photo</p>
        <button type="button" onClick={onClose} aria-label="Close camera" className="rounded-full p-2 hover:bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {error ? (
          <p className="max-w-sm px-6 text-center text-sm text-white/90">{error}</p>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-contain"
            style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
          />
        )}
      </div>
      <div className="flex items-center justify-center gap-8 px-4 py-5">
        {error ? (
          <button type="button" onClick={onClose} className="rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900">
            Close
          </button>
        ) : (
          <>
            <span className="w-11" />
            <button
              type="button"
              onClick={snap}
              disabled={!ready}
              aria-label="Take photo"
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white disabled:opacity-40"
              style={{ backgroundColor: accent }}
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
            <button
              type="button"
              onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
              aria-label="Switch camera"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      <p className="px-4 pb-4 text-center text-xs text-white/60">Stand back so your whole body fits, in good light.</p>
    </div>
  );
}
