import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDateTime, formatNaira } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { avatarColor, colors, fonts, initials, radius, spacing } from '@/theme/tokens';
import { AmountText, Button, Card, Field, Screen, ScreenHeader } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

/** Flat fee for bank withdrawals (per design fee-breakdown pattern). */
const BANK_FEE = 50;

function parseAmount(raw: string): number {
  const n = Number(raw.replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioDot} />}
    </View>
  );
}

export default function Withdraw() {
  const router = useRouter();
  const wallet = useStore((s) => s.wallet);
  const linkedAccounts = useStore((s) => s.linkedAccounts);
  const withdrawFromWallet = useStore((s) => s.withdrawFromWallet);

  const [amountStr, setAmountStr] = useState('');
  const [destId, setDestId] = useState(linkedAccounts[0]?.id ?? '');
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ amount: number; destination: string; at: string } | null>(null);

  const amount = parseAmount(amountStr);
  const dest = linkedAccounts.find((a) => a.id === destId);
  const exceedsBalance = amount > 0 && amount + BANK_FEE > wallet.available;

  const confirm = () => {
    if (amount <= 0) {
      setError('Enter a valid amount to withdraw.');
      return;
    }
    if (exceedsBalance) {
      setError(`Amount plus ${formatNaira(BANK_FEE)} fee exceeds your available balance.`);
      return;
    }
    if (!dest) {
      setError('Select a destination account.');
      return;
    }
    const label = `${dest.bank} •••• ${dest.last4}`;
    const ok = withdrawFromWallet(amount, label, BANK_FEE);
    if (!ok) {
      setError('Insufficient balance for this withdrawal.');
      return;
    }
    setError('');
    setDone({ amount, destination: label, at: new Date().toISOString() });
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
          <Text style={styles.successTitle}>Withdrawal Successful!</Text>
          <AmountText amount={done.amount} decimals={2} size={40} color={colors.primary} />
          <Text style={styles.successMeta}>is on its way to your bank</Text>
          <View style={styles.successChip}>
            <Text style={styles.successChipText}>Sent to {done.destination}</Text>
          </View>
          <Text style={styles.successDate}>
            {formatDateTime(done.at)} · Fee {formatNaira(BANK_FEE)}
          </Text>
        </View>
        <Button title="Done" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScreenHeader title="Withdraw" />

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

      <Text style={styles.sectionLabel}>Withdraw to</Text>
      {linkedAccounts.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => setDestId(a.id)}
          style={({ pressed }) => [
            styles.destCard,
            destId === a.id && styles.destCardSelected,
            pressed && { opacity: 0.8 },
          ]}>
          <View style={[styles.bankTile, { backgroundColor: avatarColor(a.bank) }]}>
            <Text style={styles.bankTileText}>{initials(a.bank)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.destTitle}>{a.bank} •••• {a.last4}</Text>
            <Text style={styles.destSub}>Bank transfer · {formatNaira(BANK_FEE)} fee</Text>
          </View>
          <Radio selected={destId === a.id} />
        </Pressable>
      ))}

      <Pressable
        onPress={() => router.push('/agent/withdraw')}
        style={({ pressed }) => [styles.destCard, pressed && { opacity: 0.8 }]}>
        <IconBubble name="storefront" color={colors.success} bg={colors.successBg} />
        <View style={{ flex: 1 }}>
          <Text style={styles.destTitle}>Cash at Agent/Kiosk</Text>
          <Text style={styles.destSub}>Get a one-time cash code for any agent</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.faint} />
      </Pressable>

      {/* Fee breakdown */}
      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Amount</Text>
          <AmountText amount={amount} decimals={2} size={13.5} />
        </View>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Transaction fee</Text>
          <AmountText amount={BANK_FEE} decimals={2} size={13.5} />
        </View>
        <View style={styles.feeDivider} />
        <View style={styles.feeRow}>
          <Text style={styles.feeTotalLabel}>Total deduction</Text>
          <AmountText amount={amount + BANK_FEE} decimals={2} size={15} color={colors.primary} />
        </View>
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button
          title={amount > 0 ? `Withdraw ${formatNaira(amount)}` : 'Withdraw'}
          onPress={confirm}
          disabled={amount <= 0 || exceedsBalance || !dest}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nairaPrefix: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: spacing.sm,
  },

  destCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  destCardSelected: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  destTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  destSub: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  bankTile: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankTileText: { fontFamily: fonts.bold, fontSize: 13, color: colors.onPrimary },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  feeLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub },
  feeTotalLabel: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
  feeDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

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
  successDate: { fontFamily: fonts.medium, fontSize: 12, color: colors.faint, marginTop: spacing.md },
});
