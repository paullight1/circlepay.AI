import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme/tokens';

import { BrandTile } from './BrandTile';

/** The banks offered in the designs, in grid order. */
export const BANKS = [
  'GTBank',
  'Access Bank',
  'First Bank',
  'Zenith Bank',
  'UBA',
  'Fidelity Bank',
  'Sterling Bank',
  'Other Banks',
] as const;

/** Short marks for the tiles — initials read badly for these names. */
const MARKS: Record<string, string> = {
  GTBank: 'GT',
  'Access Bank': 'AC',
  'First Bank': 'FB',
  'Zenith Bank': 'Z',
  UBA: 'UBA',
  'Fidelity Bank': 'FD',
  'Sterling Bank': 'ST',
  'Other Banks': '•••',
};

interface Props {
  banks: readonly string[];
  /** Currently chosen bank name. */
  selected?: string;
  /** Bank currently being linked — shows a spinner on that tile. */
  busy?: string;
  onSelect: (bank: string) => void;
}

/** Three-column bank grid used by Link Bank Account and the savings wizard. */
export function BankPicker({ banks, selected, busy, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {banks.map((bank) => {
        const isSelected = selected === bank;
        return (
          <Pressable
            key={bank}
            onPress={() => onSelect(bank)}
            disabled={!!busy}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled: !!busy }}
            style={({ pressed }) => [
              styles.tile,
              isSelected && styles.tileSelected,
              pressed && { opacity: 0.75 },
            ]}>
            {busy === bank ? (
              <ActivityIndicator color={colors.primary} style={styles.mark} />
            ) : (
              <BrandTile name={bank} label={MARKS[bank] ?? bank.slice(0, 2)} size={40} />
            )}
            <Text style={styles.label} numberOfLines={2}>
              {bank}
            </Text>
            {isSelected && (
              <View style={styles.check}>
                <Ionicons name="checkmark" size={11} color={colors.onPrimary} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    // Three per row, accounting for two 8px gaps.
    width: '31.5%',
    alignItems: 'center',
    gap: 7,
    paddingVertical: spacing.md,
    paddingHorizontal: 6,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  tileSelected: { borderColor: colors.primary, backgroundColor: colors.chip },
  mark: { width: 40, height: 40 },
  label: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink, textAlign: 'center' },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
