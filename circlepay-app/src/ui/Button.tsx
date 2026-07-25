import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  small?: boolean;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, icon, style, small }: Props) {
  const bg =
    variant === 'primary' ? colors.primary
    : variant === 'danger' ? colors.danger
    : variant === 'success' ? colors.success
    : variant === 'secondary' ? colors.chip
    : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger' || variant === 'success'
      ? colors.onPrimary
      : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        small && styles.small,
        { backgroundColor: bg },
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && { opacity: 0.45 },
        pressed && { opacity: 0.8 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, small && styles.smallLabel, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  small: { minHeight: 40, paddingHorizontal: spacing.lg, borderRadius: radius.sm },
  ghost: { borderWidth: 1.5, borderColor: colors.primary },
  label: { fontFamily: fonts.bold, fontSize: 15 },
  smallLabel: { fontSize: 13 },
});
