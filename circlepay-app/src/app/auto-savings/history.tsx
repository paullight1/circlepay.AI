import { StyleSheet, Text, View } from 'react-native';

import { formatDateTime } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import { AmountText, Card, EmptyState, Screen, ScreenHeader, StatusPill } from '@/ui';

export default function SavingsHistory() {
  const plans = useStore((s) => s.savingsPlans);

  const rows = plans
    .flatMap((p) => p.runs.map((r) => ({ ...r, planName: p.name })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Screen>
      <ScreenHeader title="Savings History" />
      {rows.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No deductions yet"
          body="Once your plans start running, every deduction shows up here."
        />
      ) : (
        <Card padded={false} style={styles.group}>
          {rows.map((r) => (
            <View key={r.id} style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.name}>{r.planName}</Text>
                <Text style={styles.date}>{formatDateTime(r.date)}</Text>
              </View>
              <View style={styles.right}>
                <AmountText amount={r.amount} size={13} />
                {/* Status is never carried by colour alone. */}
                <StatusPill small label={r.status === 'success' ? 'Success' : 'Failed'} />
              </View>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { paddingHorizontal: spacing.lg },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowBody: { flex: 1 },
  name: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  date: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
});
