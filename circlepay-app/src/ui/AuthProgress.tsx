import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme/tokens';

/** The four setup steps, in order. */
export const AUTH_STEPS = ['Phone', 'Verify', 'Identity', 'Secure'] as const;

export type AuthStep = (typeof AUTH_STEPS)[number];

interface Props {
  current: AuthStep;
  /** Render light-on-dark, for gradient screens. */
  light?: boolean;
}

/**
 * Segmented progress across account setup.
 *
 * Multi-step flows need to say how much is left, or people abandon them. The
 * step count is also announced to screen readers rather than being carried by
 * colour alone.
 */
export function AuthProgress({ current, light }: Props) {
  const index = AUTH_STEPS.indexOf(current);

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${index + 1} of ${AUTH_STEPS.length}: ${current}`}>
      <View style={styles.bars}>
        {AUTH_STEPS.map((step, i) => (
          <View
            key={step}
            style={[
              styles.bar,
              light ? styles.barLightIdle : styles.barIdle,
              i <= index && (light ? styles.barLightDone : styles.barDone),
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, light && styles.labelLight]}>
        Step {index + 1} of {AUTH_STEPS.length} · {current}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.xl },
  bars: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  barIdle: { backgroundColor: colors.border },
  barDone: { backgroundColor: colors.primary },
  barLightIdle: { backgroundColor: 'rgba(255,255,255,0.24)' },
  barLightDone: { backgroundColor: colors.onPrimary },
  label: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.faint },
  labelLight: { color: colors.onPrimaryDim },
});
