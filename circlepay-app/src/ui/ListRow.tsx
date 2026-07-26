import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme/tokens';

interface Props {
  title: string;
  subtitle?: string;
  left?: ReactNode;         // Avatar / icon bubble
  right?: ReactNode;        // amount / pill / chevron
  onPress?: () => void;
  chevron?: boolean;
  style?: ViewStyle;
  /** Subtitle line clamp. Defaults to 1; savings plan rows need 2. */
  subtitleLines?: number;
}

/** Generic list row: icon/avatar · title+subtitle · right accessory. */
export function ListRow({
  title, subtitle, left, right, onPress, chevron, style, subtitleLines = 1,
}: Props) {
  const content = (
    <>
      {left}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={subtitleLines}>{subtitle}</Text>
        )}
      </View>
      <View style={styles.right}>
        {right}
        {chevron && <Ionicons name="chevron-forward" size={16} color={colors.faint} />}
      </View>
    </>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, style, pressed && { opacity: 0.7 }]}>
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.row, style]}>{content}</View>;
}

/** Rounded square icon bubble used at the left of rows. */
export function IconBubble({
  name, color = colors.primary, bg = colors.chip, size = 40,
}: { name: keyof typeof Ionicons.glyphMap; color?: string; bg?: string; size?: number }) {
  return (
    <View style={[styles.bubble, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg }]}>
      <Ionicons name={name} size={size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  body: { flex: 1 },
  title: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bubble: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
});
