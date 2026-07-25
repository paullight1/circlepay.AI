import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, fonts } from '@/theme/tokens';

interface Props {
  /** 0..max */
  value: number;
  max?: number;
  size?: number;
  label?: string;      // "Moderate Risk" / "Good"
  color?: string;      // arc color; defaults by ratio (green→amber→red inverted for risk)
  /** 'score' colors high values green (trust); 'risk' colors high values red. */
  mode?: 'score' | 'risk';
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

/** Semi-circular gauge used for Risk Score and Trust Score. */
export function Gauge({ value, max = 100, size = 180, label, color, mode = 'risk' }: Props) {
  const ratio = Math.max(0, Math.min(1, value / max));
  const auto =
    mode === 'risk'
      ? ratio < 0.35 ? colors.success : ratio < 0.65 ? colors.warning : colors.danger
      : ratio < 0.45 ? colors.danger : ratio < 0.7 ? colors.warning : colors.success;
  const arc = color ?? auto;
  const stroke = size * 0.075;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const sweep = 180 * ratio;
  const knob = polar(cx, cy, r, sweep);
  return (
    <View style={{ width: size, height: size / 2 + stroke, alignItems: 'center' }}>
      <Svg width={size} height={size / 2 + stroke}>
        <Path d={arcPath(cx, cy, r, 0, 180)} stroke={colors.border} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        {sweep > 0 && (
          <Path d={arcPath(cx, cy, r, 0, sweep)} stroke={arc} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        )}
        <Circle cx={knob.x} cy={knob.y} r={stroke * 0.62} fill="#fff" stroke={arc} strokeWidth={2.5} />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.value, { fontSize: size * 0.2 }]}>{Math.round(value)}</Text>
        {!!label && <Text style={[styles.label, { color: arc }]}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', bottom: 0, alignItems: 'center' },
  value: { fontFamily: fonts.extrabold, color: colors.ink },
  label: { fontFamily: fonts.bold, fontSize: 12.5, marginTop: 2 },
});
