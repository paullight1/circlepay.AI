import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import { Card, Gauge, Screen, ScreenHeader, StatusPill } from '@/ui';

const MAX_SCORE = 850;

function scoreLabel(score: number): string {
  if (score >= 750) return 'Excellent';
  if (score >= 650) return 'Good';
  if (score >= 500) return 'Fair';
  return 'Building';
}

interface Perk {
  id: string;
  label: string;
  detail: string;
  threshold: number;
}

const PERKS: Perk[] = [
  { id: 'loans', label: 'Micro-loans', detail: 'Requires score 700+', threshold: 700 },
  { id: 'payouts', label: 'Early payouts', detail: 'Requires score 650+', threshold: 650 },
  { id: 'upfront', label: 'PartPay upfront model', detail: 'Requires score 600+', threshold: 600 },
];

export default function TrustScoreScreen() {
  const user = useStore((s) => s.user);
  const trustSignals = useStore((s) => s.trustSignals);

  return (
    <Screen>
      <ScreenHeader title="Your Trust Score" />

      <Card style={styles.gaugeCard}>
        <Gauge
          value={user.trustScore}
          max={MAX_SCORE}
          size={220}
          mode="score"
          label={scoreLabel(user.trustScore)}
        />
        <Text style={styles.scale}>300 · poor → excellent · 850</Text>
        <Text style={styles.heading}>Your AI Trust Score</Text>
        <Text style={styles.explainer}>
          Your score reflects how reliably you save, contribute and repay across
          CirclePay. A higher score unlocks better limits and features.
        </Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.cardTitle}>What builds your score</Text>
        {trustSignals.map((sig, i) => (
          <View key={sig.id} style={[styles.row, i > 0 && styles.rowDivider]}>
            <Ionicons
              name={sig.positive ? 'checkmark-circle' : 'alert-circle'}
              size={22}
              color={sig.positive ? colors.success : colors.warning}
            />
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>{sig.label}</Text>
              <Text style={styles.rowDetail}>{sig.detail}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.cardTitle}>What your score unlocks</Text>
        {PERKS.map((perk, i) => {
          const unlocked = user.trustScore >= perk.threshold;
          return (
            <View key={perk.id} style={[styles.row, i > 0 && styles.rowDivider]}>
              <Ionicons
                name={unlocked ? 'lock-open' : 'lock-closed'}
                size={20}
                color={unlocked ? colors.success : colors.faint}
              />
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{perk.label}</Text>
                <Text style={styles.rowDetail}>{perk.detail}</Text>
              </View>
              <StatusPill
                label={unlocked ? 'Unlocked' : 'Locked'}
                tone={unlocked ? 'success' : 'neutral'}
                small
              />
            </View>
          );
        })}
      </Card>

      <Text style={styles.footerNote}>
        AI analyzes your behavior across circles, payments and campaigns. Updated weekly.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gaugeCard: { alignItems: 'center' },
  scale: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.faint,
    marginTop: spacing.sm,
  },
  heading: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    color: colors.ink,
    marginTop: spacing.lg,
  },
  explainer: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.sub,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  section: { marginTop: spacing.lg },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  rowBody: { flex: 1 },
  rowLabel: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  rowDetail: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  footerNote: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.faint,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
