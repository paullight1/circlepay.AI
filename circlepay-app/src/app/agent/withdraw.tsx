import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatNaira } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { AmountText, Button, Card, Chip, Field, Screen, ScreenHeader, Stepper } from '@/ui';

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

const HOW_IT_WORKS = [
  { title: 'Request Withdrawal', body: 'Enter an amount and generate a one-time withdrawal code.' },
  { title: 'Visit Agent or Kiosk', body: 'Go to any CirclePay agent within 5 minutes of generating the code.' },
  { title: 'Agent Verifies & Processes', body: 'Show your code — the agent confirms it on their terminal.' },
  { title: 'Receive Cash', body: 'Collect your cash. Your wallet is debited only after confirmation.' },
];

function feeFor(amount: number): number {
  return amount > 0 ? Math.max(100, Math.round(amount * 0.01)) : 0;
}

/** 272000 ms → "04:32" */
function mmss(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function WithdrawAtKioskScreen() {
  const router = useRouter();
  const withdrawal = useStore((s) => s.withdrawal);
  const available = useStore((s) => s.wallet.available);
  const requestKioskWithdrawal = useStore((s) => s.requestKioskWithdrawal);
  const completeKioskWithdrawal = useStore((s) => s.completeKioskWithdrawal);
  const cancelKioskWithdrawal = useStore((s) => s.cancelKioskWithdrawal);

  const [amountStr, setAmountStr] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [now, setNow] = useState(Date.now());

  const pending = withdrawal?.status === 'pending';
  const completed = withdrawal?.status === 'completed';
  const remainingMs = pending ? new Date(withdrawal.expiresAt).getTime() - now : 0;
  const expired = pending && remainingMs <= 0;

  // Tick the countdown once a second while a code is live.
  useEffect(() => {
    if (!pending) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [pending]);

  // On unmount, discard the request ONLY if it has expired — a still-valid
  // pending code survives navigation so returning shows it again.
  useEffect(
    () => () => {
      const w = useStore.getState().withdrawal;
      if (w?.status === 'pending' && new Date(w.expiresAt).getTime() <= Date.now()) {
        useStore.getState().cancelKioskWithdrawal();
      }
    },
    []
  );

  const amount = Number(amountStr.replace(/\D/g, '')) || 0;
  const fee = feeFor(amount);

  const onAmountChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 9);
    setAmountStr(digits ? Number(digits).toLocaleString('en-US') : '');
    if (error) setError(undefined);
  };

  const onGenerate = (value: number) => {
    if (value <= 0) {
      setError('Enter an amount to withdraw.');
      return;
    }
    const req = requestKioskWithdrawal(value);
    if (!req) {
      setError(
        `Insufficient balance. ${formatNaira(value + feeFor(value))} needed (incl. fee), ` +
        `${formatNaira(available, 2)} available.`
      );
      return;
    }
    setNow(Date.now());
    setError(undefined);
  };

  const onRegenerate = () => {
    if (!withdrawal) return;
    const value = withdrawal.amount;
    cancelKioskWithdrawal();
    setAmountStr(value.toLocaleString('en-US')); // keeps phase 1 prefilled if re-request fails
    onGenerate(value);
  };

  const onDone = () => {
    cancelKioskWithdrawal();
    router.back();
  };

  // ── Success: cash collected ──
  if (completed && withdrawal) {
    return (
      <Screen>
        <ScreenHeader title="Withdraw at Kiosk" />
        <View style={styles.successWrap}>
          <View style={styles.successHalo}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={38} color={colors.onPrimary} />
            </View>
          </View>
          <Text style={styles.successTitle}>Cash Collected!</Text>
          <AmountText amount={withdrawal.amount} size={36} color={colors.success} style={styles.successAmount} />
          <Text style={styles.successBody}>
            handed to you by the agent · fee {formatNaira(withdrawal.fee)}
          </Text>
          <View style={styles.balanceChip}>
            <Text style={styles.balanceChipLabel}>New wallet balance</Text>
            <AmountText amount={available} decimals={2} size={16} color={colors.primary} />
          </View>
          <Button title="Done" onPress={onDone} style={styles.doneBtn} />
        </View>
      </Screen>
    );
  }

  // ── Phase 2: live withdrawal code ──
  if (pending && withdrawal) {
    const spacedCode = `${withdrawal.code.slice(0, 3)} ${withdrawal.code.slice(3)}`;
    return (
      <Screen>
        <ScreenHeader
          title="Withdraw at Kiosk"
          subtitle="Show this one-time code to any CirclePay agent"
        />

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>WITHDRAWAL CODE</Text>
          <Text style={[styles.codeValue, expired && styles.codeValueExpired]}>{spacedCode}</Text>
          {expired ? (
            <View style={[styles.expiryChip, styles.expiredChip]}>
              <Ionicons name="alert-circle" size={14} color={colors.danger} />
              <Text style={styles.expiryText}>Code expired</Text>
            </View>
          ) : (
            <View style={styles.expiryChip}>
              <Ionicons name="time" size={14} color={colors.danger} />
              <Text style={styles.expiryText}>Expires in {mmss(remainingMs)}</Text>
            </View>
          )}
        </View>

        <Card style={styles.feeCard}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Amount</Text>
            <AmountText amount={withdrawal.amount} decimals={2} size={14} />
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Transaction Fee</Text>
            <AmountText amount={withdrawal.fee} decimals={2} size={14} />
          </View>
          <View style={styles.feeDivider} />
          <View style={styles.feeRow}>
            <Text style={styles.feeTotalLabel}>Total Deduction</Text>
            <AmountText amount={withdrawal.amount + withdrawal.fee} decimals={2} size={16} color={colors.primary} />
          </View>
        </Card>

        <View style={styles.warning}>
          <Ionicons name="alert-circle" size={19} color={colors.danger} />
          <Text style={styles.warningText}>
            Never share this code with anyone except the agent at the point of withdrawal.
          </Text>
        </View>

        <View style={styles.actions}>
          {expired ? (
            <Button title="Generate New Code" onPress={onRegenerate} />
          ) : (
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
                onPress={completeKioskWithdrawal}
              />
            </>
          )}
          <Pressable onPress={cancelKioskWithdrawal} hitSlop={8} style={styles.cancelLink}>
            <Text style={styles.cancelText}>Cancel Request</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // ── Phase 1: request a withdrawal ──
  return (
    <Screen>
      <ScreenHeader
        title="Withdraw at Kiosk"
        subtitle="Get cash from any CirclePay agent — no card needed"
      />

      <Field
        label="Amount to withdraw"
        placeholder="0"
        value={amountStr}
        onChangeText={onAmountChange}
        keyboardType="number-pad"
        error={error}
        left={<Text style={styles.nairaPrefix}>₦</Text>}
        style={styles.amountInput}
      />

      <View style={styles.quickRow}>
        {QUICK_AMOUNTS.map((q) => (
          <Chip
            key={q}
            label={`₦${q.toLocaleString('en-US')}`}
            selected={amount === q}
            onPress={() => {
              setAmountStr(q.toLocaleString('en-US'));
              setError(undefined);
            }}
            style={styles.quickChip}
          />
        ))}
      </View>

      <Card style={styles.feeCard}>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Amount</Text>
          <AmountText amount={amount} decimals={2} size={14} />
        </View>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Transaction Fee (1%, min ₦100)</Text>
          <AmountText amount={fee} decimals={2} size={14} />
        </View>
        <View style={styles.feeDivider} />
        <View style={styles.feeRow}>
          <Text style={styles.feeTotalLabel}>Total Deduction</Text>
          <AmountText amount={amount + fee} decimals={2} size={16} color={colors.primary} />
        </View>
      </Card>

      <Card style={styles.howCard}>
        <Text style={styles.howTitle}>How It Works</Text>
        <Stepper steps={HOW_IT_WORKS} />
      </Card>

      <Button
        title="Generate Withdrawal Code"
        onPress={() => onGenerate(amount)}
        disabled={amount <= 0}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  nairaPrefix: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  amountInput: { fontFamily: fonts.mono, fontSize: 18 },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickChip: { flex: 1, paddingHorizontal: 0, justifyContent: 'center' },

  feeCard: { marginBottom: spacing.lg },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  feeLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub },
  feeTotalLabel: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
  feeDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

  howCard: { marginBottom: spacing.xl },
  howTitle: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.ink, marginBottom: spacing.md },

  codeCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  codeLabel: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.onPrimaryDim, letterSpacing: 1.4 },
  codeValue: {
    fontFamily: fonts.mono,
    fontSize: 42,
    color: colors.onPrimary,
    letterSpacing: 8,
    marginTop: spacing.md,
  },
  codeValueExpired: { color: colors.faint, textDecorationLine: 'line-through' },
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
  expiredChip: { backgroundColor: colors.dangerBg },
  expiryText: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.danger },

  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  warningText: { flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.danger, lineHeight: 18 },

  actions: { gap: spacing.md },
  cancelLink: { alignSelf: 'center', paddingVertical: spacing.sm },
  cancelText: { fontFamily: fonts.bold, fontSize: 14, color: colors.danger },

  successWrap: { alignItems: 'center', paddingTop: spacing.xxl * 2 },
  successHalo: {
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: colors.successBg,
    alignItems: 'center', justifyContent: 'center',
  },
  successCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.ink, marginTop: spacing.xl },
  successAmount: { marginTop: spacing.md, letterSpacing: -1 },
  successBody: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub, marginTop: 4, textAlign: 'center' },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  balanceChipLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub },
  doneBtn: { alignSelf: 'stretch', marginTop: spacing.xxl },
});
