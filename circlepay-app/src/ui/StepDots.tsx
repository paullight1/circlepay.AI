import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

interface Props {
  count: number;
  /** 0-based index of the step being shown. */
  current: number;
}

/** Horizontal numbered progress rail for multi-step wizards. */
export function StepDots({ count, current }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={i} style={styles.segment}>
            <View style={[styles.dot, (done || active) && styles.dotOn]}>
              {done ? (
                <Ionicons name="checkmark" size={13} color={colors.onPrimary} />
              ) : (
                <Text style={[styles.dotText, active && styles.dotTextOn]}>{i + 1}</Text>
              )}
            </View>
            {i < count - 1 && <View style={[styles.rail, done && styles.railOn]} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotText: { fontFamily: fonts.bold, fontSize: 12, color: colors.faint },
  dotTextOn: { color: colors.onPrimary },
  rail: { width: 34, height: 2, backgroundColor: colors.border },
  railOn: { backgroundColor: colors.primary },
});
