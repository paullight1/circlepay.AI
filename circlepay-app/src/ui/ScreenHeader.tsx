import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme/tokens';

interface Props {
  title: string;
  subtitle?: string;
  /** Element on the right (icon button etc.). */
  right?: ReactNode;
  /** Hide the back button (e.g. tab roots). */
  noBack?: boolean;
  light?: boolean; // for dark/gradient backgrounds
}

/** "← Title" header used at the top of nearly every pushed screen. */
export function ScreenHeader({ title, subtitle, right, noBack, light }: Props) {
  const router = useRouter();
  const ink = light ? colors.onPrimary : colors.ink;
  return (
    <View style={styles.row}>
      {!noBack && (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={12}
          style={({ pressed }) => [styles.back, light && styles.backLight, pressed && { opacity: 0.6 }]}>
          <Ionicons name="arrow-back" size={20} color={ink} />
        </Pressable>
      )}
      <View style={styles.titles}>
        <Text style={[styles.title, { color: ink }]} numberOfLines={1}>{title}</Text>
        {!!subtitle && (
          <Text style={[styles.subtitle, light && { color: colors.onPrimaryDim }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {/* Balances the back button so the title stays centred. Must NOT reuse
          `back` — that carries a card background and border, which rendered as
          a phantom empty button on every screen with no right action. */}
      {right ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  spacer: { width: 38, height: 38 },
  backLight: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  titles: { flex: 1, alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  subtitle: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
});
