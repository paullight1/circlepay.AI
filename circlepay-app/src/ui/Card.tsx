import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radius, shadow, spacing } from '@/theme/tokens';

interface Props {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  padded?: boolean;
}

/** White rounded card with the standard soft shadow. */
export function Card({ children, style, onPress, padded = true }: Props) {
  const base = [styles.card, padded && styles.padded, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...base.flat(), pressed && { opacity: 0.88 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  padded: { padding: spacing.lg },
});
