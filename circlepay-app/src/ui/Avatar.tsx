import { StyleSheet, Text, View } from 'react-native';

import { avatarColor, colors, fonts, initials } from '@/theme/tokens';

interface Props {
  name: string;
  size?: number;
  /** Ring highlight (e.g. next payout receiver). */
  ring?: boolean;
}

/** Initials avatar with a deterministic per-name color. */
export function Avatar({ name, size = 40, ring }: Props) {
  const bg = avatarColor(name);
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        styles.center,
        ring && styles.ring,
      ]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.onPrimary, fontFamily: fonts.bold },
  ring: { borderWidth: 2.5, borderColor: colors.success },
});
