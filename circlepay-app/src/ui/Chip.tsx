import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme/tokens';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  style?: ViewStyle;
}

/** Selectable chip — amount denominations, categories, frequency options. */
export function Chip({ label, selected, onPress, icon, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && { opacity: 0.75 },
        style,
      ]}>
      {icon}
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.chip },
  label: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  selectedLabel: { color: colors.primary },
});
