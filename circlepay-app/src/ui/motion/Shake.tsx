import { type ReactNode, useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from './useReducedMotion';

interface Props {
  children: ReactNode;
  /**
   * Increment this to trigger a shake. A counter rather than a boolean so
   * repeated failures each get their own shake without a reset in between.
   */
  trigger: number;
  style?: StyleProp<ViewStyle>;
}

const STEP = 55;

/** Horizontal shake for rejected input — wrong PIN, bad OTP. */
export function Shake({ children, trigger, style }: Props) {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0 || reduced) return;
    x.value = withSequence(
      withTiming(-9, { duration: STEP }),
      withTiming(9, { duration: STEP }),
      withTiming(-6, { duration: STEP }),
      withTiming(6, { duration: STEP }),
      withTiming(0, { duration: STEP })
    );
  }, [trigger, reduced, x]);

  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
