import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { timeAgo } from '@/lib/format';
import type { Transaction } from '@/store/types';
import { useStore } from '@/store/useStore';
import { avatarColor, colors, fonts, initials, radius, spacing } from '@/theme/tokens';
import {
  AmountText, Card, ListRow, Screen, ScreenHeader, SectionHeader, StatusPill,
} from '@/ui';
import { IconBubble } from '@/ui/ListRow';

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function QuickAction({
  icon, label, onPress,
}: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}>
      <View style={styles.quickChip}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
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
      style={!last ? styles.divider : undefined}
    />
  );
}

export default function WalletHome() {
  const router = useRouter();
  const wallet = useStore((s) => s.wallet);
  const linkedAccounts = useStore((s) => s.linkedAccounts);
  const transactions = useStore((s) => s.transactions);

  const total = wallet.available + wallet.onHold;

  return (
    <Screen padded={false}>
      <ScreenHeader title="My Wallet" />

      {/* Dark balance summary card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Wallet Balance</Text>
        <AmountText amount={total} decimals={2} size={33} color={colors.onPrimary} />
        <View style={styles.insetRow}>
          <View style={styles.insetTile}>
            <Text style={styles.insetLabel}>Available</Text>
            <AmountText amount={wallet.available} decimals={2} size={15} color={colors.onPrimary} />
          </View>
          <View style={styles.insetTile}>
            <Text style={styles.insetLabel}>Savings</Text>
            <AmountText amount={wallet.savings} decimals={2} size={15} color={colors.onPrimary} />
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <QuickAction icon="add" label="Add Money" onPress={() => router.push('/wallet/add-money')} />
        <QuickAction icon="arrow-up" label="Withdraw" onPress={() => router.push('/wallet/withdraw')} />
        <QuickAction icon="swap-horizontal" label="Transfer" onPress={() => router.push('/wallet/transfer')} />
        <QuickAction icon="scan" label="Scan & Pay" onPress={() => router.push('/scan')} />
      </View>

      {/* Linked accounts */}
      <SectionHeader title="Linked Accounts" />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        {linkedAccounts.map((a, i, arr) => (
          <ListRow
            key={a.id}
            title={`${a.bank} •••• ${a.last4}`}
            subtitle={a.purpose ?? 'Linked bank account'}
            left={
              <View style={[styles.bankTile, { backgroundColor: avatarColor(a.bank) }]}>
                <Text style={styles.bankTileText}>{initials(a.bank)}</Text>
              </View>
            }
            right={<StatusPill small label={a.active ? 'Active' : 'Inactive'} />}
            style={i < arr.length - 1 ? styles.divider : undefined}
          />
        ))}
      </Card>

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  balanceLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.onPrimaryDim,
    marginBottom: spacing.sm,
  },
  insetRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  insetTile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  insetLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.onPrimaryDim,
    marginBottom: 4,
  },

  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  quickAction: { flex: 1, alignItems: 'center', gap: 7 },
  quickChip: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink },

  bankTile: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankTileText: { fontFamily: fonts.bold, fontSize: 13, color: colors.onPrimary },

  txRight: { alignItems: 'flex-end', gap: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
