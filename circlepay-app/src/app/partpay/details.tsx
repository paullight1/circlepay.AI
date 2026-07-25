import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { NAIRA, formatNaira } from '@/lib/format';
import type { PayModel } from '@/store/types';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { AmountText, Button, Card, Chip, Field, Screen, ScreenHeader } from '@/ui';

const DURATIONS = [3, 6, 12, 24];
const SERVICE_FEE_PCT = 3;

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.rowLabelStrong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowValueStrong]}>{value}</Text>
    </View>
  );
}

export default function PaymentDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; model?: string }>();
  const category = params.category ?? 'Other';
  const model: PayModel = params.model === 'upfront' ? 'upfront' : 'gradual';

  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [amountText, setAmountText] = useState('');
  const [duration, setDuration] = useState(12);
  const [touched, setTouched] = useState(false);

  const total = Number(amountText.replace(/[^0-9]/g, '')) || 0;
  const monthly = total > 0 ? Math.ceil(total / duration) : 0;
  const serviceFee = Math.round(total * (SERVICE_FEE_PCT / 100));
  const canReview = title.trim().length > 0 && total > 0;

  return (
    <Screen>
      <ScreenHeader title="Enter Payment Details" subtitle={`${category} · ${model === 'gradual' ? 'Pay Gradually' : 'CirclePay Upfront'}`} />

      <Field
        label="Payment title"
        placeholder="e.g. Rent - 2 Bedroom Apartment"
        value={title}
        onChangeText={setTitle}
        error={touched && !title.trim() ? 'Give this payment a title.' : undefined}
      />
      <Field
        label="Details / address"
        placeholder="e.g. 123 Allen Avenue, Ikeja, Lagos"
        value={detail}
        onChangeText={setDetail}
      />
      <Field
        label="Total amount"
        placeholder="600,000"
        keyboardType="number-pad"
        value={amountText}
        onChangeText={(t) => setAmountText(t.replace(/[^0-9]/g, ''))}
        left={<Text style={styles.nairaPrefix}>{NAIRA}</Text>}
        error={touched && total <= 0 ? 'Enter the total amount to split.' : undefined}
      />

      <Text style={styles.durationLabel}>Duration</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map((m) => (
          <Chip
            key={m}
            label={`${m} months`}
            selected={duration === m}
            onPress={() => setDuration(m)}
            style={styles.durationChip}
          />
        ))}
      </View>

      {total > 0 && (
        <Card style={styles.preview}>
          <Text style={styles.previewTitle}>Your plan preview</Text>
          <Row label="Initial Payment" value={formatNaira(monthly)} />
          <Row label={`Monthly Payment (${duration} months)`} value={formatNaira(monthly)} />
          {model === 'upfront' && (
            <>
              <Row label={`CirclePay Service Fee (${SERVICE_FEE_PCT}%)`} value={formatNaira(serviceFee)} />
              <View style={styles.divider} />
              <Row label="Total Payable" value={formatNaira(total + serviceFee)} strong />
              <View style={styles.highlight}>
                <Text style={styles.highlightLabel}>You Receive Immediately</Text>
                <AmountText amount={total} size={20} color={colors.primary} />
              </View>
            </>
          )}
        </Card>
      )}

      <Button
        title="Review Plan"
        style={styles.cta}
        disabled={touched && !canReview}
        onPress={() => {
          setTouched(true);
          if (!canReview) return;
          router.push({
            pathname: '/partpay/review',
            params: {
              category,
              model,
              title: title.trim(),
              detail: detail.trim(),
              total: String(total),
              duration: String(duration),
            },
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  nairaPrefix: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  durationLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, marginBottom: 7 },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  durationChip: { paddingHorizontal: spacing.md },
  preview: { marginTop: spacing.xl },
  previewTitle: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  rowLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub },
  rowLabelStrong: { fontFamily: fonts.bold, color: colors.ink },
  rowValue: { fontFamily: fonts.mono, fontSize: 13.5, color: colors.ink },
  rowValueStrong: { fontFamily: fonts.mono, fontSize: 14.5, color: colors.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  highlight: {
    marginTop: spacing.md,
    backgroundColor: colors.chip,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  highlightLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primaryDark },
  cta: { marginTop: spacing.xl },
});
