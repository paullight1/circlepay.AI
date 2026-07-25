import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { confirm } from '@/lib/dialogs';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import { Avatar, Card, ListRow, Screen, SectionHeader, StatusPill } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

/** More tab — hub for everything not on the main tabs. */
export default function More() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const resetApp = useStore((s) => s.resetApp);

  return (
    <Screen>
      <Text style={styles.heading}>More</Text>

      <Card onPress={() => router.push('/trust/score')}>
        <View style={styles.profileRow}>
          <Avatar name={user.name} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.meta}>{user.circlePayId}</Text>
          </View>
          <StatusPill label={`Trust ${user.trustScore}`} tone="primary" />
        </View>
      </Card>

      <SectionHeader title="Money" />
      <Card padded={false} style={styles.group}>
        <ListRow title="Wallet" subtitle="Balances, add money, withdraw & transfer" chevron
          left={<IconBubble name="wallet-outline" />} onPress={() => router.push('/wallet')} />
        <ListRow title="Bills & Airtime" subtitle="Data, power, TV, betting, hotels & travel" chevron
          left={<IconBubble name="receipt-outline" color={colors.info} bg={colors.infoBg} />}
          onPress={() => router.push('/bills')} />
        <ListRow title="PartPay Installments" subtitle="Pay for services gradually" chevron
          left={<IconBubble name="calendar-outline" color={colors.warning} bg={colors.warningBg} />}
          onPress={() => router.push('/partpay')} />
        <ListRow title="Agent Banking" subtitle="Deposit, withdraw & scratch cards" chevron
          left={<IconBubble name="storefront-outline" color={colors.success} bg={colors.successBg} />}
          onPress={() => router.push('/agent')} />
      </Card>

      <SectionHeader title="AI & Security" />
      <Card padded={false} style={styles.group}>
        <ListRow title="Trust Score" subtitle="Your AI-powered financial reputation" chevron
          left={<IconBubble name="shield-checkmark-outline" />} onPress={() => router.push('/trust/score')} />
        <ListRow title="AI Risk & Alerts" subtitle="Risk monitoring across your circles" chevron
          left={<IconBubble name="pulse-outline" color={colors.danger} bg={colors.dangerBg} />}
          onPress={() => router.push('/trust/risk')} />
        <ListRow title="Notifications" subtitle="Alerts, payments & payout updates" chevron
          left={<IconBubble name="notifications-outline" color={colors.info} bg={colors.infoBg} />}
          onPress={() => router.push('/trust/notifications')} />
      </Card>

      <SectionHeader title="Account" />
      <Card padded={false} style={styles.group}>
        <ListRow title="Linked Bank Accounts" subtitle="Manage auto-deduction sources" chevron
          left={<IconBubble name="card-outline" />} onPress={() => router.push('/circles/link-bank')} />
        <ListRow
          title="Reset Demo Data"
          subtitle="Restore the app to its initial state"
          left={<IconBubble name="refresh-outline" color={colors.sub} bg={colors.cardAlt} />}
          onPress={() =>
            confirm('Reset demo data?', 'This restores all balances, circles and campaigns.', resetApp, 'Reset', true)
          }
        />
      </Card>

      <Text style={styles.footer}>CirclePay AI · Save Together. Pay Smart. Grow Better.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.ink, marginBottom: spacing.lg },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: colors.sub, marginTop: 2 },
  group: { paddingHorizontal: spacing.lg, paddingVertical: 4 },
  footer: {
    fontFamily: fonts.medium, fontSize: 11.5, color: colors.faint,
    textAlign: 'center', marginTop: spacing.xxl,
  },
});
