import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BILL_CATEGORIES, getCategory } from '@/lib/billers';
import { timeAgo } from '@/lib/format';
import type { BillPayment } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/tokens';
import {
  AmountText, Card, EmptyState, ListRow, Screen, ScreenHeader, SectionHeader, StatusPill,
} from '@/ui';
import { IconBubble } from '@/ui/ListRow';

/** Recent bill row — reuses the paying category's icon and colour. */
function BillRow({ bill, last, onPress }: { bill: BillPayment; last: boolean; onPress: () => void }) {
  const category = getCategory(bill.categoryId);
  return (
    <ListRow
      title={bill.billerName}
      subtitle={`${bill.planLabel ?? bill.categoryLabel} · ${timeAgo(bill.date)}`}
      left={
        <IconBubble
          name={category?.icon ?? 'receipt'}
          color={category?.color ?? colors.primary}
          bg={category?.bg ?? colors.chip}
        />
      }
      right={
        <View style={styles.rowRight}>
          <AmountText amount={bill.amount + bill.fee} size={14} />
          <StatusPill small label={bill.status === 'success' ? 'Success' : bill.status === 'pending' ? 'Pending' : 'Failed'} />
        </View>
      }
      onPress={onPress}
      style={!last ? styles.divider : undefined}
    />
  );
}

export default function BillsHome() {
  const router = useRouter();
  const available = useStore((s) => s.wallet.available);
  const bills = useStore((s) => s.bills);
  const recent = bills.slice(0, 5);

  return (
    <Screen>
      <ScreenHeader
        title="Bills & Payments"
        right={
          <Pressable
            onPress={() => router.push('/bills/history')}
            hitSlop={10}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="time-outline" size={19} color={colors.ink} />
          </Pressable>
        }
      />

      {/* Balance strip */}
      <LinearGradient
        colors={gradients.balance}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balance}>
        <View style={{ flex: 1 }}>
          <Text style={styles.balanceLabel}>Available to spend</Text>
          <AmountText amount={available} decimals={2} size={24} color={colors.onPrimary} />
        </View>
        <Pressable
          onPress={() => router.push('/wallet/add-money')}
          style={({ pressed }) => [styles.topUp, pressed && { opacity: 0.8 }]}>
          <Ionicons name="add" size={15} color={colors.onPrimary} />
          <Text style={styles.topUpLabel}>Top up</Text>
        </Pressable>
      </LinearGradient>

      {/* Category grid */}
      <SectionHeader title="What are you paying for?" />
      <View style={styles.grid}>
        {BILL_CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => router.push(c.route as never)}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.75 }]}>
            <IconBubble name={c.icon} color={c.color} bg={c.bg} size={42} />
            <Text style={styles.tileLabel}>{c.label}</Text>
            <Text style={styles.tileCaption} numberOfLines={2}>{c.caption}</Text>
          </Pressable>
        ))}
      </View>

      {/* Agent banner */}
      <Pressable
        onPress={() => router.push('/agent/find')}
        style={({ pressed }) => [styles.agentBanner, pressed && { opacity: 0.85 }]}>
        <IconBubble name="storefront" color={colors.primary} bg={colors.card} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={styles.agentTitle}>No data? Pay at a kiosk</Text>
          <Text style={styles.agentBody}>
            Generate a code at checkout and any CirclePay agent will settle the bill for you.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>

      {/* Recent */}
      <SectionHeader
        title="Recent bills"
        actionLabel={bills.length > recent.length ? 'See all' : undefined}
        onAction={() => router.push('/bills/history')}
      />
      {recent.length === 0 ? (
        <Card>
          <EmptyState
            icon="receipt-outline"
            title="No bills yet"
            body="Airtime, data, electricity and everything else you pay for will show up here."
          />
        </Card>
      ) : (
        <Card padded={false} style={styles.listCard}>
          {recent.map((b, i, arr) => (
            <BillRow
              key={b.id}
              bill={b}
              last={i === arr.length - 1}
              onPress={() => router.push({ pathname: '/bills/receipt', params: { id: b.id } })}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },

  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  balanceLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.onPrimaryDim, marginBottom: 3 },
  topUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  topUpLabel: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.onPrimary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '31.5%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  tileLabel: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.ink, marginTop: 6 },
  tileCaption: {
    fontFamily: fonts.medium, fontSize: 10, color: colors.sub,
    textAlign: 'center', lineHeight: 13,
  },

  agentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.chip,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  agentTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.primaryDark },
  agentBody: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.primaryDark, marginTop: 3, lineHeight: 16 },

  listCard: { paddingHorizontal: spacing.lg },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
