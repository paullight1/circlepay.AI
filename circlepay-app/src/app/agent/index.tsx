import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/tokens';
import { AmountText, Card, Screen, ScreenHeader, SectionHeader, Stepper } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

interface Service {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  label: string;
  caption: string;
  route: string;
}

const SERVICES: Service[] = [
  {
    id: 'deposit', icon: 'arrow-down', color: colors.success, bg: colors.successBg,
    label: 'Cash Deposit', caption: 'Fund your wallet with cash', route: '/agent/find',
  },
  {
    id: 'withdraw', icon: 'arrow-up', color: colors.danger, bg: colors.dangerBg,
    label: 'Cash Withdrawal', caption: 'Collect cash at a kiosk', route: '/agent/withdraw',
  },
  {
    id: 'buy-card', icon: 'card', color: colors.primary, bg: colors.chip,
    label: 'Buy Scratch Card', caption: 'Savings cards from agents', route: '/agent/find',
  },
  {
    id: 'redeem-card', icon: 'ticket', color: colors.primary, bg: colors.chip,
    label: 'Redeem Scratch Card', caption: 'Enter a serial to top up', route: '/agent/scratch-card',
  },
  {
    id: 'transfer', icon: 'swap-horizontal', color: colors.info, bg: colors.infoBg,
    label: 'Transfer to User', caption: 'Send money to anyone', route: '/wallet/transfer',
  },
  {
    id: 'history', icon: 'time', color: colors.warning, bg: colors.warningBg,
    label: 'View Transactions', caption: 'Your agent activity', route: '/wallet/transactions',
  },
];

const HOW_IT_WORKS = [
  { title: 'Visit any CirclePay agent', body: 'Kiosks, stores and mobile agents near you all accept CirclePay.' },
  { title: 'Share your CirclePay ID', body: 'It works like an account number — no card or bank details needed.' },
  { title: 'Agent processes your request', body: 'Deposit, withdrawal, scratch cards and more, handled in minutes.' },
  { title: 'Wallet updates instantly', body: 'You get a notification and a receipt in your transaction history.' },
];

export default function AgentBankingHomeScreen() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const available = useStore((s) => s.wallet.available);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const onCopy = () => {
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Screen>
      <ScreenHeader title="Agent Banking" />

      {/* CirclePay ID card */}
      <LinearGradient
        colors={gradients.balance}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.idCard}>
        <View style={styles.idDecor} />
        <Text style={styles.idLabel}>Your CirclePay ID</Text>
        <View style={styles.idRow}>
          <Text style={styles.idValue}>{user.circlePayId}</Text>
          <Pressable onPress={onCopy} hitSlop={10} style={styles.copyBtn}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={colors.onPrimary} />
          </Pressable>
          {copied && <Text style={styles.copied}>Copied!</Text>}
        </View>
        <Text style={styles.idHint}>Works like an account number at any agent</Text>
        <View style={styles.idDivider} />
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Wallet balance (available)</Text>
          <AmountText amount={available} decimals={2} size={18} color={colors.onPrimary} />
        </View>
      </LinearGradient>

      {/* Find an agent */}
      <Card style={styles.findCard} onPress={() => router.push('/agent/find')}>
        <IconBubble name="location" size={44} />
        <View style={styles.findBody}>
          <Text style={styles.findTitle}>Find an Agent</Text>
          <Text style={styles.findCaption}>Locate nearby agents & kiosks</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      </Card>

      {/* Services */}
      <SectionHeader title="Agent Services" />
      <View style={styles.grid}>
        {SERVICES.map((svc) => (
          <Pressable
            key={svc.id}
            onPress={() => router.push(svc.route as never)}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.75 }]}>
            <IconBubble name={svc.icon} color={svc.color} bg={svc.bg} size={44} />
            <Text style={styles.tileLabel}>{svc.label}</Text>
            <Text style={styles.tileCaption}>{svc.caption}</Text>
          </Pressable>
        ))}
      </View>

      {/* How agents work */}
      <SectionHeader title="How agents work" />
      <Card>
        <Stepper steps={HOW_IT_WORKS} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  idCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  idDecor: {
    position: 'absolute',
    top: -34,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  idLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onPrimaryDim, letterSpacing: 0.6, textTransform: 'uppercase' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 6 },
  idValue: { fontFamily: fonts.mono, fontSize: 23, color: colors.onPrimary, letterSpacing: 1 },
  copyBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  copied: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onPrimary },
  idHint: { fontFamily: fonts.medium, fontSize: 12, color: colors.onPrimaryDim, marginTop: 6 },
  idDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: spacing.lg },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.onPrimaryDim },

  findCard: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  findBody: { flex: 1 },
  findTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  findCaption: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '47.8%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 4,
  },
  tileLabel: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink, marginTop: spacing.sm },
  tileCaption: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, lineHeight: 15 },
});
