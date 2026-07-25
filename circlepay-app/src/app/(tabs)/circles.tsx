import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { formatDate, formatNaira } from '@/lib/format';
import type { Circle } from '@/store/types';
import { useStore } from '@/store/useStore';
import { avatarColor, colors, fonts, gradients, initials, radius, spacing } from '@/theme/tokens';
import { AmountText, Button, Card, ProgressBar, Screen, ScreenHeader, SectionHeader, StatusPill } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

const FREQ_LABEL: Record<Circle['frequency'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

function paidCount(c: Circle): number {
  return c.members.filter((m) => m.status === 'paid').length;
}

function poolOf(c: Circle): number {
  return c.amountPerMember * c.members.length;
}

/** 07 · My Circles — rotating savings home tab. */
export default function MyCircles() {
  const router = useRouter();
  const circles = useStore((s) => s.circles);

  const totalSaved = circles.reduce(
    (sum, c) => sum + paidCount(c) * c.amountPerMember + c.backupPoolBalance,
    0
  );

  return (
    <Screen>
      <ScreenHeader title="My Circles" noBack />

      {/* Summary: total groups / total saved */}
      <LinearGradient colors={gradients.balance} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Total Groups</Text>
          <Text style={styles.statValue}>{circles.length}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Total Saved</Text>
          <AmountText amount={totalSaved} size={24} color={colors.onPrimary} />
        </View>
      </LinearGradient>

      <Button
        title="Create Circle"
        icon={<Ionicons name="add-circle-outline" size={19} color={colors.onPrimary} />}
        onPress={() => router.push('/circles/create')}
        style={styles.createBtn}
      />

      <Card onPress={() => router.push('/circles/link-bank')} style={styles.bankRow}>
        <IconBubble name="business-outline" />
        <View style={styles.bankBody}>
          <Text style={styles.bankTitle}>Link Bank Account</Text>
          <Text style={styles.bankSub}>Automate contributions via Open Banking</Text>
        </View>
        <Ionicons name="chevron-forward" size={17} color={colors.faint} />
      </Card>

      <SectionHeader title="Your Circles" />
      <View style={styles.list}>
        {circles.map((c) => {
          const paid = paidCount(c);
          return (
            <Card
              key={c.id}
              onPress={() => router.push({ pathname: '/circles/[id]', params: { id: c.id } })}>
              <View style={styles.rowTop}>
                <View style={[styles.tile, { backgroundColor: avatarColor(c.name) }]}>
                  <Text style={styles.tileText}>{initials(c.name)}</Text>
                </View>
                <View style={styles.titleCol}>
                  <Text style={styles.circleName} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.circleMeta}>
                    {c.members.length} Members · {FREQ_LABEL[c.frequency]} · {formatNaira(c.amountPerMember)}
                  </Text>
                </View>
                <StatusPill label={c.status === 'active' ? 'Active' : c.status === 'pending' ? 'Pending' : 'Completed'} small />
              </View>

              <View style={styles.rowMid}>
                <View>
                  <Text style={styles.payoutLabel}>Next Payout</Text>
                  <Text style={styles.payoutDate}>{formatDate(c.nextPayoutDate)}</Text>
                </View>
                <AmountText amount={poolOf(c)} size={17} color={colors.primary} />
              </View>

              <View style={styles.rowPaid}>
                <Text style={styles.paidText}>
                  {paid}/{c.members.length} Paid
                </Text>
              </View>
              <ProgressBar progress={paid / Math.max(1, c.members.length)} />
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  statCol: { flex: 1 },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: spacing.lg,
  },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.onPrimaryDim, marginBottom: 5 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.onPrimary, letterSpacing: -0.5 },
  createBtn: { marginBottom: spacing.md },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  bankBody: { flex: 1 },
  bankTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  bankSub: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  list: { gap: spacing.md },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onPrimary },
  titleCol: { flex: 1 },
  circleName: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  circleMeta: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  rowMid: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  payoutLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.faint },
  payoutDate: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink, marginTop: 2 },
  rowPaid: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 },
  paidText: { fontFamily: fonts.bold, fontSize: 12, color: colors.success },
});
