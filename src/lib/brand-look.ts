/**
 * The brand's look, taken from what the brand chose under Settings > Onboarding
 * (Theme & Identity, Logos & Brand Media). The public try-on page and the Look & Feel preview
 * both use this, so they always match the storefront instead of having colours of their own.
 */
export interface BrandLook {
  primary: string;
  accent: string;
  background: string;
  text: string;
  /** Tailwind-free CSS radius for buttons, from the brand's button style. */
  buttonRadius: string;
  logo: string;
  banner: string;
}

type ThemeSource = {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonStyle?: 'pill' | 'rounded' | 'square';
};

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const color = (value: string | undefined, fallback: string) => (value && HEX.test(value) ? value : fallback);

export function buttonRadiusFor(style?: 'pill' | 'rounded' | 'square'): string {
  if (style === 'square') return '6px';
  if (style === 'rounded') return '12px';
  return '9999px';
}

export function resolveBrandLook(theme: ThemeSource | undefined, assets: { logo?: string; banner?: string }): BrandLook {
  const primary = color(theme?.primaryColor, '#0F172A');
  return {
    primary,
    accent: color(theme?.accentColor, primary),
    background: color(theme?.backgroundColor, '#FAF9F6'),
    text: color(theme?.textColor, '#0F172A'),
    buttonRadius: buttonRadiusFor(theme?.buttonStyle),
    logo: assets.logo || '',
    banner: assets.banner || '',
  };
}
