'use client';

import React from 'react';

/**
 * Optional styling a shopper can add to a try-on: "Tucked in", "Sleeves rolled", "Jacket open" ...
 * Each choice is one short phrase in the picture instruction. They cost nothing extra: they ride along in the same request.
 * The ids match the ones the backend understands; it ignores anything that does not suit the garment.
 */
export interface StyleChoice {
  id: string;
  label: string;
  /** Choices in the same group contradict each other (for example tucked in and untucked), so only one can be on. */
  group?: string;
}

const TUCKED: StyleChoice = { id: 'tucked_in', label: 'Tucked in', group: 'hem' };
const UNTUCKED: StyleChoice = { id: 'untucked', label: 'Untucked', group: 'hem' };
const SLEEVES: StyleChoice = { id: 'sleeves_rolled', label: 'Sleeves rolled' };
const BUTTON_OPEN: StyleChoice = { id: 'top_button_open', label: 'Top button open', group: 'buttons' };
const BUTTONED: StyleChoice = { id: 'buttoned_up', label: 'Buttoned up', group: 'buttons' };
const COLLAR: StyleChoice = { id: 'collar_up', label: 'Collar up' };
const HOOD_UP: StyleChoice = { id: 'hood_up', label: 'Hood up', group: 'hood' };
const HOOD_DOWN: StyleChoice = { id: 'hood_down', label: 'Hood down', group: 'hood' };
const BELTED: StyleChoice = { id: 'belted', label: 'Belted' };
const JACKET_OPEN: StyleChoice = { id: 'jacket_open', label: 'Jacket open', group: 'front' };
const JACKET_CLOSED: StyleChoice = { id: 'jacket_closed', label: 'Jacket closed', group: 'front' };
const CUFFED: StyleChoice = { id: 'cuffed_hem', label: 'Cuffed hems' };

const BY_CATEGORY: Record<string, StyleChoice[]> = {
  tops: [TUCKED, UNTUCKED, SLEEVES, BUTTON_OPEN, BUTTONED, COLLAR, HOOD_UP, HOOD_DOWN, BELTED],
  outerwear: [JACKET_OPEN, JACKET_CLOSED, SLEEVES, BUTTONED, COLLAR, HOOD_UP, HOOD_DOWN, BELTED],
  bottoms: [CUFFED, BELTED],
  dresses: [BELTED],
};

/** The choices that make sense for a kind of garment. Empty when there are none. */
export const styleChoicesFor = (category: string | undefined): StyleChoice[] => BY_CATEGORY[(category || '').toLowerCase()] || [];

export function StyleChips({
  category,
  value,
  onChange,
  className = '',
}: {
  category: string | undefined;
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  const choices = styleChoicesFor(category);
  if (choices.length === 0) return null;

  const toggle = (choice: StyleChoice) => {
    if (value.includes(choice.id)) {
      onChange(value.filter((id) => id !== choice.id));
      return;
    }
    // Turning one on turns off the one it contradicts.
    const rivals = choice.group ? choices.filter((c) => c.group === choice.group).map((c) => c.id) : [];
    onChange([...value.filter((id) => !rivals.includes(id)), choice.id]);
  };

  return (
    <div className={className}>
      <h3 className="text-sm font-bold">Styling (optional)</h3>
      <p className="mb-2 text-xs text-slate-500">Choose how you want to wear it.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Styling">
        {choices.map((choice) => {
          const on = value.includes(choice.id);
          return (
            <button
              key={choice.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(choice)}
              className={`rounded-xl border px-3.5 py-2.5 text-sm font-bold ${
                on ? 'border-slate-950 bg-slate-950 text-white' : 'border-stone-200 bg-white text-slate-800 hover:border-slate-400'
              }`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
