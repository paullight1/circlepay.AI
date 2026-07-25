import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  billerShort, getCategory, lookupCustomer, plansFor,
  type BillPlan, type Biller,
} from '@/lib/billers';
import { formatNaira } from '@/lib/format';
import { useStore, type PayBillInput } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import {
  AmountText, BrandTile, Button, Card, Chip, EmptyState, Field, Screen, ScreenHeader,
} from '@/ui';

function digitsOf(s: string): string {
  return s.replace(/\D/g, '');
}

/** Biller card in the picker grid. */
function BillerOption({
  biller, selected, onPress,
}: { biller: Biller; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.billerCard,
        selected && styles.billerCardSelected,
        pressed && { opacity: 0.8 },
      ]}>
      <BrandTile name={biller.name} label={billerShort(biller)} size={38} />
      <Text style={styles.billerName} numberOfLines={1}>{biller.name}</Text>
    </Pressable>
  );
}

/** Plan row — data bundles, TV packages, exam pins. */
function PlanRow({
  plan, selected, onPress,
}: { plan: BillPlan; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.planRow,
        selected && styles.planRowSelected,
        pressed && { opacity: 0.85 },
      ]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.planLabel}>{plan.label}</Text>
        <Text style={styles.planDetail}>{plan.detail}</Text>
      </View>
      <AmountText amount={plan.amount} size={14.5} color={selected ? colors.primary : colors.ink} />
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

