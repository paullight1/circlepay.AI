import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import { avatarColor, colors, fonts, radius, spacing } from '@/theme/tokens';
import { Button, Card, ListRow, Screen, ScreenHeader } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

const BANKS = ['GTBank', 'Access Bank', 'First Bank', 'Zenith Bank', 'Opay'];

/** 09 · Link Bank Account — simulated Open Banking OAuth. */
export default function LinkBank() {
  const router = useRouter();
  const linkAccount = useStore((s) => s.linkAccount);
  const linkedAccounts = useStore((s) => s.linkedAccounts);

  const [linking, setLinking] = useState<string | null>(null);
  const [linkedBank, setLinkedBank] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const startLink = (bank: string) => {
    if (linking) return;
    setLinkedBank(null);
    setLinking(bank);
    // Simulated OAuth handshake with the bank.
    timer.current = setTimeout(() => {
      linkAccount(bank);
      setLinking(null);
      setLinkedBank(bank);
    }, 1400);
  };

  const newest = [...linkedAccounts].reverse().find((a) => a.bank === linkedBank);

  return (
    <Screen>
      <ScreenHeader title="Link Bank Account" />
      <Text style={styles.intro}>Securely link your bank account for automated deductions.</Text>

      {linkedBank && (
        <Card style={styles.successCard}>
          <View style={styles.successCheck}>
            <Ionicons name="checkmark" size={22} color={colors.onPrimary} />
          </View>
          <View style={styles.successBody}>
            <Text style={styles.successTitle}>Account linked</Text>
            <Text style={styles.successText}>
              {linkedBank} •••• {newest?.last4 ?? '••••'} will fund your circle contributions automatically.
            </Text>
          </View>
        </Card>
      )}

      <View style={styles.list}>
        {BANKS.map((bank) => (
          <Card key={bank} padded={false} style={styles.bankCard}>
            <ListRow
              title={bank}
              subtitle={linking === bank ? 'Connecting securely…' : 'Instant link · auto-debit ready'}
              left={
                <View style={[styles.bubble, { backgroundColor: avatarColor(bank) }]}>
                  <Text style={styles.bubbleText}>{bank[0]}</Text>
                </View>
              }
              right={linking === bank ? <ActivityIndicator color={colors.primary} /> : undefined}
              chevron={linking !== bank}
              onPress={() => startLink(bank)}
              style={styles.rowPad}
            />
          </Card>
        ))}

        <Card padded={false} style={[styles.bankCard, styles.otherCard]}>
          <ListRow
            title="Other Banks"
            subtitle={linking === 'Other Bank' ? 'Connecting securely…' : 'Use Open Banking'}
            left={<IconBubble name="business-outline" />}
            right={linking === 'Other Bank' ? <ActivityIndicator color={colors.primary} /> : undefined}
            chevron={linking !== 'Other Bank'}
            onPress={() => startLink('Other Bank')}
            style={styles.rowPad}
          />
        </Card>
      </View>

      {linkedBank && <Button title="Done" onPress={() => router.back()} style={styles.doneBtn} />}

      <View style={styles.footer}>
        <Ionicons name="lock-closed" size={14} color={colors.success} />
        <Text style={styles.footerText}>
          Powered by Open Banking APIs · Your data is encrypted and secure
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.sub,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successBg,
    borderColor: colors.successBg,
    marginBottom: spacing.lg,
  },
  successCheck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBody: { flex: 1 },
  successTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.success },
  successText: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink, marginTop: 2, lineHeight: 17 },
  list: { gap: spacing.sm },
  bankCard: { paddingHorizontal: spacing.lg },
  otherCard: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: colors.borderStrong },
  rowPad: { paddingVertical: spacing.md },
  bubble: {
    width: 40,
    height: 40,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.onPrimary },
  doneBtn: { marginTop: spacing.xl },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xxl,
  },
  footerText: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.sub, textAlign: 'center' },
});
