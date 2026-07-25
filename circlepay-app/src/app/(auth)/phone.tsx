import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { AuthProgress, Button, Field, Screen } from '@/ui';
import { BrandMark, FadeSlideIn } from '@/ui/motion';

/** Local subscriber numbers are 10 digits after the +234 country code. */
const LOCAL_DIGITS = 10;

export default function PhoneEntry() {
  const router = useRouter();
  const updateUser = useStore((s) => s.updateUser);

  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | undefined>();

  const onContinue = () => {
    const clean = digits.replace(/\D/g, '');
    if (clean.length < LOCAL_DIGITS) {
      setError('Enter your 10-digit phone number.');
      return;
    }
    const phone = `+234 ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
    updateUser({ phone });
    router.push({ pathname: '/(auth)/otp', params: { phone } });
  };

  return (
    <Screen style={styles.grow}>
      <AuthProgress current="Phone" />

      <FadeSlideIn>
        <BrandMark size={52} />
      </FadeSlideIn>

      <FadeSlideIn delay={70}>
        <Text style={styles.heading}>What&apos;s your number?</Text>
        <Text style={styles.sub}>
          We&apos;ll text you a 6-digit code to confirm it&apos;s really you.
        </Text>
      </FadeSlideIn>

      <FadeSlideIn delay={140} style={styles.form}>
        <Text style={styles.fieldLabel}>Phone number</Text>
        <Field
          left={<Text style={styles.prefix}>+234</Text>}
          placeholder="803 555 0147"
          keyboardType="phone-pad"
          maxLength={13}
          value={digits}
          autoFocus
          onChangeText={(t) => {
            setDigits(t.replace(/[^\d\s]/g, ''));
            setError(undefined);
          }}
          error={error}
          onSubmitEditing={onContinue}
        />
      </FadeSlideIn>

      {/* Reassurance sits beside the ask, not after it. */}
      <FadeSlideIn delay={210}>
        <View style={styles.trust}>
          <View style={styles.trustIcon}>
            <Ionicons name="lock-closed" size={17} color={colors.primary} />
          </View>
          <Text style={styles.trustText}>
            Your number keeps your circles and wallet secure. We never share it.
          </Text>
        </View>
      </FadeSlideIn>

      <View style={styles.bottom}>
        <Button title="Continue" onPress={onContinue} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1 },
  heading: {
    fontFamily: fonts.extrabold,
    fontSize: 26,
    letterSpacing: -0.6,
    color: colors.ink,
    marginTop: spacing.xl,
  },
  sub: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.sub,
    marginTop: 6,
  },
  form: { marginTop: spacing.xxl },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 7,
  },
  prefix: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.chip,
  },
  trustIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.primaryDark,
  },
  bottom: { marginTop: 'auto', paddingTop: spacing.xxl },
});
