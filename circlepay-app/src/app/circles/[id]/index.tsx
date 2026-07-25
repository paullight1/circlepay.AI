import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { notify } from '@/lib/dialogs';
import { formatDate, formatDateTime, formatNaira } from '@/lib/format';
import type { Circle, Frequency } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/tokens';
import {
  AmountText, Avatar, Button, Card, CountdownTimer, EmptyState, ProgressBar,
  Screen, ScreenHeader, StatusPill,
} from '@/ui';
import { IconBubble } from '@/ui/ListRow';

const FREQ_LABEL: Record<Frequency, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

type TabKey = 'overview' | 'members' | 'transactions';
const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'members', label: 'Members' },
  { key: 'transactions', label: 'Transactions' },
];

/** 10 · Group Dashboard — Overview / Members / Transactions. */
export default function GroupDashboard() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const circle = useStore((s) => s.circles.find((c) => c.id === id));
  const transactions = useStore((s) => s.transactions);
  const contributeToCircle = useStore((s) => s.contributeToCircle);
  const [tab, setTab] = useState<TabKey>('overview');

  if (!circle) {
    return (
      <Screen>
        <ScreenHeader title="Circle" />
        <EmptyState icon="people-outline" title="Circle not found" body="This circle may have been removed." />
      </Screen>
    );
  }

  const memberCount = circle.members.length;
  const pool = circle.amountPerMember * memberCount;
  const paid = circle.members.filter((m) => m.status === 'paid');
  const pending = circle.members.filter((m) => m.status === 'pending');
  const late = circle.members.filter((m) => m.status === 'late');
  const receiver = circle.members.find((m) => m.position === circle.currentCycle) ?? circle.members[0]!;
  const you = circle.members.find((m) => m.isYou);
  const youPaid = you?.status === 'paid';
  const payoutDue = new Date(circle.nextPayoutDate).getTime() <= Date.now();

  const totalContributions = paid.length * circle.amountPerMember;
  const backupPool = Math.round(totalContributions * (circle.backupPoolPct / 100));
  const availableForPayout = totalContributions - backupPool;

  const circleTxs = transactions.filter((t) => t.category === 'circle');

  const onContribute = () => {
    const ok = contributeToCircle(circle.id);
    if (!ok) {
      notify('Contribution failed', 'Your wallet balance is too low. Add money and try again.');
    }
  };

  const goToPayout = () =>
    router.push({ pathname: '/circles/[id]/payout', params: { id: circle.id } });

  return (
    <Screen>
      <ScreenHeader
        title={circle.name}
        subtitle={`${memberCount} Members · ${FREQ_LABEL[circle.frequency]} · ${formatNaira(pool)}`}
      />

      {/* Tab pills */}
      <View style={styles.tabTrack}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tabPill, tab === t.key && styles.tabPillActive]}>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* AI alert banner */}
      {late.length > 0 && (
        <Card
          onPress={() => router.push('/trust/risk')}
          style={styles.alertCard}>
          <Ionicons name="warning" size={20} color={colors.danger} />
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>AI Alert</Text>
            <Text style={styles.alertText}>
              {late[0]!.name} is at high risk of default based on payment behavior.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.danger} />
        </Card>
      )}

      {tab === 'overview' && (
        <View style={styles.stack}>
          {/* Next payout countdown */}
          <Card>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.cardLabel}>Next Payout</Text>
                <Text style={styles.cardDate}>{formatDate(circle.nextPayoutDate)}</Text>
              </View>
              <AmountText amount={pool} size={20} color={colors.primary} />
            </View>
            <CountdownTimer target={circle.nextPayoutDate} />
            {payoutDue ? (
              <Button
                title="Payout day — view payout"
                variant="success"
                onPress={goToPayout}
                style={styles.payoutDueBtn}
                small
              />
            ) : (
              <Pressable onPress={goToPayout} hitSlop={8} style={styles.simulateLink}>
                <Text style={styles.simulateText}>Simulate payout day</Text>
                <Ionicons name="arrow-forward" size={13} color={colors.primary} />
              </Pressable>
            )}
          </Card>

          {/* Next receiver */}
          <LinearGradient
            colors={gradients.payout}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.receiverCard}>
            <Avatar name={receiver.name} size={52} ring />
            <View style={styles.receiverBody}>
              <Text style={styles.receiverLabel}>Next Receiver</Text>
              <Text style={styles.receiverName}>
                {receiver.name}
                {receiver.isYou ? ' (You)' : ''}
              </Text>
              <Text style={styles.receiverText}>
                Will receive {formatNaira(pool)} on {formatDate(circle.nextPayoutDate)} automatically to their account.
              </Text>
            </View>
          </LinearGradient>

          {/* Group balance */}
          <LinearGradient
            colors={gradients.balance}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}>
            <View style={styles.balanceHead}>
              <Text style={styles.balanceLabel}>Group Balance</Text>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.onPrimaryDim} />
            </View>
            <AmountText amount={totalContributions} size={28} color={colors.onPrimary} style={styles.balanceValue} />
            <View style={styles.balanceRow}>
              <Text style={styles.balanceRowLabel}>Total Contributions</Text>
              <AmountText amount={totalContributions} size={13} color={colors.onPrimary} />
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceRowLabel}>Backup Pool ({circle.backupPoolPct}%)</Text>
              <AmountText amount={backupPool} size={13} color={colors.onPrimary} />
            </View>
            <View style={[styles.balanceRow, styles.balanceRowLast]}>
              <Text style={styles.balanceRowLabel}>Available for Payout</Text>
              <AmountText amount={availableForPayout} size={13} color={colors.onPrimary} />
            </View>
          </LinearGradient>

          {/* Payment summary */}
          <Card>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            {(
              [
                { label: 'Paid', list: paid, color: colors.success },
                { label: 'Pending', list: pending, color: colors.warning },
                { label: 'Late', list: late, color: colors.danger },
              ] as const
            ).map((row) => (
              <View key={row.label} style={styles.summaryRow}>
                <View style={styles.summaryTop}>
                  <View style={styles.summaryLabelWrap}>
                    <View style={[styles.dot, { backgroundColor: row.color }]} />
                    <Text style={styles.summaryLabel}>
                      {row.label} ({row.list.length})
                    </Text>
                  </View>
                  <AmountText amount={row.list.length * circle.amountPerMember} size={13} />
                </View>
                <ProgressBar progress={row.list.length / Math.max(1, memberCount)} color={row.color} height={7} />
              </View>
            ))}
          </Card>

          <Button
            title={youPaid ? 'Paid ✓' : `Contribute Now · ${formatNaira(circle.amountPerMember)}`}
            disabled={youPaid}
            onPress={onContribute}
          />
          <Button
            title="View Members"
            variant="secondary"
            onPress={() => router.push({ pathname: '/circles/[id]/members', params: { id: circle.id } })}
          />
        </View>
      )}

      {tab === 'members' && <MembersList circle={circle} />}

      {tab === 'transactions' && (
        <View style={styles.stack}>
          {circleTxs.length === 0 ? (
            <EmptyState
              icon="swap-horizontal-outline"
              title="No circle transactions yet"
              body="Contributions and payouts will show up here."
            />
          ) : (
            <Card padded={false} style={styles.txCard}>
              {circleTxs.map((t, i) => (
                <View key={t.id} style={[styles.txRow, i > 0 && styles.txRowBorder]}>
                  <IconBubble
                    name={t.direction === 'in' ? 'arrow-down-outline' : 'arrow-up-outline'}
                    color={t.direction === 'in' ? colors.success : colors.primary}
                    bg={t.direction === 'in' ? colors.successBg : colors.chip}
                  />
                  <View style={styles.txBody}>
                    <Text style={styles.txTitle} numberOfLines={1}>{t.title}</Text>
                    <Text style={styles.txSub} numberOfLines={1}>
                      {t.subtitle ? `${t.subtitle} · ` : ''}
                      {formatDateTime(t.date)}
                    </Text>
                  </View>
                  <AmountText amount={t.amount} size={14} signed={t.direction} />
                </View>
              ))}
            </Card>
          )}
        </View>
      )}
    </Screen>
  );
}

