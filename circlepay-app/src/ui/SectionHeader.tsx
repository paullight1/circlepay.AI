import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme/tokens';

interface Props {
  title: string;
  actionLabel?: string;   // "See all"
  onAction?: () => void;
}

/** "My Groups        See all" row above lists. */
export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {!!actionLabel && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  action: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
});
