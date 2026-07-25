import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { formatNaira } from '@/lib/format';
import type { Circle, Frequency } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { AmountText, Button, Card, Chip, Field, Screen, ScreenHeader } from '@/ui';

const FREQUENCIES: Array<{ key: Frequency; label: string }> = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const MIN_MEMBERS = 2;
const MAX_MEMBERS = 30;

/** 08 · Create Circle. */
export default function CreateCircle() {
  const router = useRouter();
  const createCircle = useStore((s) => s.createCircle);

  const [name, setName] = useState('');
  const [memberCount, setMemberCount] = useState(10);
  const [amountText, setAmountText] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [nameError, setNameError] = useState<string | undefined>();
  const [amountError, setAmountError] = useState<string | undefined>();
  const [created, setCreated] = useState<Circle | null>(null);

  const amount = Number(amountText.replace(/[^\d]/g, '')) || 0;
  const pool = amount * memberCount;
  const backup = Math.round(pool * 0.1);

  const onCreate = () => {
    let ok = true;
    if (!name.trim()) {
      setNameError('Give your circle a name.');
      ok = false;
    }
    if (amount < 100) {
      setAmountError('Enter a contribution of at least ₦100.');
      ok = false;
    }
    if (!ok) return;
    const circle = createCircle({
      name: name.trim(),
      memberCount,
      amountPerMember: amount,
      frequency,
    });
    setCreated(circle);
  };

  const onShareInvite = (circle: Circle) => {
    Share.share({
      message: `Join my savings circle "${circle.name}" on CirclePay AI — ${formatNaira(circle.amountPerMember)} ${frequency}. Invite link: https://circlepay.ai/join/${circle.id}`,
    }).catch(() => {});
  };

  if (created) {
    return (
      <Screen>
        <ScreenHeader title="Create a Circle" noBack />
        <View style={styles.successWrap}>
          <View style={styles.successHalo}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={34} color={colors.onPrimary} />
            </View>
          </View>
          <Text style={styles.successTitle}>Circle Created!</Text>
          <Text style={styles.successBody}>
            {created.name} is ready — {memberCount} members · {formatNaira(amount)} {frequency}.
          </Text>

          <Card style={styles.inviteCard}>
            <View style={styles.inviteRow}>
              <Ionicons name="link-outline" size={18} color={colors.primary} />
              <Text style={styles.inviteTitle}>Invite your members</Text>
            </View>
            <Text style={styles.inviteBody}>
              Share your invite link so members can join. Payout order is assigned as each member joins.
            </Text>
            <Text style={styles.inviteLink}>circlepay.ai/join/{created.id}</Text>
          </Card>

          <Button
            title="Share Invite Link"
            variant="secondary"
            icon={<Ionicons name="share-social-outline" size={17} color={colors.primary} />}
            onPress={() => onShareInvite(created)}
            style={styles.successBtn}
          />
          <Button
            title="Go to Circle Dashboard"
            onPress={() => router.replace({ pathname: '/circles/[id]', params: { id: created.id } })}
            style={styles.successBtn}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Create a Circle" />

      <Field
        label="Circle name"
        placeholder="e.g. Family Esusu"
        value={name}
        error={nameError}
        onChangeText={(t) => {
          setName(t);
          if (nameError) setNameError(undefined);
        }}
      />

      {/* Member count stepper */}
      <Text style={styles.stepperLabel}>Members</Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => setMemberCount((n) => Math.max(MIN_MEMBERS, n - 1))}
          disabled={memberCount <= MIN_MEMBERS}
          style={({ pressed }) => [
            styles.stepBtn,
            memberCount <= MIN_MEMBERS && styles.stepBtnDisabled,
            pressed && { opacity: 0.7 },
          ]}>
          <Ionicons name="remove" size={20} color={memberCount <= MIN_MEMBERS ? colors.faint : colors.primary} />
        </Pressable>
        <View style={styles.stepValueBox}>
          <Text style={styles.stepValue}>{memberCount}</Text>
          <Text style={styles.stepValueSub}>members</Text>
        </View>
        <Pressable
          onPress={() => setMemberCount((n) => Math.min(MAX_MEMBERS, n + 1))}
          disabled={memberCount >= MAX_MEMBERS}
          style={({ pressed }) => [
            styles.stepBtn,
            memberCount >= MAX_MEMBERS && styles.stepBtnDisabled,
            pressed && { opacity: 0.7 },
          ]}>
          <Ionicons name="add" size={20} color={memberCount >= MAX_MEMBERS ? colors.faint : colors.primary} />
        </Pressable>
      </View>

      <Field
        label="Contribution amount"
        placeholder="10,000"
        keyboardType="number-pad"
        value={amountText}
        error={amountError}
        left={<Text style={styles.nairaPrefix}>₦</Text>}
        onChangeText={(t) => {
          setAmountText(t);
          if (amountError) setAmountError(undefined);
        }}
      />

      <Text style={styles.stepperLabel}>Frequency</Text>
      <View style={styles.freqRow}>
        {FREQUENCIES.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            selected={frequency === f.key}
            onPress={() => setFrequency(f.key)}
            style={styles.freqChip}
          />
        ))}
      </View>

      {/* Payout order info */}
      <Card style={styles.infoCard}>
        <Ionicons name="swap-vertical-outline" size={20} color={colors.primary} />
        <View style={styles.infoBody}>
          <Text style={styles.infoTitle}>Payout order is set when members join</Text>
          <Text style={styles.infoText}>AI optimises the rotation using each member&apos;s trust score.</Text>
        </View>
      </Card>

      {/* Backup pool info */}
      <Card style={[styles.infoCard, { backgroundColor: colors.chip, borderColor: colors.chip }]}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        <View style={styles.infoBody}>
          <Text style={styles.infoTitle}>Backup pool protection</Text>
          <Text style={styles.infoText}>10% of contributions protect payouts if a member defaults.</Text>
        </View>
      </Card>

      {/* Rules summary */}
      <Card style={styles.rulesCard}>
        <Text style={styles.rulesTitle}>Circle rules</Text>
        <View style={styles.ruleRow}>
          <Text style={styles.ruleLabel}>Each member contributes</Text>
          <AmountText amount={amount} size={13.5} />
        </View>
        <View style={styles.ruleRow}>
          <Text style={styles.ruleLabel}>Pool per cycle ({memberCount} members)</Text>
          <AmountText amount={pool} size={13.5} color={colors.primary} />
        </View>
        <View style={styles.ruleRow}>
          <Text style={styles.ruleLabel}>Backup pool (10%)</Text>
          <AmountText amount={backup} size={13.5} />
        </View>
        <View style={[styles.ruleRow, styles.ruleRowLast]}>
          <Text style={styles.ruleLabel}>Receiver gets each {frequency === 'daily' ? 'day' : frequency === 'weekly' ? 'week' : 'month'}</Text>
          <AmountText amount={pool - backup} size={13.5} color={colors.success} />
        </View>
      </Card>

      <Button title="Create Circle" onPress={onCreate} style={styles.createBtn} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepperLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, marginBottom: 7 },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.5 },
  stepValueBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  stepValue: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  stepValueSub: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.sub },
  nairaPrefix: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  freqRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  freqChip: { flex: 1, justifyContent: 'center' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  infoBody: { flex: 1 },
  infoTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  infoText: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2, lineHeight: 16 },
  rulesCard: { marginBottom: spacing.xl },
  rulesTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, marginBottom: spacing.sm },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ruleRowLast: { borderBottomWidth: 0 },
  ruleLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub, flex: 1, marginRight: spacing.sm },
  createBtn: { marginBottom: spacing.lg },

  // Success state
  successWrap: { alignItems: 'center', paddingTop: spacing.xxl },
  successHalo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.ink },
  successBody: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.sub,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: spacing.xl,
    lineHeight: 19,
  },
  inviteCard: { alignSelf: 'stretch', marginBottom: spacing.lg },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  inviteTitle: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
  inviteBody: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, lineHeight: 17 },
  inviteLink: {
    fontFamily: fonts.mono,
    fontSize: 12.5,
    color: colors.primary,
    marginTop: spacing.sm,
    backgroundColor: colors.chip,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  successBtn: { alignSelf: 'stretch', marginBottom: spacing.md },
});
