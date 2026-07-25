import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { AuthProgress, Button, Card, Screen, ScreenHeader } from '@/ui';
import { FadeSlideIn, PressableScale, Shake } from '@/ui/motion';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;
/** Beat between the last digit landing and the screen advancing, so the
 *  filled boxes are actually seen before the push. */
const VERIFY_MS = 420;

export default function VerifyOtp() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const storePhone = useStore((s) => s.user.phone);
  const phone = params.phone ?? storePhone;

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [focused, setFocused] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);
  // Auto-submit fires from a keystroke handler and the button is still live for
  // screen-reader users — both routes must not push /kyc twice.
  const advanced = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    []
  );

  /**
   * Any 6 digits are accepted — this is the simulated backend the README
   * promises. The only rejection is a code that is still short, which is what
   * the shake reports.
   */
  const submit = (code: string[]) => {
    const missing = code.findIndex((d) => d === '');
    if (missing !== -1) {
      setError('Enter all 6 digits to continue');
      setShake((n) => n + 1);
      inputs.current[missing]?.focus();
      return;
    }
    if (advanced.current) return;
    advanced.current = true;
    setError(null);
    setVerifying(true);
    Keyboard.dismiss();
    advanceTimer.current = setTimeout(() => router.push('/(auth)/kyc'), VERIFY_MS);
  };

  const onChange = (text: string, i: number) => {
    const clean = text.replace(/\D/g, '');
    if (error) setError(null);
    // Full-code paste into any box
    if (clean.length === CODE_LENGTH) {
      const pasted = clean.split('');
      setDigits(pasted);
      inputs.current[CODE_LENGTH - 1]?.focus();
      submit(pasted);
      return;
    }
    const next = [...digits];
    next[i] = clean.slice(-1);
    setDigits(next);
    if (clean && i < CODE_LENGTH - 1) inputs.current[i + 1]?.focus();
    if (next.every((d) => d !== '')) submit(next);
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
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanced.current = false;
    setVerifying(false);
    setError(null);
    setDigits(Array(CODE_LENGTH).fill(''));
    setSeconds(RESEND_SECONDS);
    inputs.current[0]?.focus();
  };

  return (
    <Screen padded={false} style={styles.grow}>
      <ScreenHeader title="Verify OTP" />

      <AuthProgress current="Verify" />

      <FadeSlideIn>
        <Text style={styles.heading}>Verify your number</Text>
      </FadeSlideIn>

      <FadeSlideIn delay={70}>
        <Text style={styles.sub}>
          We sent a 6-digit code to <Text style={styles.subStrong}>{phone}</Text>
        </Text>
      </FadeSlideIn>

      {/* OTP boxes */}
      <FadeSlideIn delay={140}>
        <Shake trigger={shake}>
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
                onFocus={() => setFocused(i)}
                onBlur={() => setFocused((f) => (f === i ? -1 : f))}
                keyboardType="number-pad"
                maxLength={i === 0 ? CODE_LENGTH : 1}
                autoFocus={i === 0}
                selectTextOnFocus
                editable={!verifying}
                textContentType={i === 0 ? 'oneTimeCode' : 'none'}
                accessibilityLabel={`Digit ${i + 1} of ${CODE_LENGTH}`}
                style={[
                  styles.box,
                  !!d && styles.boxFilled,
                  focused === i && styles.boxFocused,
                  !!error && styles.boxError,
                ]}
              />
            ))}
          </View>
        </Shake>
      </FadeSlideIn>

      {error ? (
        <View style={styles.errorRow} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={15} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Resend */}
      <FadeSlideIn delay={210}>
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't get it? </Text>
          {seconds > 0 ? (
            <Text style={styles.resendTimer}>Resend in 0:{String(seconds).padStart(2, '0')}</Text>
          ) : (
            <PressableScale onPress={resend} haptic to={0.94} accessibilityLabel="Resend code">
              <Text style={styles.resendLink}>Resend code</Text>
            </PressableScale>
          )}
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={280}>
        <Card style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          </View>
          <Text style={styles.infoText}>
            Your number keeps your circles and wallet secure. We never share it.
          </Text>
        </Card>
      </FadeSlideIn>

      <View style={styles.bottom}>
        <Button title="Verify & Continue" loading={verifying} onPress={() => submit(digits)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1 },
  heading: {
    fontFamily: fonts.extrabold,
    fontSize: 25,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  sub: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
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
    height: 62,
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
  boxFocused: { borderColor: colors.primary, backgroundColor: colors.chip },
  boxError: { borderColor: colors.danger, backgroundColor: colors.dangerBg },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  errorText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.danger },
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
