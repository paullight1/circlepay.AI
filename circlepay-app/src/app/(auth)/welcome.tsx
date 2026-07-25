import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/tokens';
import { Button, Field, Screen } from '@/ui';

const BULLETS = [
  { icon: 'people' as const, title: 'Trusted savings circles', body: 'Rotating esusu/ajo with friends & family' },
  { icon: 'sparkles' as const, title: 'AI trust & risk scores', body: 'Smart payout order and default protection' },
  { icon: 'card' as const, title: 'Split big bills', body: 'Rent, fees and products in easy installments' },
];

export default function Welcome() {
  const router = useRouter();
  const updateUser = useStore((s) => s.updateUser);
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | undefined>();

  const onContinue = () => {
    const clean = digits.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Enter your 10-digit phone number.');
      return;
    }
    const phone = `+234 ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
    updateUser({ phone });
    router.push({ pathname: '/(auth)/otp', params: { phone } });
  };

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={gradients.payout}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Screen backgroundColor="transparent" padded={false} style={styles.grow}>
        {/* Brand hero */}
        <View style={styles.brandRow}>
          <LinearGradient
            colors={gradients.brandRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoRing}>
            <View style={styles.logoDot} />
          </LinearGradient>
          <Text style={styles.wordmark}>
            CirclePay<Text style={styles.wordmarkAi}>AI</Text>
          </Text>
        </View>

        <Text style={styles.headline}>Save Together.{'\n'}Pay Smart.{'\n'}Grow Better.</Text>
        <Text style={styles.subcopy}>
          Join trusted savings circles, split big bills, and support your community — all in one place.
        </Text>

        {/* Value bullets */}
        <View style={styles.bullets}>
          {BULLETS.map((b) => (
            <View key={b.title} style={styles.bulletRow}>
              <View style={styles.bulletIcon}>
                <Ionicons name={b.icon} size={19} color={colors.onPrimary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.bulletTitle}>{b.title}</Text>
                <Text style={styles.bulletBody}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Phone entry */}
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Phone number</Text>
          <Field
            left={<Text style={styles.prefix}>+234</Text>}
            placeholder="803 555 0147"
            keyboardType="phone-pad"
            maxLength={11}
            value={digits}
            onChangeText={(t) => {
              setDigits(t.replace(/[^\d\s]/g, ''));
              setError(undefined);
            }}
            error={error}
          />
          <Button
            title="Continue"
            onPress={onContinue}
            variant="secondary"
            style={styles.cta}
          />
          <Text style={styles.footer}>
            Already have an account? <Text style={styles.footerLink} onPress={onContinue}>Log in</Text>
          </Text>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  logoRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryDeep,
  },
  wordmark: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.onPrimary },
  wordmarkAi: { color: colors.lavender },
  headline: {
    fontFamily: fonts.extrabold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: colors.onPrimary,
  },
  subcopy: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.onPrimaryDim,
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  bullets: { gap: spacing.lg, marginBottom: spacing.xxl },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bulletIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletTitle: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.onPrimary },
  bulletBody: { fontFamily: fonts.medium, fontSize: 12, color: colors.onPrimaryDim, marginTop: 2 },
  form: { marginTop: 'auto' },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.onPrimary,
    marginBottom: 7,
  },
  prefix: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  cta: { backgroundColor: colors.onPrimary, marginTop: spacing.xs },
  footer: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.onPrimaryDim,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footerLink: { fontFamily: fonts.bold, color: colors.onPrimary },
});
