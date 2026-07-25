import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatDateTime, formatNaira } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { AmountText, Button, Card, Field, Screen, ScreenHeader } from '@/ui';

function parseAmount(raw: string): number {
  const n = Number(raw.replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function Transfer() {
  const router = useRouter();
  const { to } = useLocalSearchParams<{ to?: string }>();
  const wallet = useStore((s) => s.wallet);
  const transfer = useStore((s) => s.transfer);

  const [recipient, setRecipient] = useState(typeof to === 'string' ? to : '');
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ amount: number; recipient: string; note: string; at: string } | null>(null);

  const amount = parseAmount(amountStr);
  const exceedsBalance = amount > 0 && amount > wallet.available;
  const ready = recipient.trim().length > 0 && amount > 0 && !exceedsBalance;

  const confirm = () => {
    if (!recipient.trim()) {
      setError('Enter a CirclePay ID or phone number.');
      return;
    }
    if (amount <= 0) {
      setError('Enter a valid amount to send.');
      return;
    }
    const ok = transfer(amount, recipient.trim());
    if (!ok) {
      setError('Insufficient balance for this transfer.');
      return;
    }
    setError('');
    setDone({ amount, recipient: recipient.trim(), note: note.trim(), at: new Date().toISOString() });
  };

  if (done) {
    return (
      <Screen scroll={false} padded={false}>
        <View style={styles.successWrap}>
          <View style={styles.successHalo}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={34} color={colors.onPrimary} />
            </View>
          </View>
          <Text style={styles.successTitle}>Transfer Sent!</Text>
          <AmountText amount={done.amount} decimals={2} size={40} color={colors.primary} />
          <Text style={styles.successMeta}>has been sent to</Text>
          <View style={styles.successChip}>
            <Text style={styles.successChipText}>{done.recipient}</Text>
          </View>
          {!!done.note && <Text style={styles.successNote}>“{done.note}”</Text>}
          <Text style={styles.successDate}>{formatDateTime(done.at)} · No fees</Text>
        </View>
        <Button title="Done" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScreenHeader title="Transfer" />

      <Field
        label="Recipient"
        placeholder="CirclePay ID or phone number"
        autoCapitalize="characters"
        value={recipient}
        onChangeText={(t) => { setRecipient(t); setError(''); }}
        hint="e.g. CPAI-7834-5689 or +234 803 555 0147"
        left={<Ionicons name="person-outline" size={17} color={colors.faint} />}
      />

      <Field
        label="Amount"
        placeholder="0.00"
        keyboardType="numeric"
        value={amountStr}
        onChangeText={(t) => { setAmountStr(t); setError(''); }}
        error={error || (exceedsBalance ? 'Exceeds your available balance.' : undefined)}
        hint={`Available: ${formatNaira(wallet.available, 2)}`}
        left={<Text style={styles.nairaPrefix}>₦</Text>}
      />

      <Field
        label="Note (optional)"
        placeholder="What is this for?"
        value={note}
        onChangeText={setNote}
      />

      {/* Summary */}
      <Card>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Recipient</Text>
          <Text style={styles.summaryValue} numberOfLines={1}>
            {recipient.trim() || '—'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Amount</Text>
          <AmountText amount={amount} decimals={2} size={13.5} />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Transfer fee</Text>
          <Text style={styles.summaryFree}>Free</Text>
        </View>
        {!!note.trim() && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Note</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>{note.trim()}</Text>
          </View>
        )}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <AmountText amount={amount} decimals={2} size={15} color={colors.primary} />
        </View>
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button
          title={amount > 0 ? `Send ${formatNaira(amount)}` : 'Send Money'}
          onPress={confirm}
          disabled={!ready}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nairaPrefix: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },

  summaryTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: 5,
  },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub },
  summaryValue: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  summaryFree: { fontFamily: fonts.bold, fontSize: 13, color: colors.success },
  summaryTotalLabel: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  successMeta: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.sub, marginTop: spacing.sm },
  successChip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    marginTop: spacing.lg,
  },
  successChipText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink },
  successNote: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.sub,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  successDate: { fontFamily: fonts.medium, fontSize: 12, color: colors.faint, marginTop: spacing.md },
});
