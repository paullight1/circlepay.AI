import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { PayModel } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import { Button, Card, Screen, ScreenHeader, StatusPill } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

const TRUST_REQUIRED = 600;

interface Bullet {
  text: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

function check(text: string): Bullet {
  return { text, icon: 'checkmark-circle', color: colors.success };
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioDot} />}
    </View>
  );
}

function ModelCard({
  title, description, bullets, icon, iconColor, iconBg, selected, disabled, lockedLabel, onPress,
}: {
  title: string;
  description: string;
  bullets: Bullet[];
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  selected: boolean;
  disabled?: boolean;
  lockedLabel?: string;
  onPress?: () => void;
}) {
  return (
    <Card
      onPress={disabled ? undefined : onPress}
      style={StyleSheet.flatten([
        styles.option,
        selected && styles.optionSelected,
        disabled && styles.optionDisabled,
      ])}>
      <View style={styles.optionHead}>
        <IconBubble name={icon} color={iconColor} bg={iconBg} size={44} />
        <View style={styles.optionTitles}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionDesc}>{description}</Text>
        </View>
        <Radio selected={selected} />
      </View>
      <View style={styles.bullets}>
        {bullets.map((b) => (
          <View key={b.text} style={styles.bulletRow}>
            <Ionicons name={b.icon} size={15} color={b.color} />
            <Text style={styles.bulletText}>{b.text}</Text>
          </View>
        ))}
        {!!lockedLabel && <StatusPill label={lockedLabel} tone="warning" small />}
      </View>
    </Card>
  );
}

export default function SelectModel() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const trustScore = useStore((s) => s.user.trustScore);
  const upfrontLocked = trustScore < TRUST_REQUIRED;
  const [model, setModel] = useState<PayModel>('gradual');

  return (
    <Screen>
      <ScreenHeader title="Select payment model" subtitle="How do you want to handle this bill?" />

      <ModelCard
        title="Pay Gradually (You Pay Vendor)"
        description="You pay the vendor in installments until the full amount is complete."
        icon="calendar-outline"
        iconColor={colors.primary}
        iconBg={colors.chip}
        bullets={[check('Lower interest'), check('Longer repayment period'), check('Flexible plans')]}
        selected={model === 'gradual'}
        onPress={() => setModel('gradual')}
      />

      <ModelCard
        title="CirclePay Pays Upfront"
        description="We pay the vendor immediately. You repay CirclePay in installments."
        icon="wallet-outline"
        iconColor={colors.success}
        iconBg={colors.successBg}
        bullets={[
          check('Get it immediately'),
          check('Spread repayment'),
          { text: 'Small service fee applies', icon: 'information-circle', color: colors.warning },
        ]}
        selected={model === 'upfront'}
        disabled={upfrontLocked}
        lockedLabel={upfrontLocked ? `Requires Trust Score ${TRUST_REQUIRED}+` : undefined}
        onPress={() => setModel('upfront')}
      />

      <Button
        title="Continue"
        style={styles.cta}
        onPress={() =>
          router.push(`/partpay/details?category=${encodeURIComponent(category ?? 'Other')}&model=${model}`)
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: { marginBottom: spacing.md, borderWidth: 1.5 },
  optionSelected: { borderColor: colors.primary, borderWidth: 2 },
  optionDisabled: { opacity: 0.55 },
  optionHead: { flexDirection: 'row', gap: spacing.md },
  optionTitles: { flex: 1 },
  optionTitle: { fontFamily: fonts.extrabold, fontSize: 14.5, color: colors.ink },
  optionDesc: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 3, lineHeight: 17 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary },
  bullets: { marginTop: spacing.md, gap: spacing.sm },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bulletText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink },
  cta: { marginTop: spacing.lg },
});
