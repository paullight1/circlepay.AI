import * as Haptics from 'expo-haptics';
import { type ReactNode, useState } from 'react';
import { Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useReducedMotion } from './useReducedMotion';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** Scale at the bottom of the press. */
  to?: number;
  /** Fire a selection haptic on press. No-op on web. */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const SPRING = { damping: 18, stiffness: 320 } as const;

/**
 * Tap target that dips slightly under the finger. Use in place of a bare
 * Pressable on cards, keypad keys and anything that should feel physical.
 *
 * The scale is derived inside useAnimatedStyle from a plain state flag rather
 * than written to a shared value from the press handlers. Both animate on the
 * UI thread, but the derived form doesn't mutate a hook result, which the
 * React Compiler's immutability rule rejects.
 */
export function PressableScale({
  children,
  onPress,
  disabled,
  to = 0.97,
  haptic = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed && !reduced && !disabled ? to : 1, SPRING) }],
  }));

  const press = () => {
    if (haptic && Platform.OS !== 'web') {
      void Haptics.selectionAsync().catch(() => {
        /* device without a taptic engine */
      });
    }
    onPress?.();
  };

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={press}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}>
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}
