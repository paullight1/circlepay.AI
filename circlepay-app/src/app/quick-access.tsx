import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { MAX_QUICK_ACCESS, SHORTCUTS } from '@/lib/shortcuts';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import { Button, Card, ListRow, Screen, ScreenHeader } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

/** Home grid editor — pick 7; the 8th tile is always "More". */
export default function QuickAccessEditor() {
  const router = useRouter();
  const quickAccess = useStore((s) => s.quickAccess);
  const setQuickAccess = useStore((s) => s.setQuickAccess);
  const [chosen, setChosen] = useState<string[]>(quickAccess);

  const toggle = (id: string) =>
    setChosen((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_QUICK_ACCESS
          ? prev
          : [...prev, id]
    );

  const full = chosen.length >= MAX_QUICK_ACCESS;

  const save = () => {
    setQuickAccess(chosen);
    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Edit Quick Access" />
      <Text style={styles.intro}>
        Choose up to {MAX_QUICK_ACCESS} shortcuts for your home screen. They appear in the
        order you pick them.
      </Text>
      <Text style={styles.count}>{chosen.length} of {MAX_QUICK_ACCESS} selected</Text>

      <Card padded={false} style={styles.group}>
        {SHORTCUTS.map((s) => {
          const on = chosen.includes(s.id);
          const locked = !on && full;
          return (
            <ListRow
              key={s.id}
              title={s.label}
              subtitle={on ? `Position ${chosen.indexOf(s.id) + 1}` : locked ? 'Remove one to add this' : undefined}
              left={<IconBubble name={s.icon} color={s.tint} bg={s.bg} />}
              right={
                <Ionicons
                  name={on ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={on ? colors.primary : locked ? colors.border : colors.faint}
                />
              }
              onPress={() => toggle(s.id)}
              style={locked ? { opacity: 0.5 } : undefined}
            />
          );
        })}
      </Card>

      <Button
        title="Save"
        onPress={save}
        disabled={chosen.length === 0}
        style={{ marginTop: spacing.xl }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.sub, lineHeight: 20 },
  count: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.primary, marginTop: spacing.sm, marginBottom: spacing.lg },
  group: { paddingHorizontal: spacing.lg, paddingVertical: 4 },
});
