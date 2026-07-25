import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReactNode, useMemo } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import { formatDateTime, formatNaira } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { colors, fonts, gradients, spacing } from '@/theme/tokens';
import { AmountText, Button, Card, EmptyState, Screen, ScreenHeader } from '@/ui';

function ReceiptRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValue}>
        {typeof value === 'string' ? (
          <Text style={styles.rowValueText} numberOfLines={2}>{value}</Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

/** Donation Receipt — shown right after a successful donation. */
export default function DonationReceipt() {
  const router = useRouter();
  const { id, amount, method } = useLocalSearchParams<{ id: string; amount?: string; method?: string }>();
  const campaign = useStore((s) => s.campaigns.find((c) => c.id === id));

  // Snapshot the receipt moment once so the reference/date never re-render differently.
  const issued = useMemo(() => new Date(), []);
  const reference = useMemo(() => {
    const code = (campaign?.code ?? 'CP-000000').replace(/^CP-/, '');
    const p = (n: number) => String(n).padStart(2, '0');
    const stamp = `${issued.getFullYear()}${p(issued.getMonth() + 1)}${p(issued.getDate())}${p(issued.getHours())}${p(issued.getMinutes())}`;
    return `CPD-${code}-${stamp}`;
  }, [campaign?.code, issued]);

  if (!campaign) {
    return (
      <Screen>
        <ScreenHeader title="Donation Receipt" />
        <EmptyState icon="receipt-outline" title="Receipt unavailable" body="We couldn't find this campaign." />
      </Screen>
    );
  }

  const amt = Number(amount ?? 0);
  const payMethod = method ?? 'CirclePay Wallet';

  const shareReceipt = () =>
    Share.share({
      message:
        `Donation Receipt — CirclePay AI\n` +
        `Campaign: ${campaign.title}\n` +
        `Campaign ID: ${campaign.code}\n` +
        `Amount: ${formatNaira(amt)}\n` +
        `Method: ${payMethod}\n` +
        `Date: ${formatDateTime(issued)}\n` +
        `Reference No: ${reference}`,
    }).catch(() => undefined);

  return (
    <Screen>
      <ScreenHeader title="Donation Receipt" noBack />

      <Card style={styles.receipt}>
        {/* Brand ring logo */}
        <LinearGradient
          colors={gradients.brandRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoRing}>
          <View style={styles.logoDot} />
        </LinearGradient>
        <Text style={styles.wordmark}>
          CirclePay<Text style={styles.wordmarkAi}> AI</Text>
        </Text>
        <Text style={styles.receiptTitle}>Donation Receipt</Text>

        <View style={styles.rows}>
          <ReceiptRow label="Campaign" value={campaign.title} />
          <ReceiptRow label="Campaign ID" value={<Text style={styles.mono}>{campaign.code}</Text>} />
          <ReceiptRow label="Amount" value={<AmountText amount={amt} size={16} color={colors.primary} />} />
          <ReceiptRow label="Method" value={payMethod} />
          <ReceiptRow label="Date & Time" value={formatDateTime(issued)} />
          <ReceiptRow label="Reference No" value={<Text style={styles.monoSmall}>{reference}</Text>} />
        </View>

        <Text style={styles.thanks}>Thank you for your support! 💜</Text>
      </Card>

      <Button
        title="Share Receipt"
        variant="ghost"
        icon={<Ionicons name="share-social-outline" size={17} color={colors.primary} />}
        onPress={shareReceipt}
        style={styles.shareBtn}
      />
      <Button
        title="Done"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/support'))}
        style={styles.doneBtn}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  receipt: { alignItems: 'center', paddingVertical: spacing.xl },
  logoRing: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  logoDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.card },
  wordmark: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink, marginTop: spacing.md },
  wordmarkAi: { color: colors.accent },
  receiptTitle: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub, marginTop: 3 },
  rows: { alignSelf: 'stretch', marginTop: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub },
  rowValue: { flexShrink: 1, alignItems: 'flex-end' },
  rowValueText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink, textAlign: 'right' },
  mono: { fontFamily: fonts.mono, fontSize: 13.5, color: colors.ink },
  monoSmall: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  thanks: {
    fontFamily: fonts.bold, fontSize: 14, color: colors.primary,
    marginTop: spacing.xl, textAlign: 'center',
  },
  shareBtn: { marginTop: spacing.xl },
  doneBtn: { marginTop: spacing.md },
});
