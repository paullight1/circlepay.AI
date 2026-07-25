import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BILL_CATEGORIES, getCategory } from '@/lib/billers';
import { formatDate } from '@/lib/format';
import type { BillPayment } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import {
  AmountText, Card, Chip, EmptyState, ListRow, Screen, ScreenHeader, StatusPill,
} from '@/ui';
import { IconBubble } from '@/ui/ListRow';

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return formatDate(iso);
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function statusLabel(status: BillPayment['status']): string {
  return status === 'success' ? 'Success' : status === 'pending' ? 'Pending' : 'Failed';
}

export default function BillHistory() {
  const router = useRouter();
  const bills = useStore((s) => s.bills);
  const [filter, setFilter] = useState<string>('all');

  const groups = useMemo(() => {
    const filtered = bills
      .filter((b) => filter === 'all' || b.categoryId === filter)
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const out: { label: string; items: BillPayment[] }[] = [];
    for (const b of filtered) {
      const label = dayLabel(b.date);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(b);
      else out.push({ label, items: [b] });
    }
    return out;
  }, [bills, filter]);

  return (
    <Screen padded={false}>
      <ScreenHeader title="Bill History" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        {BILL_CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            selected={filter === c.id}
            onPress={() => setFilter(c.id)}
          />
        ))}
      </ScrollView>

      {groups.length === 0 && (
        <EmptyState
          icon="receipt-outline"
          title="Nothing here yet"
          body={
            filter === 'all'
              ? 'Bills you pay will be listed here with their receipts.'
              : 'No payments in this category yet.'
          }
        />
      )}

      {groups.map((g) => (
        <View key={g.label}>
          <Text style={styles.dayLabel}>{g.label}</Text>
          <Card padded={false} style={styles.dayCard}>
            {g.items.map((b, i, arr) => {
              const category = getCategory(b.categoryId);
              return (
                <ListRow
                  key={b.id}
                  title={b.billerName}
                  subtitle={`${b.planLabel ?? b.customerRef} · ${timeOf(b.date)}`}
                  left={
                    <IconBubble
                      name={category?.icon ?? 'receipt'}
                      color={category?.color ?? colors.primary}
                      bg={category?.bg ?? colors.chip}
                    />
                  }
                  right={
                    <View style={styles.rowRight}>
                      <AmountText amount={b.amount + b.fee} size={14} />
                      <StatusPill small label={statusLabel(b.status)} />
                    </View>
                  }
                  onPress={() => router.push({ pathname: '/bills/receipt', params: { id: b.id } })}
                  style={i < arr.length - 1 ? styles.divider : undefined}
                />
              );
            })}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.xs },
  dayLabel: {
    fontFamily: fonts.bold, fontSize: 13, color: colors.sub,
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  dayCard: { paddingHorizontal: spacing.lg },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
