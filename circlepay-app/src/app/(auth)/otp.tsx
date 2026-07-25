import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Button, Card, Screen, ScreenHeader } from '@/ui';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyOtp() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const storePhone = useStore((s) => s.user.phone);
  const phone = params.phone ?? storePhone;

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputs = useRef<Array<TextInput | null>>([]);

  const complete = digits.every((d) => d !== '');

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const onChange = (text: string, i: number) => {
    const clean = text.replace(/\D/g, '');
    // Full-code paste into any box
    if (clean.length === CODE_LENGTH) {
      setDigits(clean.split(''));
      inputs.current[CODE_LENGTH - 1]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean.slice(-1);
    setDigits(next);
    if (clean && i < CODE_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      inputs.current[i - 1]?.focus();
    }
  };

  const resend = () => {
    setDigits(Array(CODE_LENGTH).fill(''));
    setSeconds(RESEND_SECONDS);
    inputs.current[0]?.focus();
  };

  return (
    <Screen padded={false} style={styles.grow}>
      <ScreenHeader title="Verify OTP" />

      <Text style={styles.heading}>Verify your number</Text>
      <Text style={styles.sub}>
        We sent a 6-digit code to <Text style={styles.subStrong}>{phone}</Text>
      </Text>

      {/* OTP boxes */}
      <View style={styles.boxes}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={(r) => {
              inputs.current[i] = r;
            }}
            value={d}
            onChangeText={(t) => onChange(t, i)}
            onKeyPress={(e) => onKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={i === 0 ? CODE_LENGTH : 1}
            autoFocus={i === 0}
            selectTextOnFocus
            style={[styles.box, !!d && styles.boxFilled]}
          />
        ))}
      </View>

      {/* Resend */}
      <View style={styles.resendRow}>
        <Text style={styles.resendLabel}>Didn't get it? </Text>
        {seconds > 0 ? (
          <Text style={styles.resendTimer}>Resend in 0:{String(seconds).padStart(2, '0')}</Text>
        ) : (
          <Pressable onPress={resend} hitSlop={8}>
            <Text style={styles.resendLink}>Resend code</Text>
          </Pressable>
        )}
      </View>

      <Card style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
        </View>
        <Text style={styles.infoText}>
          Your number keeps your circles and wallet secure. We never share it.
        </Text>
      </Card>

      <View style={styles.bottom}>
        <Button
          title="Verify & Continue"
          disabled={!complete}
          onPress={() => router.push('/(auth)/kyc')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1 },
  heading: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  sub: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.sub,
    marginTop: 6,
    marginBottom: spacing.xxl,
  },
  subStrong: { fontFamily: fonts.bold, color: colors.ink },
  boxes: { flexDirection: 'row', gap: spacing.sm },
  box: {
    flex: 1,
    // react-native-web <input> has an intrinsic min-width that defeats
    // flex shrinking — without this one box swallows the whole row.
    minWidth: 0,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.ink,
  },
  boxFilled: { borderColor: colors.primary },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  resendLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub },
  resendTimer: { fontFamily: fonts.bold, fontSize: 13, color: colors.faint },
  resendLink: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.sub,
  },
  bottom: { marginTop: 'auto', paddingTop: spacing.xl },
});
