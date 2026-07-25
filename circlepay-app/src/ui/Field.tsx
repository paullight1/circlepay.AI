import { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme/tokens';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  left?: ReactNode;   // e.g. ₦ prefix
  right?: ReactNode;
}

/** Labeled text input matching the design's form fields. */
export function Field({ label, hint, error, left, right, style, ...input }: Props) {
  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.box, !!error && { borderColor: colors.danger }]}>
        {left}
        <TextInput
          placeholderTextColor={colors.faint}
          style={[styles.input, style]}
          {...input}
        />
        {right}
      </View>
      {!!(error || hint) && (
        <Text style={[styles.hint, !!error && { color: colors.danger }]}>{error || hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, marginBottom: 7 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 12,
  },
  hint: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 6 },
});
