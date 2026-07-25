import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { notify } from '@/lib/dialogs';
import { daysUntil, formatDate, formatNaira } from '@/lib/format';
import type { Installment, PayCategory } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import {
  AmountText, Button, Card, EmptyState, ProgressBar, Screen, ScreenHeader, StatusPill,
} from '@/ui';
import { IconBubble } from '@/ui/ListRow';

const CATEGORY_ICON: Record<PayCategory, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  Rent: { icon: 'home-outline', color: colors.primary, bg: colors.chip },
  'School Fees': { icon: 'book-outline', color: colors.info, bg: colors.infoBg },
  'Medical Bills': { icon: 'medkit-outline', color: colors.danger, bg: colors.dangerBg },
  'Consumer Products': { icon: 'cube-outline', color: colors.warning, bg: colors.warningBg },
  'Business Services': { icon: 'briefcase-outline', color: colors.success, bg: colors.successBg },
  Other: { icon: 'ellipsis-horizontal', color: colors.sub, bg: colors.cardAlt },
};

function installmentLabel(index: number): string {
  return index === 0 ? 'Initial' : `Month ${index}`;
}

function ScheduleRow({ inst, index, isFirst }: { inst: Installment; index: number; isFirst: boolean }) {
  const paid = inst.status === 'paid';
  const upcoming = inst.status === 'upcoming';
  return (
    <View style={[styles.scheduleRow, !isFirst && styles.scheduleRowBorder]}>
      <Ionicons
        name={paid ? 'checkmark-circle' : 'time-outline'}
        size={18}
        color={paid ? colors.success : upcoming ? colors.warning : colors.faint}
      />
      <Text style={[styles.scheduleDate, inst.status === 'pending' && { color: colors.faint }]}>
        {formatDate(inst.date)} · {installmentLabel(index)}
      </Text>
      <AmountText amount={inst.amount} size={13.5} color={inst.status === 'pending' ? colors.faint : colors.ink} />
      <StatusPill
        small
        label={paid ? 'Paid' : upcoming ? 'Upcoming' : 'Pending'}
        tone={paid ? 'success' : upcoming ? 'warning' : 'neutral'}
      />
    </View>
  );
}

