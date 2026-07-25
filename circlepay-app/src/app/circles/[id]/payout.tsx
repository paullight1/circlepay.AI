import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Share, StyleSheet, Text, View } from 'react-native';

import { formatDateTime, formatNaira } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { AmountText, Button, Card, EmptyState, Screen, ScreenHeader } from '@/ui';

const CONFETTI: Array<{ top: number; left?: number; right?: number; size: number; rotate: string; color: string; round?: boolean }> = [
  { top: 6, left: 30, size: 9, rotate: '18deg', color: colors.warning },
  { top: 40, left: 8, size: 7, rotate: '-24deg', color: colors.primary },
  { top: 96, left: 22, size: 6, rotate: '0deg', color: colors.danger, round: true },
  { top: 10, right: 34, size: 8, rotate: '32deg', color: colors.success },
  { top: 52, right: 10, size: 9, rotate: '-16deg', color: colors.accent },
  { top: 100, right: 28, size: 6, rotate: '45deg', color: colors.warning, round: true },
  { top: 130, left: 60, size: 7, rotate: '60deg', color: colors.accent },
  { top: 132, right: 62, size: 7, rotate: '-40deg', color: colors.primary, round: true },
];

/** 12 · Payout Success — celebration after a cycle payout. */
export default function PayoutSuccess() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const circle = useStore((s) => s.circles.find((c) => c.id === id));
  const account = useStore((s) => s.linkedAccounts.find((a) => a.active) ?? s.linkedAccounts[0]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paidAt] = useState(() => new Date().toISOString());

  const scale = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 60 }).start();
  }, [scale]);

  if (!circle) {
    return (
      <Screen>
        <ScreenHeader title="Payout" />
        <EmptyState icon="people-outline" title="Circle not found" body="This circle may have been removed." />
      </Screen>
    );
  }

  const pool = circle.amountPerMember * circle.members.length;
  const receiver = circle.members.find((m) => m.position === circle.currentCycle) ?? circle.members[0]!;
  const bank = account?.bank ?? 'GTBank';
  const last4 = account?.last4 ?? '1234';

  const onShare = () => {
    Share.share({
      message: `🎉 ${circle.name}: ${formatNaira(pool)} has been paid out to ${receiver.name}. Cycle ${circle.currentCycle} complete on CirclePay AI!`,
    }).catch(() => {});
  };

  return (
    <Screen>
      <ScreenHeader title={circle.name} />

      <View style={styles.hero}>
        {CONFETTI.map((c, i) => (
          <View
            key={i}
            style={[
              styles.confetti,
              {
                top: c.top,
                left: c.left,
                right: c.right,
                width: c.size,
                height: c.size,
                backgroundColor: c.color,
                borderRadius: c.round ? c.size / 2 : 2,
                transform: [{ rotate: c.rotate }],
              },
            ]}
          />
        ))}
        <Animated.View style={[styles.halo, { transform: [{ scale }] }]}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={38} color={colors.onPrimary} />
          </View>
        </Animated.View>

        <Text style={styles.title}>Payout Successful!</Text>
        <AmountText amount={pool} size={38} color={colors.primary} style={styles.amount} />
        <Text style={styles.sentTo}>
          has been sent to <Text style={styles.receiverName}>{receiver.name}{receiver.isYou ? ' (You)' : ''}</Text>
        </Text>
        <Text style={styles.dateText}>{formatDateTime(paidAt)}</Text>

        <View style={styles.bankChip}>
          <Ionicons name="business-outline" size={14} color={colors.sub} />
          <Text style={styles.bankChipText}>Sent to {bank} •••• {last4}</Text>
        </View>
      </View>

      {showReceipt && (
        <Card style={styles.receipt}>
          <Text style={styles.receiptTitle}>Payout Receipt</Text>
          {(
            [
              ['Circle', circle.name],
              ['Cycle', `${circle.currentCycle} of ${circle.members.length}`],
              ['Receiver', receiver.name],
              ['Amount', formatNaira(pool)],
              ['Backup pool retained', formatNaira(Math.round(pool * (circle.backupPoolPct / 100)))],
              ['Destination', `${bank} •••• ${last4}`],
              ['Date', formatDateTime(paidAt)],
              ['Reference', `CPAY-${circle.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}-${circle.currentCycle}`],
            ] as const
          ).map(([label, value], i) => (
            <View key={label} style={[styles.receiptRow, i > 0 && styles.receiptRowBorder]}>
              <Text style={styles.receiptLabel}>{label}</Text>
              <Text style={styles.receiptValue} numberOfLines={1}>{value}</Text>
            </View>
          ))}
        </Card>
      )}

      <View style={styles.actions}>
        <Button
          title={showReceipt ? 'Hide Receipt' : 'View Receipt'}
          onPress={() => setShowReceipt((v) => !v)}
        />
        <Button
          title="Share with Group"
          variant="secondary"
          icon={<Ionicons name="share-social-outline" size={17} color={colors.primary} />}
          onPress={onShare}
        />
        <Button title="Back to Group" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  confetti: { position: 'absolute' },
  halo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.ink, letterSpacing: -0.4 },
  amount: { marginTop: spacing.sm, letterSpacing: -1 },
  sentTo: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.sub, marginTop: spacing.sm },
  receiverName: { fontFamily: fonts.bold, color: colors.ink },
  dateText: { fontFamily: fonts.medium, fontSize: 12, color: colors.faint, marginTop: 4 },
  bankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginTop: spacing.lg,
  },
  bankChipText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink },
  receipt: { marginBottom: spacing.lg },
  receiptTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, marginBottom: spacing.sm },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  receiptRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  receiptLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub },
  receiptValue: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink, flexShrink: 1 },
  actions: { gap: spacing.md },
});
