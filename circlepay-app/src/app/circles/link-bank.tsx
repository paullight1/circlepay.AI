import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { BANKS, BankPicker, Button, Card, Screen, ScreenHeader } from '@/ui';

/** 09 · Link Bank Account — simulated Open Banking OAuth. */
export default function LinkBank() {
  const router = useRouter();
  const linkAccount = useStore((s) => s.linkAccount);
  const linkedAccounts = useStore((s) => s.linkedAccounts);

  const [linking, setLinking] = useState<string | undefined>(undefined);
  const [linkedBank, setLinkedBank] = useState<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const startLink = (bank: string) => {
    if (linking) return;
    setLinkedBank(undefined);
    setLinking(bank);
    // Simulated OAuth handshake with the bank.
    timer.current = setTimeout(() => {
      linkAccount(bank);
      setLinking(undefined);
      setLinkedBank(bank);
    }, 1400);
  };

  const newest = [...linkedAccounts].reverse().find((a) => a.bank === linkedBank);

  return (
    <Screen>
      <ScreenHeader title="Link Bank Account" />

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Secure. Fast. Reliable.</Text>
          <Text style={styles.heroBody}>
            Link your bank account to allow CirclePay AI to automate your savings and payments.
          </Text>
        </View>
        <View style={styles.shield}>
          <Ionicons name="shield-checkmark" size={30} color={colors.onPrimary} />
        </View>
      </View>

      {linkedBank && (
        <Card style={styles.successCard}>
          <View style={styles.successCheck}>
            <Ionicons name="checkmark" size={20} color={colors.onPrimary} />
          </View>
          <View style={styles.successBody}>
            <Text style={styles.successTitle}>Account linked</Text>
            <Text style={styles.successText}>
              {linkedBank} •••• {newest?.last4 ?? '••••'} is ready for automated deductions.
            </Text>
          </View>
        </Card>
      )}

      <Text style={styles.legend}>Select Bank</Text>
      <BankPicker banks={BANKS} selected={linkedBank} busy={linking} onSelect={startLink} />

      {linkedBank && <Button title="Done" onPress={() => router.back()} style={styles.doneBtn} />}

      <View style={styles.footer}>
        <Ionicons name="lock-closed" size={13} color={colors.success} />
        <Text style={styles.footerText}>Your data is encrypted and secure</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  heroCopy: { flex: 1 },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  heroBody: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub, lineHeight: 19, marginTop: 6 },
  shield: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successBg,
    borderColor: colors.successBg,
    marginBottom: spacing.lg,
  },
  successBody: { flex: 1 },
  successCheck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.success },
  successText: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink, marginTop: 2, lineHeight: 17 },
  legend: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, marginBottom: spacing.md },
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
