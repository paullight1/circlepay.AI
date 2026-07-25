import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import { Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

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

/**
 * Tap target that dips slightly under the finger. Use in place of a bare
 * Pressable on cards, keypad keys and anything that should feel physical.
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
  const scale = useSharedValue(1);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

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
      onPressIn={() => {
        if (!reduced && !disabled) scale.value = withSpring(to, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        if (!reduced) scale.value = withSpring(1, { damping: 18, stiffness: 320 });
      }}
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
