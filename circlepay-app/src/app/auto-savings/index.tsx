import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatNaira } from '@/lib/format';
import { planTypeMeta } from '@/lib/savings';
import type { SavingsPlan, SavingsPlanType } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Card, Chip, EmptyState, ListRow, Screen, ScreenHeader, SectionHeader, StatusPill } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

const FILTERS: { type: SavingsPlanType; label: string }[] = [
  { type: 'daily', label: 'Daily Savings' },
  { type: 'weekly', label: 'Weekly Contributions' },
  { type: 'instalment', label: 'Instalment Payments' },
];

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'barbell-outline', label: 'Builds financial discipline' },
  { icon: 'flag-outline', label: 'Helps you achieve goals faster' },
  { icon: 'notifications-off-outline', label: 'No need to remember' },
  { icon: 'shield-checkmark-outline', label: 'Secure & trustworthy' },
];

/** Outline glyph per plan type — the filled names live in `planTypeMeta`. */
const PLAN_ICONS: Record<SavingsPlanType, keyof typeof Ionicons.glyphMap> = {
  daily: 'wallet-outline',
  weekly: 'people-outline',
  instalment: 'cart-outline',
};

/** Accent colours per plan type, resolved from the shared token semantics. */
function accent(type: SavingsPlanType): { tint: string; bg: string } {
  const tint = planTypeMeta[type].tint;
  if (tint === 'success') return { tint: colors.success, bg: colors.successBg };
  if (tint === 'warning') return { tint: colors.warning, bg: colors.warningBg };
  return { tint: colors.primary, bg: colors.chip };
}

/** "daily" / "weekly" / "monthly" — sits next to the amount, as in the designs. */
function cadenceWord(f: SavingsPlan['frequency']): string {
  if (f === 'daily') return 'daily';
  return f === 'weekly' ? 'weekly' : 'monthly';
}

/** "Automatically deduct from your linked account every day" etc. */
function planSubtitle(plan: SavingsPlan): string {
  if (plan.type === 'daily') return 'Automatically deduct from your linked account every day.';
  if (plan.type === 'weekly') {
    return `Every ${new Date(plan.nextRunAt).toLocaleDateString(undefined, { weekday: 'long' })}`;
  }
  return `Next payment: ${formatDate(plan.nextRunAt)}`;
}

/** Status label for the row pill. */
function statusLabel(status: SavingsPlan['status']): string {
  if (status === 'active') return 'Active';
  if (status === 'paused') return 'Paused';
  return 'Done';
}

export default function AutoSavingsHub() {
  const router = useRouter();
  const plans = useStore((s) => s.savingsPlans);
  const [filter, setFilter] = useState<SavingsPlanType | null>('daily');

  const shown = filter ? plans.filter((p) => p.type === filter) : plans;

  return (
    <Screen>
      <ScreenHeader
        title="Automated Savings"
        right={
          <Pressable
            onPress={() => router.push('/auto-savings/history')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Savings history"
            style={({ pressed }) => [styles.historyBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="time-outline" size={15} color={colors.primary} />
            <Text style={styles.historyLabel}>History</Text>
          </Pressable>
        }
      />

      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>Save Automatically.{'\n'}Achieve Your Goals.</Text>
        <Text style={styles.heroBody}>
          Set it once, and let CirclePay handle the rest. Stay consistent and stress-free.
        </Text>
      </Card>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Chip
            key={f.type}
            label={f.label}
            selected={filter === f.type}
            onPress={() => setFilter((cur) => (cur === f.type ? null : f.type))}
            style={styles.filterChip}
          />
        ))}
      </View>

      <SectionHeader
        title="Active Plans"
        actionLabel={filter ? 'View all' : undefined}
        onAction={filter ? () => setFilter(null) : undefined}
      />

      {shown.length === 0 ? (
        <EmptyState
          icon="sync-circle-outline"
          title="No plans here yet"
          body="Create one below and CirclePay will handle the deductions for you."
        />
      ) : (
        shown.map((plan) => {
          const a = accent(plan.type);
          return (
            <Card key={plan.id} padded={false} style={styles.planCard}>
              <ListRow
                title={plan.name}
                // As drawn: amount + cadence on line 1, then the descriptive
                // copy, which itself wraps to two — hence a 3-line clamp.
                subtitle={`${formatNaira(plan.amount, 2)} ${cadenceWord(plan.frequency)}\n${planSubtitle(plan)}`}
                subtitleLines={3}
                left={<IconBubble name={PLAN_ICONS[plan.type]} color={a.tint} bg={a.bg} />}
                right={<StatusPill small label={statusLabel(plan.status)} />}
                chevron
                onPress={() => router.push(`/auto-savings/${plan.id}`)}
                style={styles.planRow}
              />
            </Card>
          );
        })
      )}

      <SectionHeader title="Create New Plan" />
      <View style={styles.createRow}>
        {FILTERS.map((f) => {
          const a = accent(f.type);
          return (
            <Pressable
              key={f.type}
              onPress={() => router.push(`/auto-savings/create?type=${f.type}`)}
              accessibilityRole="button"
              accessibilityLabel={`Create a ${planTypeMeta[f.type].label} plan`}
              style={({ pressed }) => [styles.createCard, { backgroundColor: a.bg }, pressed && { opacity: 0.8 }]}>
              <IconBubble name={PLAN_ICONS[f.type]} color={a.tint} bg={colors.card} />
              <Text style={[styles.createTitle, { color: a.tint }]}>{planTypeMeta[f.type].label}</Text>
              <Text style={styles.createBlurb}>{planTypeMeta[f.type].blurb}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.benefits}>
        <Text style={styles.benefitsTitle}>Automated Savings Benefits</Text>
        <View style={styles.benefitRow}>
          {BENEFITS.map((b) => (
            <View key={b.label} style={styles.benefit}>
              <Ionicons name={b.icon} size={20} color={colors.primary} />
              <Text style={styles.benefitLabel}>{b.label}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyLabel: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.primary },
  hero: { backgroundColor: colors.chip, borderColor: colors.chip },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.ink, lineHeight: 28 },
  heroBody: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub, lineHeight: 19, marginTop: spacing.sm },
  // One row of three, as drawn. `flexShrink` lets the widest label give way
  // on narrow screens instead of wrapping the third chip onto its own line.
  filters: { flexDirection: 'row', gap: 6, marginTop: spacing.lg },
  filterChip: { flex: 1, flexShrink: 1, paddingHorizontal: spacing.sm, justifyContent: 'center' },
  planCard: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  planRow: { paddingVertical: spacing.md },
  createRow: { flexDirection: 'row', gap: 6 },
  // Tight padding + 12px title so "Contribution" fits the column at 360px
  // instead of hard-breaking mid-word.
  createCard: { flex: 1, gap: 7, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radius.lg },
  createTitle: { fontFamily: fonts.bold, fontSize: 12 },
  createBlurb: { fontFamily: fonts.medium, fontSize: 11, color: colors.sub, lineHeight: 15 },
  benefits: { marginTop: spacing.xl, backgroundColor: colors.cardAlt },
  benefitsTitle: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink, marginBottom: spacing.lg },
  benefitRow: { flexDirection: 'row', gap: spacing.sm },
  benefit: { flex: 1, alignItems: 'center', gap: 7 },
  benefitLabel: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.sub, textAlign: 'center', lineHeight: 14 },
});