export default function BillCategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const category = getCategory(params.category);

  const payBill = useStore((s) => s.payBill);
  const requestAgentBillPayment = useStore((s) => s.requestAgentBillPayment);

  const [billerId, setBillerId] = useState(category?.billers?.[0]?.id ?? '');
  const [variantId, setVariantId] = useState(category?.variant?.options[0]?.id ?? '');
  const [ref, setRef] = useState('');
  const [planId, setPlanId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [quantity, setQuantity] = useState(1);
  // Holds only the resolved lookup, tagged with the target it belongs to, so a
  // stale result is ignored rather than cleared with a synchronous setState.
  const [resolved, setResolved] = useState<{ key: string; value: string } | null>(null);
  const [error, setError] = useState<string | undefined>();

  const biller = category?.billers?.find((b) => b.id === billerId);
  // Selecting a different biller can swap the plan set out from under `planId`;
  // `plan` simply becomes undefined and validation asks for a new choice.
  const plans = useMemo(() => (category ? plansFor(category, biller) : []), [category, biller]);
  const plan = plans.find((p) => p.id === planId);
  const refField = category?.refField;
  const refDigits = digitsOf(ref);
  const refReady = !!refField && refDigits.length >= refField.minLength;
  const lookupKey = `${billerId}:${refDigits}`;

  // Simulated biller lookup, debounced. Phase is derived, never stored.
  useEffect(() => {
    const kind = refField?.lookup;
    if (!kind || !refReady) return;
    const t = setTimeout(() => setResolved({ key: lookupKey, value: lookupCustomer(kind, lookupKey) }), 700);
    return () => clearTimeout(t);
  }, [refField?.lookup, refReady, lookupKey]);

  const lookupValue = resolved?.key === lookupKey ? resolved.value : undefined;
  const lookupPhase: 'idle' | 'checking' | 'done' =
    !refField?.lookup || !refReady ? 'idle' : lookupValue ? 'done' : 'checking';

  if (!category || !category.refField || !category.billers) {
    return (
      <Screen>
        <ScreenHeader title="Bills" />
        <EmptyState
          icon="alert-circle-outline"
          title="Unknown bill category"
          body="Pick a category from the Bills home screen."
        />
        <Button title="Back to Bills" onPress={() => router.replace('/bills')} />
      </Screen>
    );
  }

  const usesPlans = plans.length > 0;
  const typedAmount = Number(digitsOf(amountStr)) || 0;
  const unitAmount = usesPlans ? plan?.amount ?? 0 : typedAmount;
  const amount = category.quantity ? unitAmount * quantity : unitAmount;
  const total = amount > 0 ? amount + category.fee : 0;
  const variantOption = category.variant?.options.find((o) => o.id === variantId);

  const onAmountChange = (text: string) => {
    const digits = digitsOf(text).slice(0, 9);
    setAmountStr(digits ? Number(digits).toLocaleString('en-US') : '');
    setError(undefined);
  };

  /** Returns an error message, or undefined when the form is ready to pay. */
  const validate = (): string | undefined => {
    if (!biller) return 'Choose a biller to continue.';
    if (!refReady) return `Enter a valid ${category.refField!.label.toLowerCase()}.`;
    if (category.refField!.lookup && lookupPhase !== 'done') return 'Wait for the account check to finish.';
    if (usesPlans && !plan) return 'Select a plan to continue.';
    if (!usesPlans && amount <= 0) return 'Enter an amount to continue.';
    return undefined;
  };

  const buildInput = (): PayBillInput => {
    const planLabel = plan
      ? category.quantity && quantity > 1
        ? `${plan.label} × ${quantity}`
        : `${plan.label} · ${plan.detail}`
      : variantOption
        ? `${variantOption.label} ${category.variant?.suffix ?? ''}`.trim()
        : undefined;
    return {
      categoryId: category.id,
      categoryLabel: category.label,
      billerId: biller!.id,
      billerName: biller!.name,
      customerRef: ref.trim(),
      customerName: lookupValue,
      planLabel,
      amount,
      fee: category.fee,
      // Postpaid meters are settled against the account — no token is issued.
      issues:
        category.issues === 'token' && variantId !== 'prepaid' ? undefined : category.issues,
      pinPrefix: biller!.name,
      pinCount: quantity,
    };
  };

  const onPayFromWallet = () => {
    const problem = validate();
    if (problem) return setError(problem);
    const res = payBill(buildInput());
    if (!res.ok || !res.payment) return setError(res.error ?? 'Payment failed. Try again.');
    router.replace({ pathname: '/bills/receipt', params: { id: res.payment.id } });
  };

  const onPayAtAgent = () => {
    const problem = validate();
    if (problem) return setError(problem);
    const res = requestAgentBillPayment(buildInput());
    if (!res.ok) return setError(res.error ?? 'Could not generate an agent code.');
    router.replace('/bills/agent-code');
  };

  return (
    <Screen>
      <ScreenHeader title={category.label} subtitle={category.caption} />

      {/* Biller */}
      <Text style={styles.sectionLabel}>Select provider</Text>
      <View style={styles.billerGrid}>
        {category.billers.map((b) => (
          <BillerOption
            key={b.id}
            biller={b}
            selected={b.id === billerId}
            onPress={() => { setBillerId(b.id); setError(undefined); }}
          />
        ))}
      </View>

      {/* Variant (meter type) */}
      {!!category.variant && (
        <>
          <Text style={styles.sectionLabel}>{category.variant.label}</Text>
          <View style={styles.chipRow}>
            {category.variant.options.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                selected={o.id === variantId}
                onPress={() => { setVariantId(o.id); setError(undefined); }}
                style={styles.flexChip}
              />
            ))}
          </View>
        </>
      )}

      {/* Customer reference */}
      <Field
        label={category.refField.label}
        placeholder={category.refField.placeholder}
        keyboardType={category.refField.keyboard}
        maxLength={category.refField.maxLength}
        value={ref}
        onChangeText={(t) => { setRef(t); setError(undefined); }}
        style={styles.refInput}
      />

      {lookupPhase !== 'idle' && (
        <View style={[styles.lookup, lookupPhase === 'done' && styles.lookupDone]}>
          {lookupPhase === 'checking' ? (
            <>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.lookupText}>Checking with {biller?.name}…</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={17} color={colors.success} />
              <Text style={[styles.lookupText, styles.lookupName]}>{lookupValue}</Text>
            </>
          )}
        </View>
      )}

      {/* Plans or free amount */}
      {usesPlans ? (
        <>
          <Text style={styles.sectionLabel}>
            {category.quantity ? 'Select PIN type' : 'Select a plan'}
          </Text>
          {plans.map((p) => (
            <PlanRow
              key={p.id}
              plan={p}
              selected={p.id === planId}
              onPress={() => { setPlanId(p.id); setError(undefined); }}
            />
          ))}
        </>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Amount</Text>
          <View style={styles.chipRow}>
            {(category.quickAmounts ?? []).map((q) => (
              <Chip
                key={q}
                label={formatNaira(q)}
                selected={typedAmount === q}
                onPress={() => { setAmountStr(q.toLocaleString('en-US')); setError(undefined); }}
                style={styles.amountChip}
              />
            ))}
          </View>
          <Field
            placeholder="Or enter another amount"
            keyboardType="number-pad"
            value={amountStr}
            onChangeText={onAmountChange}
            left={<Text style={styles.nairaPrefix}>₦</Text>}
            style={styles.refInput}
          />
        </>
      )}

      {/* Quantity */}
      {!!category.quantity && (
        <View style={styles.quantityRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.quantityLabel}>Number of PINs</Text>
            <Text style={styles.quantityHint}>Each PIN is delivered on your receipt</Text>
          </View>
          <Pressable
            onPress={() => { setQuantity((q) => Math.max(1, q - 1)); setError(undefined); }}
            hitSlop={8}
            style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="remove" size={17} color={colors.primary} />
          </Pressable>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <Pressable
            onPress={() => { setQuantity((q) => Math.min(10, q + 1)); setError(undefined); }}
            hitSlop={8}
            style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="add" size={17} color={colors.primary} />
          </Pressable>
        </View>
      )}

      {/* Summary */}
      <Card style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Amount</Text>
          <AmountText amount={amount} decimals={2} size={14} />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {category.fee > 0 ? 'Convenience fee' : 'Convenience fee (free)'}
          </Text>
          <AmountText amount={category.fee} decimals={2} size={14} />
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <AmountText amount={total} decimals={2} size={16} color={colors.primary} />
        </View>
      </Card>

      {!!error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={17} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title={total > 0 ? `Pay ${formatNaira(total)}` : 'Pay from Wallet'}
          onPress={onPayFromWallet}
        />
        <Button
          title="Pay at an Agent"
          variant="ghost"
          icon={<Ionicons name="storefront-outline" size={17} color={colors.primary} />}
          onPress={onPayAtAgent}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: fonts.semibold, fontSize: 13, color: colors.ink,
    marginBottom: spacing.sm, marginTop: spacing.xs,
  },

  billerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  billerCard: {
    width: '31.5%',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: 6,
  },
  billerCardSelected: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  billerName: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.ink, textAlign: 'center' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  flexChip: { flex: 1, justifyContent: 'center' },
  amountChip: { paddingHorizontal: spacing.md },

  refInput: { fontFamily: fonts.mono, fontSize: 15.5 },
  nairaPrefix: { fontFamily: fonts.bold, fontSize: 16, color: colors.primary },

  lookup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  lookupDone: { backgroundColor: colors.successBg },
  lookupText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub },
  lookupName: { fontFamily: fonts.bold, color: colors.ink, letterSpacing: 0.2 },

  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  planRowSelected: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  planLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  planDetail: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  radio: {
    width: 21, height: 21, borderRadius: 11,
    borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  quantityLabel: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  quantityHint: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  stepBtn: {
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: colors.chip,
    alignItems: 'center', justifyContent: 'center',
  },
  quantityValue: { fontFamily: fonts.mono, fontSize: 16, color: colors.ink, minWidth: 22, textAlign: 'center' },

  summary: { marginTop: spacing.lg },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 5,
  },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub },
  summaryTotalLabel: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: { flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.danger, lineHeight: 17 },

  actions: { gap: spacing.md, marginTop: spacing.xl },
});
