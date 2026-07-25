import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDateTime, formatNaira } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { avatarColor, colors, fonts, initials, radius, spacing } from '@/theme/tokens';
import { AmountText, Button, Chip, Field, Screen, ScreenHeader } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

const QUICK_AMOUNTS = [1000, 5000, 10000, 20000];

function parseAmount(raw: string): number {
  const n = Number(raw.replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioDot} />}
    </View>
  );
}

export default function AddMoney() {
  const router = useRouter();
  const linkedAccounts = useStore((s) => s.linkedAccounts);
  const addMoney = useStore((s) => s.addMoney);

  const [amountStr, setAmountStr] = useState('');
  const [sourceId, setSourceId] = useState(linkedAccounts[0]?.id ?? '');
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ amount: number; source: string; at: string } | null>(null);

  const amount = parseAmount(amountStr);
  const source = linkedAccounts.find((a) => a.id === sourceId);

  const confirm = () => {
    if (amount <= 0) {
      setError('Enter a valid amount to add.');
      return;
    }
    if (!source) {
      setError('Select a funding source.');
      return;
    }
    setError('');
    const label = `${source.bank} •••• ${source.last4}`;
    addMoney(amount, label);
    setDone({ amount, source: label, at: new Date().toISOString() });
  };

  if (done) {
    return (
      <Screen scroll={false} padded={false}>
        <View style={styles.successWrap}>
          <View style={styles.successHalo}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={34} color={colors.onPrimary} />
            </View>
          </View>
          <Text style={styles.successTitle}>Money Added!</Text>
          <AmountText amount={done.amount} decimals={2} size={40} color={colors.primary} />
          <Text style={styles.successMeta}>added to your wallet</Text>
          <View style={styles.successChip}>
            <Text style={styles.successChipText}>From {done.source}</Text>
          </View>
          <Text style={styles.successDate}>{formatDateTime(done.at)}</Text>
        </View>
        <Button title="Done" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScreenHeader title="Add Money" />

      <Field
        label="Amount"
        placeholder="0.00"
        keyboardType="numeric"
        value={amountStr}
        onChangeText={(t) => { setAmountStr(t); setError(''); }}
        error={error || undefined}
        left={<Text style={styles.nairaPrefix}>₦</Text>}
      />

      <View style={styles.chipRow}>
        {QUICK_AMOUNTS.map((a) => (
          <Chip
            key={a}
            label={formatNaira(a)}
            selected={amount === a}
            onPress={() => { setAmountStr(String(a)); setError(''); }}
            style={styles.chip}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>Funding source</Text>
      {linkedAccounts.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => setSourceId(a.id)}
          style={({ pressed }) => [
            styles.sourceCard,
            sourceId === a.id && styles.sourceCardSelected,
            pressed && { opacity: 0.8 },
          ]}>
          <View style={[styles.bankTile, { backgroundColor: avatarColor(a.bank) }]}>
            <Text style={styles.bankTileText}>{initials(a.bank)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sourceTitle}>{a.bank} •••• {a.last4}</Text>
            <Text style={styles.sourceSub}>Instant bank funding</Text>
          </View>
          <Radio selected={sourceId === a.id} />
        </Pressable>
      ))}

      <Pressable
        onPress={() => router.push('/agent/scratch-card')}
        style={({ pressed }) => [styles.sourceCard, pressed && { opacity: 0.8 }]}>
        <IconBubble name="card" color={colors.primary} bg={colors.chip} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sourceTitle}>Scratch Card</Text>
          <Text style={styles.sourceSub}>Redeem a CirclePay savings card</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.faint} />
      </Pressable>

      <Pressable
        onPress={() => router.push('/agent')}
        style={({ pressed }) => [styles.sourceCard, pressed && { opacity: 0.8 }]}>
        <IconBubble name="location" color={colors.success} bg={colors.successBg} />
        <View style={{ flex: 1 }}>
          <Text style={styles.sourceTitle}>Agent Deposit</Text>
          <Text style={styles.sourceSub}>Pay cash at a nearby agent or kiosk</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.faint} />
      </Pressable>

      <View style={{ marginTop: spacing.xl }}>
        <Button
          title={amount > 0 ? `Add ${formatNaira(amount)}` : 'Add Money'}
          onPress={confirm}
          disabled={amount <= 0 || !source}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nairaPrefix: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: { paddingHorizontal: spacing.md },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: spacing.sm,
  },

  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sourceCardSelected: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  sourceTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  sourceSub: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  bankTile: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankTileText: { fontFamily: fonts.bold, fontSize: 13, color: colors.onPrimary },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  successMeta: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.sub, marginTop: spacing.sm },
  successChip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    marginTop: spacing.lg,
  },
  successChipText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink },
  successDate: { fontFamily: fonts.medium, fontSize: 12, color: colors.faint, marginTop: spacing.md },
});
