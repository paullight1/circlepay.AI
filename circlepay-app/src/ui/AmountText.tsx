import { StyleSheet, Text, TextStyle } from 'react-native';

import { formatNaira } from '@/lib/format';
import { colors, fonts } from '@/theme/tokens';

interface Props {
  amount: number;
  decimals?: 0 | 2;
  size?: number;
  color?: string;
  /** Prefix with +/− and tint green/red. */
  signed?: 'in' | 'out';
  style?: TextStyle;
}

/** Naira amount in the mono numeric face used across the designs. */
export function AmountText({ amount, decimals = 0, size = 16, color, signed, style }: Props) {
  const tint = signed === 'in' ? colors.success : signed === 'out' ? colors.ink : color ?? colors.ink;
  const prefix = signed === 'in' ? '+' : signed === 'out' ? '-' : '';
  return (
    <Text style={[styles.text, { fontSize: size, color: tint }, style]}>
      {prefix}{formatNaira(amount, decimals)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.mono, letterSpacing: -0.3 },
});
