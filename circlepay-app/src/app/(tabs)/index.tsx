import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, timeAgo } from '@/lib/format';
import type { Circle, Transaction } from '@/store/types';
import { useStore } from '@/store/useStore';
import {
  avatarColor, colors, fonts, gradients, initials, radius, shadow, spacing,
} from '@/theme/tokens';
import {
  AmountText, Avatar, Card, ListRow, ProgressBar, Screen, SectionHeader, StatusPill,
  WelcomeModal,
} from '@/ui';
import { IconBubble } from '@/ui/ListRow';

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Rounded-square initials tile used on circle rows (per design 05/07). */
function InitialsTile({ name, size = 42 }: { name: string; size?: number }) {
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, backgroundColor: avatarColor(name) },
      ]}>
      <Text style={[styles.tileText, { fontSize: size * 0.33 }]}>{initials(name)}</Text>
    </View>
  );
}

function BalanceAction({
  icon, label, onPress,
}: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.balanceAction, pressed && { opacity: 0.75 }]}>
      <Ionicons name={icon} size={15} color={colors.onPrimary} />
      <Text style={styles.balanceActionLabel}>{label}</Text>
    </Pressable>
  );
}

function QuickTile({
  icon, tint, bg, label, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickTile, pressed && { opacity: 0.75 }]}>
      <IconBubble name={icon} color={tint} bg={bg} size={44} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function GroupCard({ circle, onPress }: { circle: Circle; onPress: () => void }) {
  const paid = circle.members.filter((m) => m.status === 'paid').length;
  const total = circle.members.length;
  const pool = circle.amountPerMember * total;
  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.md }}>
      <View style={styles.groupTop}>
        <InitialsTile name={circle.name} />
        <View style={{ flex: 1 }}>
          <Text style={styles.groupName} numberOfLines={1}>{circle.name}</Text>
          <Text style={styles.groupMeta}>
            {total} members · {cap(circle.frequency)}
          </Text>
        </View>
        <Text style={styles.paidRatio}>{paid}/{total} Paid</Text>
      </View>
      <View style={styles.groupBottom}>
        <View>
          <Text style={styles.groupLabel}>Next Payout</Text>
          <Text style={styles.groupDate}>{formatDate(circle.nextPayoutDate)}</Text>
        </View>
        <AmountText amount={pool} size={16} color={colors.primary} />
      </View>
      <View style={{ marginTop: spacing.sm }}>
        <ProgressBar progress={total ? paid / total : 0} color={colors.primary} height={7} />
      </View>
    </Card>
  );
}

function TxRow({ tx, last }: { tx: Transaction; last: boolean }) {
  const incoming = tx.direction === 'in';
  return (
    <ListRow
      title={tx.title}
      subtitle={`${tx.subtitle ?? cap(tx.category)} · ${timeAgo(tx.date)}`}
      left={
        <IconBubble
          name={incoming ? 'arrow-down' : 'arrow-up'}
          color={incoming ? colors.success : colors.primary}
          bg={incoming ? colors.successBg : colors.chip}
        />
      }
      right={
        <View style={styles.txRight}>
          <AmountText amount={tx.amount} signed={tx.direction} size={14} />
          <StatusPill small label={cap(tx.status)} />
        </View>
      }
      style={!last ? styles.txDivider : undefined}
    />
  );
}

