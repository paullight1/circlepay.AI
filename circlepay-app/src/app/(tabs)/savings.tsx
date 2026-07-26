import { useIsFocused, useRouter } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCoachMark } from '@/lib/coachTour';
import { formatNaira } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, shadow, spacing } from '@/theme/tokens';
import { AmountText, Button, Card, CoachMark, EmptyState, ListRow, Screen, SectionHeader } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

export default function Savings() {
  const router = useRouter();
  const wallet = useStore((s) => s.wallet);
  const circles = useStore((s) => s.circles);
  const plans = useStore((s) => s.savingsPlans);

  const totalSaved = wallet.savings + wallet.onHold;
  const automatedToDate = plans.reduce((sum, p) => sum + p.totalSaved, 0);
  const active = plans.filter((p) => p.status === 'active').length;

  // Tour stop 3 — the "Automated Savings" row. ListRow is a Pressable and does
  // not forward a ref, so the wrapper below exists purely to be measured.
  const autoRef = useRef<View | null>(null);
  const focused = useIsFocused();
  const autoMark = useCoachMark('savings', focused);

  return (
    <Screen>
      <Text style={styles.heading}>Savings</Text>

      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Saved</Text>
        <AmountText amount={totalSaved} decimals={2} size={30} />
        <View style={styles.split}>
          <View style={styles.splitCol}>
            <Text style={styles.splitLabel}>In circles</Text>
            <Text style={styles.splitValue}>{formatNaira(wallet.onHold, 2)}</Text>
          </View>
          <View style={styles.splitCol}>
            <Text style={styles.splitLabel}>In savings</Text>
            <Text style={styles.splitValue}>{formatNaira(wallet.savings, 2)}</Text>
          </View>
        </View>
      </Card>

      {/* Lifetime figure, deliberately outside the card above: a circle-linked
          plan's contributions already sit inside "In circles". */}
      <Text style={styles.footnote}>
        Automated to date · {formatNaira(automatedToDate, 2)}
      </Text>

      <SectionHeader title="Where your money is" />
      {plans.length === 0 ? (
        <>
          {/* EmptyState takes only icon/title/body — the action is a sibling Button. */}
          <EmptyState
            icon="sync-circle-outline"
            title="No automated plans yet"
            body="Set one up and CirclePay will save for you on schedule."
          />
          <Button title="Create a plan" onPress={() => router.push('/auto-savings/create')} />
        </>
      ) : (
        <Card padded={false} style={styles.group}>
          <View ref={autoRef} collapsable={false}>
            <ListRow title="Automated Savings" subtitle={`${active} active plan${active === 1 ? '' : 's'}`} chevron
              left={<IconBubble name="sync-circle-outline" color={colors.success} bg={colors.successBg} />}
              onPress={() => router.push('/auto-savings')} />
          </View>
          <ListRow title="Circle Savings" subtitle={`${circles.length} circle${circles.length === 1 ? '' : 's'}`} chevron
            left={<IconBubble name="people-outline" />}
            onPress={() => router.push('/(tabs)/circles')} />
          <ListRow title="Savings History" subtitle="Every automated deduction" chevron
            left={<IconBubble name="time-outline" color={colors.info} bg={colors.infoBg} />}
            onPress={() => router.push('/auto-savings/history')} />
        </Card>
      )}

      <CoachMark
        visible={autoMark.visible}
        targetRef={autoRef}
        title={autoMark.title}
        body={autoMark.body}
        onDismiss={autoMark.onDismiss}
        onSkipAll={autoMark.onSkipAll}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.ink, marginBottom: spacing.lg },
  totalCard: { alignItems: 'flex-start', ...shadow.card },
  totalLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.sub, marginBottom: 4 },
  split: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg },
  splitCol: { flex: 1 },
  splitLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginBottom: 3 },
  splitValue: { fontFamily: fonts.mono, fontSize: 14, color: colors.ink },
  footnote: {
    fontFamily: fonts.medium, fontSize: 12, color: colors.faint,
    marginTop: spacing.sm, marginLeft: spacing.xs,
  },
  group: { paddingHorizontal: spacing.lg, paddingVertical: 4, borderRadius: radius.lg },
});
