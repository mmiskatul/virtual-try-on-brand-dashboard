'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, InputProps } from '../ui/input';

interface PasswordFieldProps extends Omit<InputProps, 'type'> {
  label: string;
  error?: string;
  showStrength?: boolean;
  watchedValue?: string;
  rightSlot?: React.ReactNode;
}

function getPasswordStrength(value: string): { score: number; label: string; color: string } {
  if (!value) return { score: 0, label: '', color: 'bg-slate-800' };
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Za-z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
  if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score: 3, label: 'Good', color: 'bg-sky-500' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, showStrength = false, watchedValue = '', rightSlot, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const strength = showStrength ? getPasswordStrength(watchedValue) : null;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-slate-300">{label}</label>
          {rightSlot}
        </div>
        <div className="relative">
          <Input
            ref={ref}
            type={visible ? 'text' : 'password'}
            className={`pr-10 ${error ? 'border-rose-500 focus-visible:border-rose-500' : ''} ${className || ''}`}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((prev) => !prev)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {showStrength && watchedValue.length > 0 && strength && (
          <div className="pt-1 space-y-1">
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1 rounded-full transition-colors ${
                    step <= strength.score ? strength.color : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Strength: <span className="text-slate-200 font-semibold">{strength.label}</span> — 8+ chars, at least 1 letter & 1 number
            </p>
          </div>
        )}

        {error && <p className="text-rose-400 text-[11px] font-medium">{error}</p>}
      </div>
    );
  }
);
PasswordField.displayName = 'PasswordField';