/** Member rows — same content as the Members Status screen, rendered in-tab. */
function MembersList({ circle }: { circle: Circle }) {
  const ordered = [...circle.members].sort((a, b) => a.position - b.position);
  return (
    <View style={styles.stack}>
      <Card padded={false} style={styles.txCard}>
        {ordered.map((m, i) => (
          <View key={m.id} style={[styles.memberRow, i > 0 && styles.txRowBorder]}>
            <View style={styles.posBadge}>
              <Text style={styles.posText}>{m.position}</Text>
            </View>
            <Avatar name={m.name} size={38} ring={m.position === circle.currentCycle} />
            <View style={styles.txBody}>
              <Text style={styles.txTitle} numberOfLines={1}>
                {m.name}
                {m.isYou ? ' (You)' : ''}
              </Text>
              <Text style={styles.txSub}>
                {m.position === circle.currentCycle ? 'Next receiver' : `Payout position #${m.position}`}
              </Text>
            </View>
            <View style={styles.memberRight}>
              <AmountText amount={m.amount} size={13} />
              <StatusPill
                label={m.status === 'paid' ? 'Paid' : m.status === 'pending' ? 'Pending' : 'Late'}
                small
              />
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabPillActive: { backgroundColor: colors.card },
  tabLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.sub },
  tabLabelActive: { color: colors.primary },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBg,
    marginBottom: spacing.lg,
  },
  alertBody: { flex: 1 },
  alertTitle: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.danger },
  alertText: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink, marginTop: 2, lineHeight: 17 },

  stack: { gap: spacing.md },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardLabel: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
  cardDate: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  payoutDueBtn: { marginTop: spacing.md },
  simulateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: spacing.md,
  },
  simulateText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.primary },

  receiverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  receiverBody: { flex: 1 },
  receiverLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.onPrimaryDim },
  receiverName: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.onPrimary, marginTop: 2 },
  receiverText: { fontFamily: fonts.medium, fontSize: 12, color: colors.onPrimaryDim, marginTop: 5, lineHeight: 17 },

  balanceCard: { borderRadius: radius.lg, padding: spacing.xl },
  balanceHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.onPrimaryDim },
  balanceValue: { marginTop: 6, marginBottom: spacing.md },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  balanceRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  balanceRowLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.onPrimaryDim },

  summaryTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, marginBottom: spacing.md },
  summaryRow: { marginBottom: spacing.md },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  summaryLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink },

  txCard: { paddingHorizontal: spacing.lg },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  txRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  txBody: { flex: 1 },
  txTitle: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  txSub: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  memberRight: { alignItems: 'flex-end', gap: 4 },
  posBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posText: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.primary },
});
