import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme/tokens';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
}

export function EmptyState({ icon = 'file-tray-outline', title, body }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bubble}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!body && <Text style={styles.body}>{body}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xxl * 1.5, paddingHorizontal: spacing.xl },
  bubble: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, textAlign: 'center' },
  body: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
