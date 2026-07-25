import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategory } from '@/lib/billers';
import { notify } from '@/lib/dialogs';
import { formatDateTime } from '@/lib/format';
import type { BillPayment } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { AmountText, Button, Card, EmptyState, Screen, ScreenHeader, StatusPill } from '@/ui';

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, mono && styles.detailMono]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

/** Green tick that springs in — the success treatment used across the app. */
function SuccessMark({ tone }: { tone: 'success' | 'warning' | 'danger' }) {
  const [scale] = useState(() => new Animated.Value(0.4));
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  }, [scale]);
  const bg = tone === 'success' ? colors.successBg : tone === 'warning' ? colors.warningBg : colors.dangerBg;
  const fg = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.danger;
  const icon = tone === 'success' ? 'checkmark' : tone === 'warning' ? 'time' : 'close';
  return (
    <Animated.View style={[styles.halo, { backgroundColor: bg, transform: [{ scale }] }]}>
      <View style={[styles.haloInner, { backgroundColor: fg }]}>
        <Ionicons name={icon} size={34} color={colors.onPrimary} />
      </View>
    </Animated.View>
  );
}

/** Copyable credential block — meter token or exam PINs. */
function Credential({ title, values, hint }: { title: string; values: string[]; hint: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const onCopy = () => {
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <View style={styles.credential}>
      <View style={styles.credentialTop}>
        <Text style={styles.credentialTitle}>{title}</Text>
        <Pressable onPress={onCopy} hitSlop={10} style={styles.copyBtn}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={colors.onPrimary} />
        </Pressable>
      </View>
      {values.map((v) => (
        <Text key={v} style={styles.credentialValue} selectable>{v}</Text>
      ))}
      <Text style={styles.credentialHint}>{hint}</Text>
    </View>
  );
}

export default function BillReceipt() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const bill: BillPayment | undefined = useStore((s) => s.bills.find((b) => b.id === id));

  if (!bill) {
    return (
      <Screen>
        <ScreenHeader title="Receipt" />
        <EmptyState
          icon="receipt-outline"
          title="Receipt not found"
          body="This payment is no longer in your history."
        />
        <Button title="Back to Bills" onPress={() => router.replace('/bills')} />
      </Screen>
    );
  }

  const category = getCategory(bill.categoryId);
  const tone = bill.status === 'success' ? 'success' : bill.status === 'pending' ? 'warning' : 'danger';
  const heading =
    bill.status === 'success' ? 'Payment Successful'
    : bill.status === 'pending' ? 'Awaiting Agent'
    : 'Payment Failed';

  return (
    <Screen>
      <ScreenHeader title="Receipt" />

      <View style={styles.hero}>
        <SuccessMark tone={tone} />
        <Text style={styles.heroTitle}>{heading}</Text>
        <AmountText amount={bill.amount + bill.fee} decimals={2} size={34} color={colors.primary} />
        <Text style={styles.heroSub}>
          {bill.billerName} · {bill.planLabel ?? bill.categoryLabel}
        </Text>
        <StatusPill
          label={bill.method === 'agent' ? 'Paid at agent' : 'Paid from wallet'}
          tone="primary"
        />
      </View>

      {!!bill.token && (
        <Credential
          title="PREPAID METER TOKEN"
          values={[bill.token]}
          hint={`Type this token into your ${bill.billerName} meter to load the units.`}
        />
      )}

      {!!bill.pins?.length && (
        <Credential
          title={bill.pins.length > 1 ? `${bill.pins.length} PINS` : 'PIN'}
          values={bill.pins}
          hint={`Keep these safe — each ${bill.billerName} PIN can only be used once.`}
        />
      )}

      <Card style={styles.details}>
        <DetailRow label={category?.label ?? 'Biller'} value={bill.billerName} />
        {!!bill.customerName && <DetailRow label="Account name" value={bill.customerName} />}
        <DetailRow label="Paid for" value={bill.customerRef} mono />
        {!!bill.planLabel && <DetailRow label="Plan" value={bill.planLabel} />}
        {!!bill.detail && <DetailRow label="Details" value={bill.detail} />}
        <View style={styles.detailDivider} />
        <DetailRow label="Amount" value={`₦${bill.amount.toLocaleString('en-US')}`} mono />
        <DetailRow label="Convenience fee" value={`₦${bill.fee.toLocaleString('en-US')}`} mono />
        <View style={styles.detailDivider} />
        <DetailRow label="Reference" value={bill.reference} mono />
        <DetailRow label="Date" value={formatDateTime(bill.date)} />
      </Card>

      <View style={styles.actions}>
        <Button
          title="Share Receipt"
          variant="ghost"
          icon={<Ionicons name="share-social-outline" size={17} color={colors.primary} />}
          onPress={() =>
            notify(
              'Receipt shared',
              `Reference ${bill.reference} has been copied to your share sheet.`
            )
          }
        />
        <Button title="Done" onPress={() => router.replace('/bills')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  halo: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  haloInner: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.ink },
  heroSub: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub, textAlign: 'center' },

  credential: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  credentialTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  credentialTitle: {
    fontFamily: fonts.semibold, fontSize: 11, color: colors.onPrimaryDim, letterSpacing: 1.2,
  },
  copyBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  credentialValue: {
    fontFamily: fonts.mono, fontSize: 17, color: colors.onPrimary,
    letterSpacing: 1.5, marginTop: spacing.md,
  },
  credentialHint: {
    fontFamily: fonts.medium, fontSize: 11.5, color: colors.onPrimaryDim,
    marginTop: spacing.md, lineHeight: 16,
  },

  details: { gap: 2 },
  detailRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: spacing.lg, paddingVertical: 6,
  },
  detailLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub },
  detailValue: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, textAlign: 'right' },
  detailMono: { fontFamily: fonts.mono, fontSize: 12.5 },
  detailDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

  actions: { gap: spacing.md, marginTop: spacing.xl },
});
