import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import {
  AmountText, Button, Card, EmptyState, Screen, ScreenHeader, Stepper,
} from '@/ui';

const HOW_IT_WORKS = [
  { title: 'Show the code', body: 'Give this six-digit code to any CirclePay agent or kiosk.' },
  { title: 'Agent confirms the bill', body: 'Their terminal shows the biller, the account and the amount.' },
  { title: 'Your wallet is charged', body: 'Nothing leaves your wallet until the agent confirms.' },
  { title: 'Receipt arrives instantly', body: 'Tokens and PINs land on your receipt in the app.' },
];

/** 272000 ms → "04:32" */
function mmss(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function BillAgentCode() {
  const router = useRouter();
  const request = useStore((s) => s.billAgentRequest);
  const bill = useStore((s) => s.bills.find((b) => b.id === s.billAgentRequest?.paymentId));
  const completeAgentBillPayment = useStore((s) => s.completeAgentBillPayment);
  const cancelAgentBillPayment = useStore((s) => s.cancelAgentBillPayment);

  const [now, setNow] = useState(() => Date.now());
  const live = request?.status === 'pending';

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live]);

  if (!request || !bill) {
    return (
      <Screen>
        <ScreenHeader title="Pay at an Agent" />
        <EmptyState
          icon="storefront-outline"
          title="No agent request"
          body="Start a bill payment and choose “Pay at an Agent” to generate a code."
        />
        <Button title="Back to Bills" onPress={() => router.replace('/bills')} />
      </Screen>
    );
  }

  const remainingMs = new Date(request.expiresAt).getTime() - now;
  const expired = remainingMs <= 0;
  const total = bill.amount + bill.fee;
  const spacedCode = `${request.code.slice(0, 3)} ${request.code.slice(3)}`;

  const onConfirm = () => {
    const paymentId = request.paymentId;
    completeAgentBillPayment();
    router.replace({ pathname: '/bills/receipt', params: { id: paymentId } });
  };

  const onCancel = () => {
    cancelAgentBillPayment();
    router.replace('/bills');
  };

  return (
    <Screen>
      <ScreenHeader title="Pay at an Agent" subtitle="Show this code to any CirclePay agent" />

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>BILL PAYMENT CODE</Text>
        <Text style={[styles.codeValue, expired && styles.codeExpired]}>{spacedCode}</Text>
        <View style={styles.expiryChip}>
          <Ionicons name={expired ? 'alert-circle' : 'time'} size={14} color={colors.danger} />
          <Text style={styles.expiryText}>
            {expired ? 'Code expired' : `Expires in ${mmss(remainingMs)}`}
          </Text>
        </View>
      </View>

      <Card style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Biller</Text>
          <Text style={styles.summaryValue}>{bill.billerName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{bill.categoryLabel}</Text>
          <Text style={[styles.summaryValue, styles.summaryMono]}>{bill.customerRef}</Text>
        </View>
        {!!bill.planLabel && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan</Text>
            <Text style={styles.summaryValue}>{bill.planLabel}</Text>
          </View>
        )}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Amount</Text>
          <AmountText amount={bill.amount} decimals={2} size={14} />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Convenience fee</Text>
          <AmountText amount={bill.fee} decimals={2} size={14} />
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>Charged to your wallet</Text>
          <AmountText amount={total} decimals={2} size={16} color={colors.primary} />
        </View>
      </Card>

      <View style={styles.warning}>
        <Ionicons name="alert-circle" size={19} color={colors.danger} />
        <Text style={styles.warningText}>
          Never share this code with anyone except the agent completing your payment.
        </Text>
      </View>

      <Card style={styles.howCard}>
        <Text style={styles.howTitle}>How It Works</Text>
        <Stepper steps={HOW_IT_WORKS} />
      </Card>

      <View style={styles.actions}>
        {!expired && (
          <>
            <Button
              title="Find Nearby Agents"
              variant="ghost"
              icon={<Ionicons name="location" size={17} color={colors.primary} />}
              onPress={() => router.push('/agent/find')}
            />
            <Button
              title="Simulate Agent Confirmation"
              variant="success"
              icon={<Ionicons name="checkmark-circle" size={18} color={colors.onPrimary} />}
              onPress={onConfirm}
            />
          </>
        )}
        <Pressable onPress={onCancel} hitSlop={8} style={styles.cancelLink}>
          <Text style={styles.cancelText}>{expired ? 'Start Over' : 'Cancel Request'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  codeCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  codeLabel: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.onPrimaryDim, letterSpacing: 1.4 },
  codeValue: {
    fontFamily: fonts.mono, fontSize: 42, color: colors.onPrimary,
    letterSpacing: 8, marginTop: spacing.md,
  },
  codeExpired: { color: colors.faint, textDecorationLine: 'line-through' },
  expiryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.lg,
  },
  expiryText: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.danger },

  summary: { marginBottom: spacing.lg },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: spacing.lg, paddingVertical: 5,
  },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub },
  summaryValue: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, textAlign: 'right' },
  summaryMono: { fontFamily: fonts.mono, fontSize: 12.5 },
  summaryTotalLabel: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  warningText: { flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.danger, lineHeight: 18 },

  howCard: { marginBottom: spacing.xl },
  howTitle: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.ink, marginBottom: spacing.md },

  actions: { gap: spacing.md },
  cancelLink: { alignSelf: 'center', paddingVertical: spacing.sm },
  cancelText: { fontFamily: fonts.bold, fontSize: 14, color: colors.danger },
});