export default function Home() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const wallet = useStore((s) => s.wallet);
  const circles = useStore((s) => s.circles);
  const transactions = useStore((s) => s.transactions);
  const hasUnread = useStore((s) => s.notifications.some((n) => !n.read));
  const [hidden, setHidden] = useState(false);

  // First-run greeting. `onboarded` keeps it out of the auth/onboarding flow
  // entirely, and because `seenWelcome` is persisted and set by both exits, it
  // fires exactly once per account — never again after that.
  const onboarded = useStore((s) => s.onboarded);
  const seenWelcome = useStore((s) => s.seenWelcome);
  const setSeenWelcome = useStore((s) => s.setSeenWelcome);
  const focused = useIsFocused();

  const closeWelcome = useCallback(() => setSeenWelcome(true), [setSeenWelcome]);
  const openCircles = useCallback(() => {
    setSeenWelcome(true);
    router.push('/(tabs)/circles');
  }, [setSeenWelcome, router]);

  const total = wallet.available + wallet.onHold;

  return (
    <Screen>
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <Avatar name={user.name} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingHi}>Good morning,</Text>
          <Text style={styles.greetingName}>{user.firstName} 👋</Text>
        </View>
        <Pressable
          onPress={() => router.push('/trust/notifications')}
          hitSlop={8}
          style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="notifications-outline" size={20} color={colors.ink} />
          {hasUnread && <View style={styles.bellDot} />}
        </Pressable>
      </View>

      {/* Balance card */}
      <LinearGradient
        colors={gradients.balance}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}>
        <View style={styles.balanceTitleRow}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={colors.onPrimaryDim}
            />
          </Pressable>
        </View>
        {hidden ? (
          <Text style={styles.hiddenBig}>₦ ••••••</Text>
        ) : (
          <AmountText amount={total} decimals={2} size={32} color={colors.onPrimary} />
        )}
        <View style={styles.balanceSplit}>
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceSubLabel}>Available Balance</Text>
            {hidden ? (
              <Text style={styles.hiddenSmall}>₦ ••••</Text>
            ) : (
              <AmountText amount={wallet.available} decimals={2} size={15} color={colors.onPrimary} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceSubLabel}>On Hold (Groups)</Text>
            {hidden ? (
              <Text style={styles.hiddenSmall}>₦ ••••</Text>
            ) : (
              <AmountText amount={wallet.onHold} decimals={2} size={15} color={colors.onPrimary} />
            )}
          </View>
        </View>
        <View style={styles.balanceActions}>
          <BalanceAction icon="add" label="Add Money" onPress={() => router.push('/wallet/add-money')} />
          <BalanceAction icon="arrow-up" label="Withdraw" onPress={() => router.push('/wallet/withdraw')} />
          <BalanceAction icon="swap-horizontal" label="Transfer" onPress={() => router.push('/wallet/transfer')} />
        </View>
      </LinearGradient>

      {/* Quick access */}
      <View style={styles.quickRow}>
        <QuickTile
          icon="receipt"
          tint={colors.success}
          bg={colors.successBg}
          label="Bills"
          onPress={() => router.push('/bills')}
        />
        <QuickTile
          icon="people"
          tint={colors.primary}
          bg={colors.chip}
          label="Circles"
          onPress={() => router.push('/(tabs)/circles')}
        />
        <QuickTile
          icon="calendar"
          tint={colors.info}
          bg={colors.infoBg}
          label="Pay Gradually"
          onPress={() => router.push('/partpay')}
        />
        <QuickTile
          icon="heart"
          tint={colors.danger}
          bg={colors.dangerBg}
          label="Support"
          onPress={() => router.push('/(tabs)/support')}
        />
      </View>

      {/* My Groups */}
      <SectionHeader
        title="My Groups"
        actionLabel="See all"
        onAction={() => router.push('/(tabs)/circles')}
      />
      {circles.slice(0, 3).map((c) => (
        <GroupCard key={c.id} circle={c} onPress={() => router.push(`/circles/${c.id}`)} />
      ))}

      {/* Promo banner */}
      <LinearGradient
        colors={gradients.payout}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.promoCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.promoTitle}>Pay for what matters gradually with CirclePay</Text>
          <Pressable
            onPress={() => router.push('/partpay')}
            style={({ pressed }) => [styles.promoBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.promoBtnLabel}>Get Started</Text>
          </Pressable>
        </View>
        <View style={styles.promoIcon}>
          <Ionicons name="calendar" size={24} color={colors.onPrimary} />
        </View>
      </LinearGradient>

      {/* Recent transactions */}
      <SectionHeader
        title="Recent Transactions"
        actionLabel="See all"
        onAction={() => router.push('/wallet/transactions')}
      />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        {transactions.slice(0, 4).map((t, i, arr) => (
          <TxRow key={t.id} tx={t} last={i === arr.length - 1} />
        ))}
      </Card>

      {/* Overlay only — <Modal> is absolutely positioned, so it adds no layout. */}
      <WelcomeModal
        visible={focused && onboarded && !seenWelcome}
        onClose={closeWelcome}
        onPrimary={openCircles}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  greetingHi: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub },
  greetingName: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink, marginTop: 1 },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.card,
  },

  balanceCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.raised,
  },
  balanceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  balanceLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onPrimaryDim },
  hiddenBig: { fontFamily: fonts.mono, fontSize: 32, color: colors.onPrimary },
  hiddenSmall: { fontFamily: fonts.mono, fontSize: 15, color: colors.onPrimary },
  balanceSplit: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  balanceSubLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.onPrimaryDim,
    marginBottom: 3,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  balanceAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 13,
    paddingVertical: 11,
  },
  balanceActionLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.onPrimary },

  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  quickTile: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    ...shadow.card,
  },
  quickLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.ink,
    textAlign: 'center',
  },

  tile: {
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: { fontFamily: fonts.bold, color: colors.onPrimary },
  groupTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  groupName: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  groupMeta: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  paidRatio: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.success },
  groupBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  groupLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub },
  groupDate: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink, marginTop: 2 },

  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  promoTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.onPrimary,
    lineHeight: 21,
  },
  promoBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.onPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    marginTop: spacing.md,
  },
  promoBtnLabel: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.primary },
  promoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  txRight: { alignItems: 'flex-end', gap: 4 },
  txDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
