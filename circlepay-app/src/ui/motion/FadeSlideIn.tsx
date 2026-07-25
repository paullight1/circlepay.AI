import { type ReactNode, useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from './useReducedMotion';

interface Props {
  children: ReactNode;
  /** Stagger offset in ms — give sibling rows 60–90ms increments. */
  delay?: number;
  duration?: number;
  /** Distance travelled, in px. Negative slides down from above. */
  offset?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Entrance primitive: fades up into place. Transform + opacity only, so it stays
 * on the compositor and behaves identically on react-native-web.
 */
export function FadeSlideIn({ children, delay = 0, duration = 420, offset = 16, style }: Props) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, duration, reduced, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * offset }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
