/**
 * The page designs a brand can choose for its public try-on page.
 * Each design is a pair of the two layout fields the backend already saves
 * (previewLayout + gridStyle), so choosing one needs no new server field.
 */
export type TryOnPreviewLayout = 'split' | 'centered';
export type TryOnGridStyle = '3-col' | '4-col' | 'editorial';
export type TryOnLayoutId = 'classic' | 'grid' | 'showcase' | 'editorial';

export interface TryOnLayoutOption {
  id: TryOnLayoutId;
  label: string;
  description: string;
  previewLayout: TryOnPreviewLayout;
  gridStyle: TryOnGridStyle;
}

export const TRY_ON_LAYOUTS: TryOnLayoutOption[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Photo, result and a garment list side by side.',
    previewLayout: 'split',
    gridStyle: '4-col',
  },
  {
    id: 'grid',
    label: 'Grid',
    description: 'Three columns with garments as a photo grid.',
    previewLayout: 'split',
    gridStyle: '3-col',
  },
  {
    id: 'showcase',
    label: 'Showcase',
    description: 'Photo and result on top, a wide garment shelf below.',
    previewLayout: 'centered',
    gridStyle: '4-col',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'Photo and result on top, large fashion-style garment cards.',
    previewLayout: 'centered',
    gridStyle: 'editorial',
  },
];

export function layoutIdFor(previewLayout?: string, gridStyle?: string): TryOnLayoutId {
  if (previewLayout === 'centered') return gridStyle === 'editorial' ? 'editorial' : 'showcase';
  return gridStyle === '3-col' ? 'grid' : 'classic';
}
