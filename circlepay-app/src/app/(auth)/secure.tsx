import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Button, Screen, ScreenHeader } from '@/ui';

const PIN_LENGTH = 4;

type Phase = 'create' | 'confirm' | 'biometrics';

const KEYS: Array<Array<string | null>> = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [null, '0', 'back'],
];

export default function SecureAccount() {
  const router = useRouter();
  const setPin = useStore((s) => s.setPin);
  const setOnboarded = useStore((s) => s.setOnboarded);

  const [phase, setPhase] = useState<Phase>('create');
  const [pin, setPinValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>();
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
            setError("PINs don't match — try again.");
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

      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.sub}>{sub}</Text>

      {phase !== 'biometrics' ? (
        <>
          {/* PIN dots */}
          <View style={styles.dots}>
            {Array.from({ length: PIN_LENGTH }, (_, i) => (
              <View key={i} style={[styles.dot, i < entry.length && styles.dotFilled]} />
            ))}
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}

          {/* Keypad */}
          <View style={styles.pad}>
            {KEYS.map((row, r) => (
              <View key={r} style={styles.padRow}>
                {row.map((key, c) =>
                  key === null ? (
                    <View key={c} style={styles.key} />
                  ) : (
                    <Pressable
                      key={c}
                      onPress={() => onKey(key)}
                      style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}>
                      {key === 'back' ? (
                        <Ionicons name="backspace-outline" size={24} color={colors.sub} />
                      ) : (
                        <Text style={styles.keyText}>{key}</Text>
                      )}
                    </Pressable>
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
            <View style={styles.successHalo}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={34} color={colors.onPrimary} />
              </View>
            </View>
            <Text style={styles.successText}>Transaction PIN set</Text>
          </View>

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
  error: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.danger,
    textAlign: 'center',
  },
  pad: { marginTop: 'auto', gap: spacing.md },
  padRow: { flexDirection: 'row', gap: spacing.md },
  key: {
    flex: 1,
    height: 62,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: colors.chip },
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
