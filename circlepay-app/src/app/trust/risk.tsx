import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatNaira } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Button, Card, Gauge, Screen, ScreenHeader, StatusPill } from '@/ui';

function riskLabel(score: number): string {
  if (score >= 65) return score >= 80 ? 'High Risk' : 'Moderate Risk';
  if (score >= 35) return 'Moderate Risk';
  return 'Low Risk';
}

interface ActionRow {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  confirmation: string;
}

const ACTIONS: ActionRow[] = [
  { id: 'notify', label: 'Notify the group', icon: 'megaphone-outline', confirmation: 'Group members have been notified.' },
  { id: 'backup', label: 'Trigger backup pool', icon: 'shield-checkmark-outline', confirmation: 'Backup pool queued to cover this cycle.' },
  { id: 'order', label: 'Adjust payout order', icon: 'swap-vertical-outline', confirmation: 'Payout order adjustment suggested to the group.' },
];

export default function RiskAlertsScreen() {
  const circles = useStore((s) => s.circles);
  const pushNotification = useStore((s) => s.pushNotification);

  // Live data: find the riskiest member across circles, fall back to design copy.
  const risky = useMemo(() => {
    for (const circle of circles) {
      const member =
        circle.members.find((m) => m.riskLevel === 'high') ??
        circle.members.find((m) => m.status === 'late');
      if (member) return { member, circle };
    }
    return null;
  }, [circles]);

  const memberName = risky?.member.name ?? 'Blessing A.';
  const riskScore = risky?.member.riskScore ?? 65;
  const circleName = risky?.circle.name ?? 'Family Esusu';
  const contribution = risky?.member.amount ?? 10000;
  const memberStatus = risky?.member.status ?? 'late';

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [doneActions, setDoneActions] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    toastOpacity.setValue(0);
    Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start(
        () => setToast(null)
      );
    }, 2400);
    return () => clearTimeout(t);
  }, [toast, toastOpacity]);

  const runAction = (action: ActionRow) => {
    if (!doneActions.includes(action.id)) {
      setDoneActions((prev) => [...prev, action.id]);
      if (action.id === 'notify') {
        pushNotification({
          type: 'alert',
          title: 'Risk Alert Shared',
          body: `${circleName}: ${memberName} flagged as high risk. Members have been notified.`,
        });
      }
    }
    setToast(action.confirmation);
  };

  return (
    <Screen>
      <ScreenHeader title="AI Risk & Alerts" />

      <Card style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <Ionicons name="warning" size={20} color={colors.danger} />
          <Text style={styles.alertTitle}>High Risk Alert</Text>
        </View>
        <Text style={styles.alertBody}>
          <Text style={styles.alertName}>{memberName}</Text> is at high risk of default based on
          payment behavior.
        </Text>
        <Button
          title={detailsOpen ? 'Hide Details' : 'View Details'}
          variant="ghost"
          small
          style={styles.alertBtn}
          onPress={() => setDetailsOpen((v) => !v)}
        />
        {detailsOpen && (
          <View style={styles.detailBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Member</Text>
              <Text style={styles.detailValue}>{memberName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Circle</Text>
              <Text style={styles.detailValue}>{circleName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contribution</Text>
              <Text style={styles.detailValue}>{formatNaira(contribution)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current status</Text>
              <StatusPill label={memberStatus === 'late' ? 'Late' : 'Pending'} small />
            </View>
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.cardTitle}>Risk Score</Text>
        <View style={styles.gaugeWrap}>
          <Gauge value={riskScore} max={100} size={200} mode="risk" label={riskLabel(riskScore)} />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.cardTitle}>AI Insights</Text>
        <View style={styles.insightRow}>
          <Ionicons name="alert-circle" size={20} color={colors.danger} />
          <Text style={styles.insightText}>2 late payments in the last 4 weeks</Text>
        </View>
        <View style={[styles.insightRow, styles.rowDivider]}>
          <Ionicons name="time" size={20} color={colors.warning} />
          <Text style={styles.insightText}>Reduced account balance pattern</Text>
        </View>
        <View style={[styles.insightRow, styles.rowDivider]}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <Text style={styles.insightText}>Probability of default: 68%</Text>
        </View>
        <Text style={styles.monitorNote}>AI will continue to monitor this member.</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.cardTitle}>Suggested actions</Text>
        {ACTIONS.map((action, i) => {
          const done = doneActions.includes(action.id);
          return (
            <Pressable
              key={action.id}
              onPress={() => runAction(action)}
              style={({ pressed }) => [
                styles.actionRow,
                i > 0 && styles.rowDivider,
                pressed && { opacity: 0.6 },
              ]}>
              <Ionicons
                name={done ? 'checkmark-circle' : action.icon}
                size={20}
                color={done ? colors.success : colors.primary}
              />
              <Text style={[styles.actionLabel, done && { color: colors.sub }]}>
                {action.label}
              </Text>
              {done ? (
                <StatusPill label="Done" tone="success" small />
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.faint} />
              )}
            </Pressable>
          );
        })}
      </Card>

      {!!toast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  alertCard: { backgroundColor: colors.dangerBg, borderColor: colors.dangerBg },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alertTitle: { fontFamily: fonts.extrabold, fontSize: 14.5, color: colors.danger },
  alertBody: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  alertName: { fontFamily: fonts.bold },
  alertBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    borderColor: colors.danger,
    backgroundColor: colors.card,
  },
  detailBox: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub },
  detailValue: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.ink },
  section: { marginTop: spacing.lg },
  cardTitle: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.ink, marginBottom: spacing.xs },
  gaugeWrap: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.xs },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  insightText: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  monitorNote: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.faint,
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  actionLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successBg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  toastText: { flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.success },
});
