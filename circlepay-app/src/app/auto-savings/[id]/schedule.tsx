import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { formatDate, formatDateTime } from '@/lib/format';
import { upcomingRuns } from '@/lib/savings';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import { AmountText, Card, EmptyState, Screen, ScreenHeader, SectionHeader, StatusPill } from '@/ui';

export default function PlanSchedule() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = useStore((s) => s.savingsPlans.find((p) => p.id === id));

  if (!plan) {
    return (
      <Screen>
        <ScreenHeader title="Full Schedule" />
        <EmptyState icon="alert-circle-outline" title="Plan not found" body="It may have been cancelled." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Full Schedule" subtitle={plan.name} />

      <SectionHeader title="Upcoming" />
      <Card padded={false} style={styles.group}>
        {upcomingRuns(plan, 12).map((iso) => (
          <View key={iso} style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.date}>{formatDate(iso)}</Text>
              <Text style={styles.time}>08:00 AM</Text>
            </View>
            <AmountText amount={plan.amount} size={13} />
          </View>
        ))}
      </Card>

      <SectionHeader title="Past deductions" />
      {plan.runs.length === 0 ? (
        <EmptyState icon="time-outline" title="Nothing yet" body="Deductions will appear here once they run." />
      ) : (
        <Card padded={false} style={styles.group}>
          {plan.runs.map((run) => (
            <View key={run.id} style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.date}>{formatDateTime(run.date)}</Text>
                {!!run.reason && <Text style={styles.reason}>{run.reason}</Text>}
              </View>
              <View style={styles.right}>
                <AmountText amount={run.amount} size={13} />
                {/* Status is never carried by colour alone. */}
                <StatusPill small label={run.status === 'success' ? 'Success' : 'Failed'} />
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
  date: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  time: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  reason: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.danger, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
});
