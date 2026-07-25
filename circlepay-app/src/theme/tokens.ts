/**
 * CirclePay AI design tokens — extracted from "CirclePay AI Screens.dc.html".
 * Single source of truth for colors, spacing, radii and type.
 */
export const colors = {
  // Brand
  primary: '#4B27D4',
  primaryDark: '#33179B',
  primaryDeep: '#231060',
  accent: '#7C4DFF',
  lavender: '#B69BFF',
  chip: '#E7E0FB',
  chipText: '#4B27D4',

  // Surfaces
  bg: '#F4F4FA',
  card: '#FFFFFF',
  cardAlt: '#F7F6FC',
  border: '#E7E7F0',
  borderStrong: '#D5D6E4',

  // Ink
  ink: '#1A1B2E',
  sub: '#5E5F70',
  faint: '#9899AB',
  onPrimary: '#FFFFFF',
  onPrimaryDim: 'rgba(255,255,255,0.72)',

  // Status
  success: '#1BA87A',
  successBg: '#E4F5EF',
  warning: '#E0930F',
  warningBg: '#FBF1DC',
  danger: '#E23D6B',
  dangerBg: '#FCE7ED',
  info: '#2E7CF6',
  infoBg: '#E7F0FE',
} as const;

export const gradients = {
  balance: ['#3A1DA8', '#4B27D4', '#6B3BEF'] as const,
  payout: ['#231060', '#4B27D4'] as const,
  brandRing: ['#4B27D4', '#7C4DFF', '#B69BFF'] as const,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
  mono: 'JetBrainsMono_600SemiBold',
} as const;

// RN 0.86 deprecates shadow* props in favor of CSS-style boxShadow
// (supported cross-platform on the new architecture).
export const shadow = {
  card: { boxShadow: '0 6px 14px rgba(24, 27, 74, 0.06)' },
  raised: { boxShadow: '0 10px 22px rgba(24, 27, 74, 0.14)' },
} as const;

/** Deterministic avatar palette used across member/supporter rows. */
export const avatarPalette = [
  '#4B27D4', '#1BA87A', '#E0930F', '#E23D6B', '#2E7CF6',
  '#8E44AD', '#16A085', '#D35400', '#C0392B', '#2C3E50',
] as const;

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return avatarPalette[h % avatarPalette.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