export default function PlanDashboard() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = useStore((s) => s.plans.find((p) => p.id === id));
  const payInstallment = useStore((s) => s.payInstallment);
  const linkedAccounts = useStore((s) => s.linkedAccounts);
  const account = linkedAccounts.find((a) => a.active) ?? linkedAccounts[0];

  if (!plan) {
    return (
      <Screen>
        <ScreenHeader title="Plan Dashboard" />
        <EmptyState icon="alert-circle-outline" title="Plan not found" body="This payment plan no longer exists." />
      </Screen>
    );
  }

  const cat = CATEGORY_ICON[plan.category];
  const pct = Math.round((plan.paidAmount / plan.totalAmount) * 100);
  const nextUnpaid = plan.schedule.find((i) => i.status !== 'paid');
  const paymentsLeft = plan.schedule.filter((i) => i.status !== 'paid').length;
  const completed = plan.status === 'completed';

  const handlePay = () => {
    if (!nextUnpaid) return;
    const ok = payInstallment(plan.id, nextUnpaid.id);
    if (ok) {
      notify(
        'Payment Successful',
        `${formatNaira(nextUnpaid.amount)} paid towards ${plan.title}. We have updated your schedule.`
      );
    } else {
      notify('Payment Failed', 'Insufficient wallet balance. Add money to your wallet and try again.');
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Plan Dashboard" />

      {completed && (
        <View style={styles.completedBanner}>
          <Ionicons name="trophy" size={20} color={colors.success} />
          <View style={styles.completedBody}>
            <Text style={styles.completedTitle}>Plan Completed!</Text>
            <Text style={styles.completedText}>
              You paid {formatNaira(plan.totalAmount)} over {plan.durationMonths} months. Well done!
            </Text>
          </View>
        </View>
      )}

      <Card>
        <View style={styles.planHead}>
          <IconBubble name={cat.icon} color={cat.color} bg={cat.bg} size={44} />
          <View style={styles.planTitles}>
            <Text style={styles.planTitle}>{plan.title}</Text>
            <Text style={styles.planDetail} numberOfLines={1}>
              {plan.detail ? `${plan.detail} · ` : ''}
              {plan.model === 'gradual' ? 'Pay Gradually' : 'CirclePay Upfront'}
            </Text>
          </View>
        </View>
        <View style={styles.totalsRow}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <AmountText amount={plan.totalAmount} size={16} />
          </View>
          <View style={styles.totalsRight}>
            <Text style={styles.totalLabel}>Paid</Text>
            <AmountText amount={plan.paidAmount} size={16} color={colors.success} />
          </View>
        </View>
        <ProgressBar progress={plan.paidAmount / plan.totalAmount} color={colors.primary} height={9} />
        <Text style={styles.progressCaption}>
          {formatNaira(plan.paidAmount)} of {formatNaira(plan.totalAmount)} ({pct}%)
          {paymentsLeft > 0 ? ` · ${paymentsLeft} payments left` : ''}
        </Text>
      </Card>

      {!completed && !!nextUnpaid && (
        <View style={styles.nextCard}>
          <View style={styles.nextTopRow}>
            <View style={styles.nextBody}>
              <Text style={styles.nextLabel}>Next Payment</Text>
              <Text style={styles.nextDate}>{formatDate(nextUnpaid.date)}</Text>
              <AmountText amount={nextUnpaid.amount} size={22} color={colors.onPrimary} />
            </View>
            <StatusPill small label={`${daysUntil(nextUnpaid.date)} days left`} tone="warning" />
          </View>
          <Button title="Make Early Payment" onPress={handlePay} style={styles.nextCta} />
        </View>
      )}

      <Card style={styles.scheduleCard}>
        <Text style={styles.sectionTitle}>Payment Schedule</Text>
        {plan.schedule.map((inst, i) => (
          <ScheduleRow key={inst.id} inst={inst} index={i} isFirst={i === 0} />
        ))}
      </Card>

      <Card style={styles.autoCard}>
        <Text style={styles.sectionTitle}>Auto Deduction</Text>
        <View style={styles.autoRow}>
          <IconBubble name="business-outline" color={colors.primary} bg={colors.chip} size={40} />
          <View style={styles.autoBody}>
            {account ? (
              <>
                <Text style={styles.autoBank}>{account.bank} ••••{account.last4}</Text>
                <Text style={styles.autoSub}>Deducted automatically on due dates</Text>
              </>
            ) : (
              <>
                <Text style={styles.autoBank}>No bank account linked</Text>
                <Text style={styles.autoSub}>Link an account to automate payments</Text>
              </>
            )}
          </View>
          {account?.active && <StatusPill small label="Active" tone="success" />}
          <Pressable onPress={() => router.push('/circles/link-bank')} hitSlop={8}>
            <Text style={styles.manageLink}>{account ? 'Manage' : 'Link'}</Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  completedBody: { flex: 1 },
  completedTitle: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.success },
  completedText: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink, marginTop: 2 },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  planTitles: { flex: 1 },
  planTitle: { fontFamily: fonts.extrabold, fontSize: 15.5, color: colors.ink },
  planDetail: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  totalsRight: { alignItems: 'flex-end' },
  totalLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginBottom: 3 },
  progressCaption: { fontFamily: fonts.semibold, fontSize: 12, color: colors.sub, marginTop: spacing.sm },
  nextCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  nextTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  nextBody: { flex: 1, gap: 3 },
  nextLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.onPrimaryDim },
  nextDate: { fontFamily: fonts.bold, fontSize: 15, color: colors.onPrimary },
  nextCta: { marginTop: spacing.lg },
  scheduleCard: { marginTop: spacing.md },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink, marginBottom: spacing.sm },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  scheduleRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  scheduleDate: { flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink },
  autoCard: { marginTop: spacing.md },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  autoBody: { flex: 1 },
  autoBank: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  autoSub: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  manageLink: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
});
