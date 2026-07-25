import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg';

import { useReducedMotion } from './useReducedMotion';

interface Props {
  size?: number;
  /** Rotate the ring so the dot orbits — one orbit is one payout rotation. */
  spin?: boolean;
  /** Milliseconds for a full orbit. */
  spinDuration?: number;
  /** Draw the rounded-square brand plate behind the ring. */
  plate?: boolean;
}

/**
 * The CirclePay mark, ported from site/favicon.svg so app and web stay in sync:
 * a gradient ring with a single white dot resting at the top of it.
 *
 * Spinning it is not decoration — one dot travelling the full circle is exactly
 * one Ajo/Esusu payout rotation, which is the product in a single glyph.
 */
export function BrandMark({ size = 96, spin = false, spinDuration = 2400, plate = true }: Props) {
  const reduced = useReducedMotion();
  const angle = useSharedValue(0);

  useEffect(() => {
    if (!spin || reduced) {
      angle.value = 0;
      return;
    }
    angle.value = 0;
    angle.value = withRepeat(
      withTiming(360, { duration: spinDuration, easing: Easing.linear }),
      -1,
      false
    );
  }, [spin, reduced, spinDuration, angle]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={[StyleSheet.absoluteFill, style]}>
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Defs>
            <SvgGradient id="cp-plate" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#5B2EE6" />
              <Stop offset="1" stopColor="#33179B" />
            </SvgGradient>
            <SvgGradient id="cp-ring" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#B69BFF" />
              <Stop offset="0.5" stopColor="#7C4DFF" />
              <Stop offset="1" stopColor="#4B27D4" />
            </SvgGradient>
          </Defs>
          {plate && <Rect width="64" height="64" rx="16" fill="url(#cp-plate)" />}
          <Circle cx="32" cy="32" r="16" fill="none" stroke="url(#cp-ring)" strokeWidth="6" />
          <Circle cx="32" cy="16" r="5" fill="#fff" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
