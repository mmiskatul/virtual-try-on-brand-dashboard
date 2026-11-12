'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export function ToastNotification({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div className="fixed top-5 right-5 z-[120] flex items-center gap-3 bg-gray-100 text-gray-900 font-semibold px-5 py-3 rounded-xl shadow-2xl shadow-black/10 backdrop-blur-md animate-bounce">
      <CheckCircle2 className="w-5 h-5 text-gray-900" />
      <span>{message}</span>
    </div>
  );
}
