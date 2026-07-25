import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme/tokens';

interface Props {
  steps: Array<{ title: string; body?: string }>;
  /** Index of the current step (all before it are "done"); pass steps.length to complete all. */
  current?: number;
}

/** Vertical numbered steps ("How It Works" blocks). */
export function Stepper({ steps, current = -1 }: Props) {
  return (
    <View>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={s.title} style={styles.row}>
            <View style={styles.railCol}>
              <View style={[styles.dot, (done || active) && styles.dotActive]}>
                <Text style={[styles.dotText, (done || active) && { color: colors.onPrimary }]}>{i + 1}</Text>
              </View>
              {i < steps.length - 1 && <View style={[styles.rail, done && { backgroundColor: colors.primary }]} />}
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{s.title}</Text>
              {!!s.body && <Text style={styles.text}>{s.body}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  railCol: { alignItems: 'center', width: 28 },
  dot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { backgroundColor: colors.primary },
  dotText: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  rail: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 3, minHeight: 14 },
  body: { flex: 1, paddingBottom: spacing.lg },
  title: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  text: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 3, lineHeight: 17 },
});
