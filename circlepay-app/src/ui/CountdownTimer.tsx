import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { countdownTo } from '@/lib/format';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

interface Props {
  /** ISO date to count down to. */
  target: string;
  light?: boolean;
}

/** "03 Days : 12 Hours : 45 Mins : 30 Secs" block from the group dashboard. */
export function CountdownTimer({ target, light }: Props) {
  const [cd, setCd] = useState(() => countdownTo(target));
  useEffect(() => {
    const t = setInterval(() => setCd(countdownTo(target)), 1000);
    return () => clearInterval(t);
  }, [target]);

  const cells: Array<[string, number]> = [
    ['Days', cd.days], ['Hours', cd.hours], ['Mins', cd.mins], ['Secs', cd.secs],
  ];
  return (
    <View style={styles.row}>
      {cells.map(([label, value], i) => (
        <View key={label} style={styles.cellWrap}>
          <View style={[styles.cell, light && styles.cellLight]}>
            <Text style={[styles.value, light && { color: colors.onPrimary }]}>
              {String(value).padStart(2, '0')}
            </Text>
            <Text style={[styles.label, light && { color: colors.onPrimaryDim }]}>{label}</Text>
          </View>
          {i < cells.length - 1 && <Text style={[styles.colon, light && { color: colors.onPrimaryDim }]}>:</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  cellWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cell: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cellLight: { backgroundColor: 'rgba(255,255,255,0.14)' },
  value: { fontFamily: fonts.mono, fontSize: 18, color: colors.ink },
  label: { fontFamily: fonts.medium, fontSize: 10, color: colors.sub, marginTop: 1 },
  colon: { fontFamily: fonts.bold, color: colors.faint, marginHorizontal: 4 },
});
