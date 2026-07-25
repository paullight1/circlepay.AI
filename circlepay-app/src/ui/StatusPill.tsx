import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/theme/tokens';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

const tones: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.successBg, fg: colors.success },
  warning: { bg: colors.warningBg, fg: colors.warning },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  info: { bg: colors.infoBg, fg: colors.info },
  neutral: { bg: colors.cardAlt, fg: colors.sub },
  primary: { bg: colors.chip, fg: colors.primary },
};

/** Map a member/tx status string to a tone. */
export function toneFor(status: string): Tone {
  switch (status) {
    case 'paid':
    case 'success':
    case 'active':
    case 'completed':
    case 'open':
      return 'success';
    case 'pending':
    case 'upcoming':
      return 'warning';
    case 'late':
    case 'failed':
    case 'deducted':
    case 'expired':
    case 'closed':
      return 'danger';
    default:
      return 'neutral';
  }
}

interface Props {
  label: string;
  tone?: Tone;
  small?: boolean;
}

/** Small rounded status badge: Paid / Pending / Late / Active … */
export function StatusPill({ label, tone, small }: Props) {
  const t = tones[tone ?? toneFor(label.toLowerCase())];
  return (
    <View style={[styles.pill, small && styles.small, { backgroundColor: t.bg }]}>
      <Text style={[styles.label, small && styles.smallLabel, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 8, paddingVertical: 2.5 },
  label: { fontFamily: fonts.bold, fontSize: 12 },
  smallLabel: { fontSize: 10.5 },
});
