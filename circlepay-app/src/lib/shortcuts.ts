import type { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

import { colors } from '@/theme/tokens';

export interface Shortcut {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  /** Route to open. `Href` keeps a typo like `/auto-saving` a compile error. */
  href: Href;
}

/** The eighth grid slot is always "More", so users pick seven. */
export const MAX_QUICK_ACCESS = 7;

export const SHORTCUTS: Shortcut[] = [
  { id: 'savings', label: 'Savings', icon: 'wallet', tint: colors.success, bg: colors.successBg, href: '/(tabs)/savings' },
  { id: 'auto-savings', label: 'Automated Savings', icon: 'sync-circle', tint: colors.primary, bg: colors.chip, href: '/auto-savings' },
  { id: 'circles', label: 'Circles', icon: 'people', tint: colors.primary, bg: colors.chip, href: '/(tabs)/circles' },
  { id: 'support', label: 'Support Groups', icon: 'heart', tint: colors.danger, bg: colors.dangerBg, href: '/campaigns' },
  { id: 'bills', label: 'Pay Bills', icon: 'receipt', tint: colors.warning, bg: colors.warningBg, href: '/bills' },
  { id: 'airtime', label: 'Airtime', icon: 'phone-portrait', tint: colors.info, bg: colors.infoBg, href: '/bills/airtime' },
  { id: 'pos', label: 'POS', icon: 'storefront', tint: colors.success, bg: colors.successBg, href: '/agent' },
  { id: 'partpay', label: 'PartPay', icon: 'calendar', tint: colors.info, bg: colors.infoBg, href: '/partpay' },
  { id: 'agent', label: 'Agent Banking', icon: 'business', tint: colors.warning, bg: colors.warningBg, href: '/agent' },
  { id: 'trust', label: 'Trust Score', icon: 'shield-checkmark', tint: colors.primary, bg: colors.chip, href: '/trust/score' },
  { id: 'wallet', label: 'Wallet', icon: 'card', tint: colors.sub, bg: colors.cardAlt, href: '/wallet' },
];

export function shortcutById(id: string): Shortcut | undefined {
  return SHORTCUTS.find((s) => s.id === id);
}
