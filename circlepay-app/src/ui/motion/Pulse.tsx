import { type ReactNode, useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from './useReducedMotion';

interface Props {
  children: ReactNode;
  /** Peak scale at the top of the breath. */
  to?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/** Slow breathing scale — coach-mark spotlights and live countdowns. */
export function Pulse({ children, to = 1.06, duration = 1200, style }: Props) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(to, { duration, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [to, duration, reduced, scale]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
