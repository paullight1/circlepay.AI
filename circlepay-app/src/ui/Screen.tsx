import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/tokens';

interface Props {
  children: ReactNode;
  /** Scrollable content (default true). */
  scroll?: boolean;
  /** Extra bottom padding for screens under the tab bar (default true). */
  padded?: boolean;
  style?: ViewStyle;
  backgroundColor?: string;
}

/** Standard page wrapper: safe area, app background, scroll + keyboard handling. */
export function Screen({ children, scroll = true, padded = true, style, backgroundColor = colors.bg }: Props) {
  const insets = useSafeAreaInsets();
  const inner = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + (padded ? 110 : spacing.xl) },
        styles.content,
        style,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + (padded ? 110 : spacing.xl) },
        style,
      ]}>
      {children}
    </View>
  );
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {inner}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl },
});
