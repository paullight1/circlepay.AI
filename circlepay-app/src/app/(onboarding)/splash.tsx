import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, fonts, gradients, spacing } from '@/theme/tokens';
import { BrandMark, useReducedMotion } from '@/ui/motion';

/** Full run of the splash choreography, in ms. */
const HOLD_FULL = 1700;
const HOLD_REDUCED = 700;

/**
 * Animated splash.
 *
 * The native splash (solid brand purple, no image) holds until fonts load, then
 * hands off here invisibly. The ring spins so its single white dot orbits the
 * circle once — which is exactly one Ajo payout rotation.
 */
export default function Splash() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const markScale = useSharedValue(reduced ? 1 : 0.6);
  const markOpacity = useSharedValue(reduced ? 1 : 0);
  const wordOpacity = useSharedValue(reduced ? 1 : 0);
  const exitScale = useSharedValue(1);
  const exitOpacity = useSharedValue(1);

  useEffect(() => {
    if (!reduced) {
      markOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
      markScale.value = withSpring(1, { damping: 12, stiffness: 140 });
      wordOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
      exitScale.value = withDelay(1400, withTiming(1.08, { duration: 300 }));
      exitOpacity.value = withDelay(1400, withTiming(0, { duration: 300 }));
    }

    const t = setTimeout(
      () => router.replace('/(onboarding)/intro'),
      reduced ? HOLD_REDUCED : HOLD_FULL
    );
    return () => clearTimeout(t);
  }, [reduced, router, markOpacity, markScale, wordOpacity, exitScale, exitOpacity]);

  const lockup = useAnimatedStyle(() => ({
    opacity: exitOpacity.value,
    transform: [{ scale: exitScale.value }],
  }));
  const mark = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));
  const word = useAnimatedStyle(() => ({ opacity: wordOpacity.value }));

  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={gradients.payout}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.center, lockup]}>
        <Animated.View style={mark}>
          <BrandMark size={104} spin={!reduced} spinDuration={1600} plate={false} />
        </Animated.View>

        <Animated.View style={word}>
          <Text style={styles.wordmark}>
            CirclePay<Text style={styles.wordmarkAi}>AI</Text>
          </Text>
          <Text style={styles.tagline}>Save Together. Pay Smart. Grow Better.</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  wordmark: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    letterSpacing: -0.6,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  wordmarkAi: { color: colors.lavender },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.onPrimaryDim,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
