import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatDate } from '@/lib/format';
import type { Transaction } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import {
  AmountText, Card, Chip, EmptyState, ListRow, Screen, ScreenHeader, StatusPill,
} from '@/ui';
import { IconBubble } from '@/ui/ListRow';

type Filter = 'all' | 'in' | 'out';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in', label: 'In' },
  { key: 'out', label: 'Out' },
];

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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

export default function Transactions() {
  const transactions = useStore((s) => s.transactions);
  const [filter, setFilter] = useState<Filter>('all');

  const groups = useMemo(() => {
    const filtered = transactions
      .filter((t) => filter === 'all' || t.direction === filter)
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const out: { label: string; items: Transaction[] }[] = [];
    for (const t of filtered) {
      const label = dayLabel(t.date);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(t);
      else out.push({ label, items: [t] });
    }
    return out;
  }, [transactions, filter]);

  return (
    <Screen padded={false}>
      <ScreenHeader title="Transactions" />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
            style={styles.filterChip}
          />
        ))}
      </View>

      {groups.length === 0 && (
        <EmptyState
          icon="receipt-outline"
          title="No transactions yet"
          body="Money you add, withdraw or transfer will show up here."
        />
      )}

      {groups.map((g) => (
        <View key={g.label}>
          <Text style={styles.dayLabel}>{g.label}</Text>
          <Card padded={false} style={styles.dayCard}>
            {g.items.map((t, i, arr) => {
              const incoming = t.direction === 'in';
              return (
                <ListRow
                  key={t.id}
                  title={t.title}
                  subtitle={`${t.subtitle ?? cap(t.category)} · ${timeOf(t.date)}`}
                  left={
                    <IconBubble
                      name={incoming ? 'arrow-down' : 'arrow-up'}
                      color={incoming ? colors.success : colors.primary}
                      bg={incoming ? colors.successBg : colors.chip}
                    />
                  }
                  right={
                    <View style={styles.txRight}>
                      <AmountText amount={t.amount} signed={t.direction} size={14} />
                      <StatusPill small label={cap(t.status)} />
                    </View>
                  }
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
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  filterChip: { paddingHorizontal: spacing.xl, paddingVertical: 8 },
  dayLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.sub,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  dayCard: { paddingHorizontal: spacing.lg },
  txRight: { alignItems: 'flex-end', gap: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
