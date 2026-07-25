import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PayCategory } from '@/store/types';
import { colors, fonts, radius, shadow, spacing } from '@/theme/tokens';
import { Button, Screen, ScreenHeader } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

interface CategoryTile {
  category: PayCategory;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

const CATEGORIES: CategoryTile[] = [
  {
    category: 'Rent', label: 'Rent', subtitle: 'Pay your house rent in installments',
    icon: 'home-outline', color: colors.primary, bg: colors.chip,
  },
  {
    category: 'School Fees', label: 'School Fees', subtitle: 'Tuition, levies & other fees',
    icon: 'book-outline', color: colors.info, bg: colors.infoBg,
  },
  {
    category: 'Medical Bills', label: 'Medical Bills', subtitle: 'Hospital & healthcare costs',
    icon: 'medkit-outline', color: colors.danger, bg: colors.dangerBg,
  },
  {
    category: 'Consumer Products', label: 'Consumer Products', subtitle: 'Phones, appliances, electronics & more',
    icon: 'cube-outline', color: colors.warning, bg: colors.warningBg,
  },
  {
    category: 'Business Services', label: 'Business Services', subtitle: 'POS, inventory, subscriptions',
    icon: 'briefcase-outline', color: colors.success, bg: colors.successBg,
  },
  {
    category: 'Other', label: 'Other Payments', subtitle: 'Any other payment',
    icon: 'ellipsis-horizontal', color: colors.sub, bg: colors.cardAlt,
  },
];

export default function ChooseCategory() {
  const router = useRouter();
  const [selected, setSelected] = useState<PayCategory | null>(null);

  return (
    <Screen>
      <ScreenHeader title="Choose what to pay" subtitle="Split any big bill into installments" />

      <View style={styles.grid}>
        {CATEGORIES.map((c) => {
          const active = selected === c.category;
          return (
            <Pressable
              key={c.category}
              onPress={() => setSelected(c.category)}
              style={({ pressed }) => [styles.tile, active && styles.tileActive, pressed && { opacity: 0.85 }]}>
              <IconBubble name={c.icon} color={c.color} bg={c.bg} size={46} />
              <Text style={styles.tileTitle}>{c.label}</Text>
              <Text style={styles.tileSub}>{c.subtitle}</Text>
              {active && (
                <View style={styles.tick}>
                  <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <Button
        title="Continue"
        disabled={!selected}
        style={styles.cta}
        onPress={() => {
          if (selected) router.push(`/partpay/model?category=${encodeURIComponent(selected)}`);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  tile: {
    width: '48.4%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.card,
  },
  tileActive: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  tileTitle: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.ink, marginTop: spacing.xs },
  tileSub: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, lineHeight: 16 },
  tick: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: { marginTop: spacing.xxl },
});
