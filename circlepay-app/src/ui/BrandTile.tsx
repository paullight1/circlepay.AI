import { StyleSheet, Text, View } from 'react-native';

import { avatarColor, colors, fonts, initials } from '@/theme/tokens';

interface Props {
  /** Drives the deterministic tile colour. */
  name: string;
  /** Text override — "MTN", "DTV". Falls back to the name's initials. */
  label?: string;
  size?: number;
}

/**
 * Rounded-square brand tile for billers, hotels and transport operators —
 * the square counterpart to `Avatar`, with a short label instead of initials.
 */
export function BrandTile({ name, label, size = 44 }: Props) {
  const text = label ?? initials(name);
  const scale = text.length >= 4 ? 0.24 : text.length === 3 ? 0.28 : 0.34;
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: avatarColor(name) },
      ]}>
      <Text style={[styles.label, { fontSize: size * scale }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bold, color: colors.onPrimary, letterSpacing: 0.3 },
});
