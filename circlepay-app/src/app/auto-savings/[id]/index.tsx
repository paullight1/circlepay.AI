import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { confirm } from '@/lib/dialogs';
import { formatDate, formatNaira } from '@/lib/format';
import { accountLabel, frequencyLabel, planTypeMeta } from '@/lib/savings';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import { Button, Card, EmptyState, Screen, ScreenHeader, StatusPill } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

export default function PlanSummary() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = useStore((s) => s.savingsPlans.find((p) => p.id === id));
  const account = useStore((s) => s.linkedAccounts.find((a) => a.id === plan?.accountId));
  const pausePlan = useStore((s) => s.pauseSavingsPlan);
  const resumePlan = useStore((s) => s.resumeSavingsPlan);
  const cancelPlan = useStore((s) => s.cancelSavingsPlan);

  if (!plan) {
    return (
      <Screen>
        <ScreenHeader title="Plan Summary" />
        <EmptyState icon="alert-circle-outline" title="Plan not found" body="It may have been cancelled." />
      </Screen>
    );
  }

  const paused = plan.status === 'paused';

  return (
    <Screen>
      <ScreenHeader title="Plan Summary" />

      <Card>
        <View style={styles.head}>
          <IconBubble name={`${planTypeMeta[plan.type].icon}-outline` as keyof typeof Ionicons.glyphMap} />
          <View style={styles.headBody}>
            <Text style={styles.name}>{plan.name}</Text>
            <Text style={styles.meta}>
              {formatNaira(plan.amount, 2)} · {frequencyLabel(plan.frequency)}
            </Text>
          </View>
          <StatusPill
            small
            label={plan.status === 'active' ? 'Active' : paused ? 'Paused' : 'Completed'}
          />
        </View>
      </Card>

      <Card padded={false} style={styles.group}>
        {[
          ['Status', plan.status === 'active' ? 'Active' : paused ? 'Paused' : 'Completed'],
          ['Frequency', frequencyLabel(plan.frequency)],
          ['Amount', formatNaira(plan.amount, 2)],
          ['Start Date', formatDate(plan.startDate)],
          ['End Date', plan.endDate ? formatDate(plan.endDate) : 'No end date'],
          ['Linked Account', account ? accountLabel(account) : '—'],
          ['Saved so far', formatNaira(plan.totalSaved, 2)],
        ].map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.nextCard}>
        <Text style={styles.rowLabel}>Next Deduction</Text>
        <Text style={styles.nextValue}>{formatDate(plan.nextRunAt)} · 08:00 AM</Text>
        <Pressable onPress={() => router.push(`/auto-savings/${plan.id}/schedule`)} hitSlop={8}>
          <Text style={styles.link}>View Full Schedule</Text>
        </Pressable>
      </Card>

      <View style={styles.actions}>
        <Button
          title={paused ? 'Resume Plan' : 'Pause Plan'}
          variant="secondary"
          onPress={() => (paused ? resumePlan(plan.id) : pausePlan(plan.id))}
          style={styles.actionBtn}
        />
        <Button
          title="Edit Plan"
          variant="secondary"
          onPress={() => router.push(`/auto-savings/create?type=${plan.type}`)}
          style={styles.actionBtn}
        />
      </View>

      {/* Alert.alert is a silent no-op on web, so destructive confirms go through `confirm`. */}
      <Pressable
        onPress={() =>
          confirm(
            'Cancel this plan?',
            `${plan.name} will stop deducting. Money already saved stays in your wallet.`,
            () => {
              cancelPlan(plan.id);
              router.replace('/auto-savings');
            },
            'Cancel plan',
            true
          )
        }
        hitSlop={8}
        style={styles.cancelWrap}>
        <Text style={styles.cancel}>Cancel plan</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headBody: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  group: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.lg,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub },
  rowValue: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink, flexShrink: 1, textAlign: 'right' },
  nextCard: { marginTop: spacing.lg },
  nextValue: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, marginTop: 3 },
  link: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.primary, marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  actionBtn: { flex: 1 },
  cancelWrap: { alignSelf: 'center', marginTop: spacing.xl },
  cancel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.danger },
});
