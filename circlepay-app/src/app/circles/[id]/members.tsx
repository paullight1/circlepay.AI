import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { formatNaira } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import { AmountText, Avatar, Card, EmptyState, Screen, ScreenHeader, StatusPill } from '@/ui';

const STATUS_LABEL = { paid: 'Paid', pending: 'Pending', late: 'Late' } as const;

/** 11 · Members Status. */
export default function MembersStatus() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const circle = useStore((s) => s.circles.find((c) => c.id === id));

  if (!circle) {
    return (
      <Screen>
        <ScreenHeader title="Members Status" />
        <EmptyState icon="people-outline" title="Circle not found" body="This circle may have been removed." />
      </Screen>
    );
  }

  const memberCount = circle.members.length;
  const pool = circle.amountPerMember * memberCount;
  const cycleWord = circle.frequency === 'daily' ? 'Day' : circle.frequency === 'weekly' ? 'Week' : 'Month';
  const ordered = [...circle.members].sort((a, b) => a.position - b.position);

  return (
    <Screen>
      <ScreenHeader
        title="Members Status"
        subtitle={`${cycleWord} ${circle.currentCycle} of ${memberCount} · ${formatNaira(pool)} pool this cycle`}
      />

      <View style={styles.list}>
        {ordered.map((m) => (
          <Card key={m.id} style={styles.row}>
            <View style={styles.posBadge}>
              <Text style={styles.posText}>{m.position}</Text>
            </View>
            <Avatar name={m.name} size={38} ring={m.position === circle.currentCycle} />
            <View style={styles.body}>
              <Text style={styles.name} numberOfLines={1}>
                {m.name}
                {m.isYou ? ' (You)' : ''}
              </Text>
              <Text style={styles.sub}>
                {m.position === circle.currentCycle ? 'Next receiver' : `Payout position #${m.position}`}
              </Text>
            </View>
            <View style={styles.right}>
              <AmountText amount={m.amount} size={13.5} />
              <StatusPill label={STATUS_LABEL[m.status]} small />
            </View>
          </Card>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {(
          [
            { label: 'Paid', color: colors.success },
            { label: 'Pending', color: colors.warning },
            { label: 'Late', color: colors.danger },
          ] as const
        ).map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={styles.legendText}>{l.label}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  posBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posText: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.primary },
  body: { flex: 1 },
  name: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  sub: { fontFamily: fonts.medium, fontSize: 11, color: colors.sub, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.sub },
});
