import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/tokens';
import { AmountText, Button, Card, Chip, Field, Screen, ScreenHeader } from '@/ui';

const DENOMINATIONS = [1000, 5000, 10000];

/** "4821903712345678" → "4821 9037 1234 5678" */
function groupSerial(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export default function RedeemScratchCardScreen() {
  const router = useRouter();
  const redeemScratchCard = useStore((s) => s.redeemScratchCard);
  const available = useStore((s) => s.wallet.available);

  const [serial, setSerial] = useState('');       // digits only
  const [error, setError] = useState<string | undefined>();
  const [redeemed, setRedeemed] = useState<number | null>(null);

  const onChangeSerial = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    setSerial(digits);
    if (error) setError(undefined);
  };

  const onRedeem = () => {
    if (serial.length < 14) {
      setError('Enter the full 14–16 digit serial number.');
      return;
    }
    const result = redeemScratchCard(serial);
    if (!result.ok) {
      setError(result.error ?? 'Could not redeem this card.');
      return;
    }
    setRedeemed(result.amount ?? 0);
  };

  if (redeemed !== null) {
    return (
      <Screen>
        <ScreenHeader title="Redeem Scratch Card" />
        <View style={styles.successWrap}>
          <View style={styles.successHalo}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={38} color={colors.onPrimary} />
            </View>
          </View>
          <Text style={styles.successTitle}>Card Redeemed!</Text>
          <AmountText amount={redeemed} size={36} color={colors.success} style={styles.successAmount} />
          <Text style={styles.successBody}>added to your wallet</Text>
          <View style={styles.balanceChip}>
            <Text style={styles.balanceChipLabel}>New wallet balance</Text>
            <AmountText amount={available} decimals={2} size={16} color={colors.primary} />
          </View>
          <Button title="Done" onPress={() => router.back()} style={styles.doneBtn} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Redeem Scratch Card" />

      {/* Card visual + explainer */}
      <LinearGradient
        colors={gradients.balance}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardVisual}>
        <View style={styles.cardDecor} />
        <Text style={styles.cardBrand}>CIRCLEPAY SAVINGS CARD</Text>
        <Text style={styles.cardValue}>₦1,000 · ₦5,000 · ₦10,000</Text>
        <Text style={styles.cardHint}>Scratch the panel to reveal your serial</Text>
      </LinearGradient>

      <Card style={styles.explainer}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={styles.explainerText}>
          Buy a CirclePay savings card from any agent, scratch, and enter the serial to top up
          your wallet instantly.
        </Text>
      </Card>

      {/* Denominations (informational) */}
      <Text style={styles.sectionLabel}>Available card values</Text>
      <View style={styles.denomRow}>
        {DENOMINATIONS.map((d) => (
          <Chip key={d} label={`₦${d.toLocaleString('en-US')}`} style={styles.denomChip} />
        ))}
      </View>

      {/* Serial entry */}
      <Field
        label="Serial number"
        placeholder="4821 9037 1234 5678"
        value={groupSerial(serial)}
        onChangeText={onChangeSerial}
        keyboardType="number-pad"
        maxLength={19}
        error={error}
        hint="14–16 digits, printed under the scratch panel"
        left={<Ionicons name="card" size={18} color={colors.faint} />}
        style={styles.serialInput}
      />

      <Button title="Redeem Card" onPress={onRedeem} disabled={serial.length < 14} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardVisual: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  cardDecor: {
    position: 'absolute',
    bottom: -36,
    right: -26,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cardBrand: { fontFamily: fonts.semibold, fontSize: 11, color: colors.onPrimaryDim, letterSpacing: 1.4 },
  cardValue: { fontFamily: fonts.mono, fontSize: 17, color: colors.onPrimary, letterSpacing: 1.5, marginTop: spacing.md },
  cardHint: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.onPrimaryDim, marginTop: spacing.sm },

  explainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.chip,
    borderColor: colors.chip,
  },
  explainerText: { flex: 1, fontFamily: fonts.medium, fontSize: 12.5, color: colors.primaryDark, lineHeight: 18 },

  sectionLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, marginBottom: 7 },
  denomRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  denomChip: { flex: 1, justifyContent: 'center' },

  serialInput: { fontFamily: fonts.mono, fontSize: 16, letterSpacing: 1 },

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
  successBody: { fontFamily: fonts.medium, fontSize: 14, color: colors.sub, marginTop: 4 },
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
