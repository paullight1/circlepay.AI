import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { AuthProgress, Button, Screen, ScreenHeader } from '@/ui';
import { FadeSlideIn, PressableScale, Pulse, Shake, useReducedMotion } from '@/ui/motion';

const PIN_LENGTH = 4;

type Phase = 'create' | 'confirm' | 'biometrics';

const KEYS: (string | null)[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [null, '0', 'back'],
];

/**
 * One PIN dot. Pops as it fills so the keypad confirms the tap even when the
 * user's thumb is covering the key. Reduced motion snaps to the end state.
 */
function PinDot({ filled }: { filled: boolean }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const wasFilled = useRef(filled);

  useEffect(() => {
    const justFilled = filled && !wasFilled.current;
    wasFilled.current = filled;
    if (!justFilled || reduced) return;
    scale.value = withSequence(
      withTiming(1.32, { duration: 110, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 11, stiffness: 260 })
    );
  }, [filled, reduced, scale]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return <Animated.View style={[styles.dot, filled && styles.dotFilled, animated]} />;
}

/** Green tick that springs in once the PIN is confirmed. */
function SuccessCheck() {
  const reduced = useReducedMotion();
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    opacity.value = withTiming(1, { duration: 180 });
    scale.value = withSpring(1, { damping: 9, stiffness: 190, mass: 0.7 });
  }, [reduced, scale, opacity]);

  const animated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.successCircle, animated]}>
      <Ionicons name="checkmark" size={34} color={colors.onPrimary} />
    </Animated.View>
  );
}

export default function SecureAccount() {
  const router = useRouter();
  const setPin = useStore((s) => s.setPin);
  const setOnboarded = useStore((s) => s.setOnboarded);

  const [phase, setPhase] = useState<Phase>('create');
  const [pin, setPinValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [shake, setShake] = useState(0);
  const [bioAvailable, setBioAvailable] = useState(Platform.OS === 'web');
  const [bioEnabled, setBioEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return; // just show the toggle on web
    LocalAuthentication.hasHardwareAsync()
      .then(setBioAvailable)
      .catch(() => setBioAvailable(false));
  }, []);

  const entry = phase === 'confirm' ? confirm : pin;

  const onKey = (key: string) => {
    if (phase === 'biometrics') return;
    setError(undefined);
    if (key === 'back') {
      if (phase === 'confirm') setConfirm((v) => v.slice(0, -1));
      else setPinValue((v) => v.slice(0, -1));
      return;
    }
    if (entry.length >= PIN_LENGTH) return;
    if (phase === 'create') {
      const next = pin + key;
      setPinValue(next);
      if (next.length === PIN_LENGTH) setTimeout(() => setPhase('confirm'), 250);
    } else {
      const next = confirm + key;
      setConfirm(next);
      if (next.length === PIN_LENGTH) {
        setTimeout(() => {
          if (next === pin) {
            setPhase('biometrics');
          } else {
            setConfirm('');
            // Colour and motion never carry the message alone — the shake is on
            // top of the error string, not instead of it.
            setError("PINs don't match — try again.");
            setShake((n) => n + 1);
          }
        }, 250);
      }
    }
  };

  const finish = () => {
    setPin(bioEnabled);
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  const heading =
    phase === 'create' ? 'Secure your account'
    : phase === 'confirm' ? 'Confirm your PIN'
    : 'You are all set!';
  const sub =
    phase === 'create'
      ? 'Set a 4-digit PIN to authorise every payment and payout.'
      : phase === 'confirm'
        ? 'Enter the same 4 digits one more time.'
        : 'Your PIN is ready. Add Face ID for faster, safer sign-in.';

  return (
    <Screen scroll={false} padded={false}>
      <ScreenHeader title="Secure Account" />

      <AuthProgress current="Secure" />

      {/* Re-mounted per phase so each step announces itself with the same rise. */}
      <FadeSlideIn key={`h-${phase}`}>
        <Text style={styles.heading}>{heading}</Text>
      </FadeSlideIn>
      <FadeSlideIn key={`s-${phase}`} delay={70}>
        <Text style={styles.sub}>{sub}</Text>
      </FadeSlideIn>

      {phase !== 'biometrics' ? (
        <>
          {/* PIN dots */}
          <Shake trigger={shake}>
            <View
              style={styles.dots}
              accessibilityRole="text"
              accessibilityLabel={`${entry.length} of ${PIN_LENGTH} digits entered`}>
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <PinDot key={i} filled={i < entry.length} />
              ))}
            </View>
          </Shake>

          {error ? (
            <View style={styles.errorRow} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle" size={15} color={colors.danger} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          {/* Keypad */}
          <View style={styles.pad}>
            {KEYS.map((row, r) => (
              <View key={r} style={styles.padRow}>
                {row.map((key, c) =>
                  key === null ? (
                    <View key={c} style={styles.keyCell} />
                  ) : (
                    <View key={c} style={styles.keyCell}>
                      <PressableScale
                        onPress={() => onKey(key)}
                        haptic
                        to={0.94}
                        style={styles.key}
                        accessibilityLabel={key === 'back' ? 'Delete last digit' : key}>
                        {key === 'back' ? (
                          <Ionicons name="backspace-outline" size={24} color={colors.sub} />
                        ) : (
                          <Text style={styles.keyText}>{key}</Text>
                        )}
                      </PressableScale>
                    </View>
                  )
                )}
              </View>
            ))}
          </View>
        </>
      ) : (
        <>
          {/* Success + biometrics */}
          <View style={styles.successWrap}>
            <Pulse to={1.05} duration={1600}>
              <View style={styles.successHalo}>
                <SuccessCheck />
              </View>
            </Pulse>
            <FadeSlideIn delay={140}>
              <Text style={styles.successText}>Transaction PIN set</Text>
            </FadeSlideIn>
          </View>

          <FadeSlideIn delay={210}>
            <View style={styles.bioCard}>
              <View style={styles.bioIcon}>
                <Ionicons name="scan-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.bioTexts}>
                <Text style={styles.bioTitle}>Enable Face ID for faster sign-in</Text>
                <Text style={styles.bioBody}>
                  {bioAvailable
                    ? 'Use biometrics instead of your PIN to unlock CirclePay.'
                    : 'Biometrics not available on this device.'}
                </Text>
              </View>
              <Switch
                value={bioEnabled}
                onValueChange={setBioEnabled}
                disabled={!bioAvailable}
                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          </FadeSlideIn>

          <View style={styles.bottom}>
            <Button title="Finish Setup" onPress={finish} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    letterSpacing: -0.5,
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
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  dot: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  error: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.danger,
    textAlign: 'center',
  },
  pad: { marginTop: 'auto', gap: spacing.md },
  padRow: { flexDirection: 'row', gap: spacing.md },
  keyCell: { flex: 1 },
  key: {
    height: 62,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyText: { fontFamily: fonts.semibold, fontSize: 26, color: colors.ink },
  successWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  successHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    marginTop: spacing.md,
  },
  bioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.chip,
  },
  bioIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioTexts: { flex: 1 },
  bioTitle: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.primaryDark },
  bioBody: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  bottom: { marginTop: 'auto' },
});
