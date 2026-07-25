import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { confirm, notify } from '@/lib/dialogs';
import { formatNaira } from '@/lib/format';
import type { Donation } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Avatar, Button, Card, Chip, EmptyState, Field, Screen, ScreenHeader, Stepper } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

const AMOUNTS = [1000, 2000, 5000, 10000, 20000];

type Method = Donation['method'];

const AGENT_STEPS = [
  { title: 'Tell the agent the campaign name or ID' },
  { title: 'Make your cash contribution' },
  { title: 'Agent credits donation instantly' },
  { title: 'You get a receipt instantly' },
];

/** Screen 20 — Donate to Campaign. */
export default function Donate() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaign = useStore((s) => s.campaigns.find((c) => c.id === id));
  const available = useStore((s) => s.wallet.available);
  const donate = useStore((s) => s.donate);

  const [selected, setSelected] = useState<number | 'other' | null>(5000);
  const [custom, setCustom] = useState('');
  const [method, setMethod] = useState<Method>('wallet');
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (!campaign) {
    return (
      <Screen>
        <ScreenHeader title="Donate to Campaign" />
        <EmptyState icon="heart-outline" title="Campaign not found" body="This campaign may have ended or been removed." />
      </Screen>
    );
  }

  const METHODS: Array<{ key: Method; icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }> = [
    { key: 'wallet', icon: 'wallet-outline', title: 'CirclePay Wallet', sub: `Balance: ${formatNaira(available, 2)}` },
    { key: 'transfer', icon: 'card-outline', title: 'Bank Transfer / Card', sub: 'Pay securely via bank or card' },
    { key: 'ussd', icon: 'keypad-outline', title: 'USSD', sub: '*USSD instant payment' },
    { key: 'agent', icon: 'location-outline', title: 'Agent Cash Deposit', sub: 'Pay cash at any agent/kiosk' },
  ];

  const amount = selected === 'other' ? Number(custom.replace(/[^0-9]/g, '')) : selected ?? 0;
  const methodTitle = METHODS.find((m) => m.key === method)!.title;

  const confirmDonation = () => {
    if (!amount || amount <= 0) {
      setError('Select or enter a donation amount.');
      return;
    }
    setError(undefined);
    if (method === 'wallet' && amount > available) {
      notify(
        'Insufficient balance',
        `Your wallet balance is ${formatNaira(available, 2)}. Choose a smaller amount or another payment method.`
      );
      return;
    }
    confirm(
      'Confirm Donation',
      `Donate ${formatNaira(amount)} to "${campaign.title}" via ${methodTitle}${anonymous ? ' (anonymously)' : ''}?`,
      () => {
        const ok = donate(campaign.id, amount, method, anonymous ? 'Anonymous' : undefined);
        if (!ok) {
          notify('Donation failed', 'We could not complete this donation. Please try again.');
          return;
        }
        router.replace({
          pathname: '/campaigns/[id]/receipt',
          params: { id: campaign.id, amount: String(amount), method: methodTitle },
        });
      },
      'Donate'
    );
  };

  return (
    <Screen>
      <ScreenHeader title="Donate to Campaign" />

      {/* Campaign mini header */}
      <Card style={styles.miniHeader}>
        <Avatar name={campaign.organizer} size={40} />
        <View style={styles.miniBody}>
          <Text style={styles.miniTitle} numberOfLines={1}>{campaign.title}</Text>
          <Text style={styles.miniBy}>by {campaign.organizer}</Text>
        </View>
      </Card>

      {/* Amount */}
      <Text style={styles.sectionLabel}>Select Amount</Text>
      <View style={styles.amountGrid}>
        {AMOUNTS.map((a) => (
          <Chip
            key={a}
            label={formatNaira(a)}
            selected={selected === a}
            onPress={() => { setSelected(a); setError(undefined); }}
            style={styles.amountChip}
          />
        ))}
        <Chip
          label="Other"
          selected={selected === 'other'}
          onPress={() => setSelected('other')}
          style={styles.amountChip}
        />
      </View>
      {selected === 'other' && (
        <Field
          label="Custom amount"
          placeholder="3,500"
          keyboardType="number-pad"
          value={custom}
          onChangeText={(t) => { setCustom(t); setError(undefined); }}
          left={<Text style={styles.naira}>₦</Text>}
        />
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {/* Payment method */}
      <Text style={styles.sectionLabel}>Payment Method</Text>
      <View style={styles.methods}>
        {METHODS.map((m) => {
          const on = method === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMethod(m.key)}
              style={({ pressed }) => [styles.methodCard, on && styles.methodOn, pressed && { opacity: 0.85 }]}>
              <IconBubble name={m.icon} size={38} />
              <View style={styles.methodBody}>
                <Text style={styles.methodTitle}>{m.title}</Text>
                <Text style={styles.methodSub}>{m.sub}</Text>
              </View>
              <View style={[styles.radio, on && styles.radioOn]}>
                {on && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Agent cash deposit — how it works */}
      {method === 'agent' && (
        <Card style={styles.agentCard}>
          <Text style={styles.agentTitle}>How Agent Cash Deposit works</Text>
          <Stepper steps={AGENT_STEPS} />
          <Pressable
            onPress={() => router.push('/agent/find')}
            hitSlop={6}
            style={({ pressed }) => [styles.agentLink, pressed && { opacity: 0.6 }]}>
            <Ionicons name="location" size={15} color={colors.primary} />
            <Text style={styles.agentLinkText}>Find Nearby Agents</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </Pressable>
        </Card>
      )}

      {/* Anonymous toggle */}
      <Card style={styles.anonRow}>
        <View style={styles.anonBody}>
          <Text style={styles.anonTitle}>Donate anonymously</Text>
          <Text style={styles.anonSub}>Your name won't be shown to other supporters</Text>
        </View>
        <Switch
          value={anonymous}
          onValueChange={setAnonymous}
          trackColor={{ false: colors.borderStrong, true: colors.primary }}
          thumbColor={colors.onPrimary}
        />
      </Card>

      <Button title="Continue" onPress={confirmDonation} style={styles.continueBtn} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  miniHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  miniBody: { flex: 1 },
  miniTitle: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.ink },
  miniBy: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  sectionLabel: {
    fontFamily: fonts.bold, fontSize: 14.5, color: colors.ink,
    marginTop: spacing.xl, marginBottom: spacing.md,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  amountChip: { flexBasis: '30%', flexGrow: 1, justifyContent: 'center' },
  naira: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger, marginBottom: spacing.sm },
  methods: { gap: spacing.sm },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  methodOn: { borderWidth: 2, borderColor: colors.primary },
  methodBody: { flex: 1 },
  methodTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  methodSub: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: colors.primary },
  agentCard: { marginTop: spacing.md },
  agentTitle: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink, marginBottom: spacing.md },
  agentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  agentLinkText: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  anonRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  anonBody: { flex: 1 },
  anonTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  anonSub: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  continueBtn: { marginTop: spacing.xl },
});
