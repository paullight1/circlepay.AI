import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { daysFromNow, formatDate, formatNaira } from '@/lib/format';
import type { PartPayPlan, PayCategory, PayModel } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/tokens';
import { AmountText, Button, Card, Screen, ScreenHeader } from '@/ui';

const PREVIEW_ROWS = 4;
const SERVICE_FEE_PCT = 3;

function SuccessView({ plan, onDashboard }: { plan: PartPayPlan; onDashboard: () => void }) {
  const scale = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  }, [scale]);
  const first = plan.schedule[0];
  return (
    <View style={styles.successWrap}>
      <Animated.View style={[styles.halo, { transform: [{ scale }] }]}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={34} color={colors.onPrimary} />
        </View>
      </Animated.View>
      <Text style={styles.successTitle}>Payment Successful</Text>
      <Text style={styles.successBody}>Your payment plan has been created!</Text>
      {!!first && (
        <Card style={styles.nextCard}>
          <Text style={styles.nextLabel}>Next Payment</Text>
          <Text style={styles.nextDate}>{formatDate(first.date)}</Text>
          <AmountText amount={first.amount} size={24} color={colors.primary} />
        </Card>
      )}
      <Text style={styles.remind}>We will remind you before each due date.</Text>
      <Button title="Go to Dashboard" onPress={onDashboard} style={styles.successCta} />
    </View>
  );
}

export default function ReviewPlan() {
  const router = useRouter();
  const createPlan = useStore((s) => s.createPlan);
  const params = useLocalSearchParams<{
    category?: string; model?: string; title?: string; detail?: string; total?: string; duration?: string;
  }>();

  const category = (params.category ?? 'Other') as PayCategory;
  const model: PayModel = params.model === 'upfront' ? 'upfront' : 'gradual';
  const title = params.title ?? 'Payment Plan';
  const detail = params.detail || undefined;
  const total = Number(params.total) || 0;
  const duration = Number(params.duration) || 12;
  const monthly = Math.ceil(total / duration);
  const serviceFee = Math.round(total * (SERVICE_FEE_PCT / 100));

  const [created, setCreated] = useState<PartPayPlan | null>(null);

  if (created) {
    return (
      <Screen scroll={false}>
        <SuccessView plan={created} onDashboard={() => router.replace(`/partpay/${created.id}`)} />
      </Screen>
    );
  }

  const previewCount = Math.min(PREVIEW_ROWS, duration);

  return (
    <Screen>
      <ScreenHeader title="Repayment Plan" subtitle="Review before you confirm" />

      <LinearGradient colors={gradients.payout} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summary}>
        <Text style={styles.summaryLabel}>Total Amount</Text>
        <AmountText amount={total} size={30} color={colors.onPrimary} />
        <View style={styles.summaryMeta}>
          <View style={styles.summaryMetaCol}>
            <Text style={styles.summaryMetaLabel}>Payment model</Text>
            <Text style={styles.summaryMetaValue}>
              {model === 'gradual' ? 'Pay Gradually' : 'CirclePay Upfront'}
            </Text>
          </View>
          <View style={styles.summaryMetaCol}>
            <Text style={styles.summaryMetaLabel}>Duration</Text>
            <Text style={styles.summaryMetaValue}>{duration} months</Text>
          </View>
          <View style={styles.summaryMetaCol}>
            <Text style={styles.summaryMetaLabel}>Monthly</Text>
            <Text style={styles.summaryMetaValue}>{formatNaira(monthly)}</Text>
          </View>
        </View>
      </LinearGradient>

      <Card style={styles.planCard}>
        <Text style={styles.planTitle}>{title}</Text>
        {!!detail && <Text style={styles.planDetail}>{detail}</Text>}
        <Text style={styles.planCategory}>{category}</Text>
        {model === 'upfront' && (
          <Text style={styles.feeNote}>
            Includes CirclePay service fee ({SERVICE_FEE_PCT}%): {formatNaira(serviceFee)}
          </Text>
        )}
      </Card>

      <Card style={styles.scheduleCard}>
        <Text style={styles.scheduleTitle}>Payment schedule</Text>
        {Array.from({ length: previewCount }, (_, i) => (
          <View key={i} style={[styles.scheduleRow, i > 0 && styles.scheduleRowBorder]}>
            <View style={styles.scheduleDot}>
              <Text style={styles.scheduleDotText}>{i + 1}</Text>
            </View>
            <View style={styles.scheduleBody}>
              <Text style={styles.scheduleLabel}>{i === 0 ? 'Initial payment' : `Month ${i + 1}`}</Text>
              <Text style={styles.scheduleDate}>{formatDate(daysFromNow(30 * (i + 1), 9, 0))}</Text>
            </View>
            <AmountText amount={monthly} size={14} />
          </View>
        ))}
        {duration > previewCount && (
          <Text style={styles.moreRows}>…and {duration - previewCount} more payments</Text>
        )}
      </Card>

      <Button
        title="Confirm & Proceed"
        style={styles.cta}
        onPress={() => {
          const plan = createPlan({ title, detail, category, model, totalAmount: total, durationMonths: duration });
          setCreated(plan);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: radius.xl, padding: spacing.xl, gap: 6 },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.onPrimaryDim },
  summaryMeta: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  summaryMetaCol: { flex: 1, gap: 3 },
  summaryMetaLabel: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.onPrimaryDim },
  summaryMetaValue: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.onPrimary },
  planCard: { marginTop: spacing.md },
  planTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  planDetail: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub, marginTop: 3 },
  planCategory: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary, marginTop: 6 },
  feeNote: { fontFamily: fonts.medium, fontSize: 12, color: colors.warning, marginTop: 6 },
  scheduleCard: { marginTop: spacing.md },
  scheduleTitle: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink, marginBottom: spacing.sm },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  scheduleRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  scheduleDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center',
  },
  scheduleDotText: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  scheduleBody: { flex: 1 },
  scheduleLabel: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  scheduleDate: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  moreRows: { fontFamily: fonts.medium, fontSize: 12, color: colors.faint, paddingTop: spacing.sm },
  cta: { marginTop: spacing.xl },

  // Success state
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  halo: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  checkCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.ink },
  successBody: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.sub, marginTop: 6 },
  nextCard: { alignSelf: 'stretch', alignItems: 'center', gap: 4, marginTop: spacing.xl },
  nextLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub },
  nextDate: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.ink },
  remind: { fontFamily: fonts.medium, fontSize: 12, color: colors.faint, marginTop: spacing.lg, textAlign: 'center' },
  successCta: { alignSelf: 'stretch', marginTop: spacing.xl },
});
