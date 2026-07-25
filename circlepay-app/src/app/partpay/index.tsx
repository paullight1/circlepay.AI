import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { formatNaira } from '@/lib/format';
import { useStore } from '@/store/useStore';
import type { PartPayPlan, PayCategory } from '@/store/types';
import { colors, fonts, gradients, radius, spacing } from '@/theme/tokens';
import {
  AmountText, Button, Card, EmptyState, ProgressBar, Screen, ScreenHeader,
  SectionHeader, StatusPill, Stepper,
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

const HOW_IT_WORKS = [
  { title: 'Choose what you want to pay for', body: 'Rent, school fees, medical bills, products & more.' },
  { title: 'Select payment plan that suits you', body: 'Pick a duration and see your monthly installment.' },
  { title: 'Pay gradually or let CirclePay pay upfront', body: 'Two flexible models depending on your trust score.' },
  { title: 'We handle payments & track progress', body: 'Auto deductions, reminders and a live dashboard.' },
];

/** "Jun 24" */
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PlanCard({ plan, onPress }: { plan: PartPayPlan; onPress: () => void }) {
  const cat = CATEGORY_ICON[plan.category];
  const paidCount = plan.schedule.filter((i) => i.status === 'paid').length;
  const next = plan.schedule.find((i) => i.status !== 'paid');
  const pct = Math.round((plan.paidAmount / plan.totalAmount) * 100);
  return (
    <Card onPress={onPress} style={styles.planCard}>
      <View style={styles.planHead}>
        <IconBubble name={cat.icon} color={cat.color} bg={cat.bg} size={42} />
        <View style={styles.planTitles}>
          <Text style={styles.planTitle} numberOfLines={1}>{plan.title}</Text>
          {!!plan.detail && <Text style={styles.planDetail} numberOfLines={1}>{plan.detail}</Text>}
        </View>
        <StatusPill
          small
          label={plan.model === 'gradual' ? 'Pay Gradually' : 'CirclePay Upfront'}
          tone={plan.model === 'gradual' ? 'primary' : 'warning'}
        />
      </View>
      {!!next && (
        <Text style={styles.planNext}>
          Next: <Text style={styles.planNextStrong}>{shortDate(next.date)} · {formatNaira(next.amount)}</Text>
        </Text>
      )}
      <View style={styles.planProgressRow}>
        <View style={styles.planProgressBar}>
          <ProgressBar progress={plan.paidAmount / plan.totalAmount} color={colors.primary} height={8} />
        </View>
        <Text style={styles.planPct}>{pct}%</Text>
      </View>
      <Text style={styles.planRatio}>{paidCount} of {plan.schedule.length} payments made</Text>
    </Card>
  );
}

export default function PartPayHome() {
  const router = useRouter();
  const plans = useStore((s) => s.plans);
  const activePlans = plans.filter((p) => p.status === 'active');
  const monthlyCommitment = activePlans.reduce((sum, p) => sum + p.installmentAmount, 0);

  return (
    <Screen>
      <ScreenHeader title="PartPay" subtitle="Pay for services gradually" />

      <Button
        title="Start a New Payment"
        icon={<Ionicons name="add" size={18} color={colors.onPrimary} />}
        onPress={() => router.push('/partpay/choose')}
      />

      <LinearGradient colors={gradients.balance} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summary}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Active Plans</Text>
          <Text style={styles.summaryValue}>{activePlans.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Monthly Commitment</Text>
          <AmountText amount={monthlyCommitment} size={22} color={colors.onPrimary} />
        </View>
      </LinearGradient>

      <SectionHeader title="My Active Payments" />
      {activePlans.length === 0 ? (
        <Card>
          <EmptyState
            icon="calendar-outline"
            title="No active payment plans"
            body="Start a new payment to split any big bill into installments you can afford."
          />
        </Card>
      ) : (
        activePlans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onPress={() => router.push(`/partpay/${plan.id}`)} />
        ))
      )}

      <SectionHeader title="How It Works" />
      <Card>
        <Stepper steps={HOW_IT_WORKS} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.lg,
  },
  summaryCol: { flex: 1, gap: 6 },
  summaryDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: spacing.lg,
  },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.onPrimaryDim },
  summaryValue: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.onPrimary, letterSpacing: -0.5 },
  planCard: { marginBottom: spacing.md },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  planTitles: { flex: 1 },
  planTitle: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.ink },
  planDetail: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  planNext: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub, marginTop: spacing.md },
  planNextStrong: { fontFamily: fonts.bold, color: colors.ink },
  planProgressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  planProgressBar: { flex: 1 },
  planPct: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  planRatio: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.faint, marginTop: 6 },
});
