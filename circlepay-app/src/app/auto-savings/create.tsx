import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatNaira } from '@/lib/format';
import { accountLabel, firstRunAt, frequencyLabel, planTypeMeta, RUN_HOUR, upcomingRuns } from '@/lib/savings';
import type { Frequency, SavingsPlan, SavingsPlanType } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { BANKS, BankPicker, Button, Card, Field, Screen, ScreenHeader, StepDots } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

const TYPES: SavingsPlanType[] = ['daily', 'weekly', 'instalment'];

const FREQ_FOR: Record<SavingsPlanType, Frequency> = {
  daily: 'daily',
  weekly: 'weekly',
  instalment: 'monthly',
};

/** Outline glyph per plan type — each name checked against the Ionicons glyphmap. */
const TYPE_ICON: Record<SavingsPlanType, keyof typeof Ionicons.glyphMap> = {
  daily: 'wallet-outline',
  weekly: 'people-outline',
  instalment: 'cart-outline',
};

/** Validation messages, keyed so each one renders on the input it belongs to. */
interface Errors {
  name?: string;
  amount?: string;
  endDate?: string;
  account?: string;
}

/** Today at the deduction hour — the default start date. */
function todayISO(): string {
  const d = new Date();
  d.setHours(RUN_HOUR, 0, 0, 0);
  return d.toISOString();
}

/**
 * Parses the optional End Date. This app has no date-picker dependency, so the
 * field takes `YYYY-MM-DD` and reports a bad value instead of swallowing it —
 * otherwise the "must be after the start date" rule could never fire.
 */
function parseEndDate(input: string): { iso?: string; invalid: boolean } {
  const text = input.trim();
  if (!text) return { invalid: false };
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (!m) return { invalid: true };
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(year, month - 1, day, RUN_HOUR, 0, 0, 0);
  // Rejects 2026-13-40, which Date would otherwise silently roll forward.
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return { invalid: true };
  }
  return { iso: d.toISOString(), invalid: false };
}

/** 4-step Create Automated Savings Plan wizard, then the dark success state. */
export default function CreateAutoSavings() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const initialType = TYPES.find((t) => t === params.type) ?? 'daily';

  const circles = useStore((s) => s.circles);
  const partPayPlans = useStore((s) => s.plans);
  const linkedAccounts = useStore((s) => s.linkedAccounts);
  const linkAccount = useStore((s) => s.linkAccount);
  const createSavingsPlan = useStore((s) => s.createSavingsPlan);

  const [step, setStep] = useState(0);
  const [created, setCreated] = useState<SavingsPlan | null>(null);

  const [type, setType] = useState<SavingsPlanType>(initialType);
  const [name, setName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [baseFrequency, setBaseFrequency] = useState<Frequency>(FREQ_FOR[initialType]);
  const [startDate] = useState(todayISO);
  const [endInput, setEndInput] = useState('');
  const [circleId, setCircleId] = useState<string | undefined>(undefined);
  const [partPayId, setPartPayId] = useState<string | undefined>(undefined);
  const [accountId, setAccountId] = useState<string | undefined>(linkedAccounts[0]?.id);
  const [linking, setLinking] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Errors>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A mid-link unmount must not land setState on a dead component.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  /**
   * A linked commitment owns the money: amount and cadence are read straight off
   * that record every render rather than mirrored into state, so a circle-linked
   * plan can never be created contributing anything but `amountPerMember`.
   */
  const linkedCircle = circles.find((c) => c.id === circleId);
  const linkedPlan = partPayPlans.find((p) => p.id === partPayId);
  const locked = !!(linkedCircle ?? linkedPlan);
  const frequency: Frequency = linkedCircle?.frequency ?? linkedPlan?.frequency ?? baseFrequency;
  const amountNum = linkedCircle
    ? linkedCircle.amountPerMember
    : linkedPlan
      ? linkedPlan.installmentAmount
      : Number(amountInput.replace(/[^\d.]/g, ''));
  const amountValue = locked ? String(amountNum) : amountInput;

  const endParsed = parseEndDate(endInput);
  const endDate = endParsed.iso;
  const nextRunAt = firstRunAt(startDate, frequency);
  // Previewed on step 3 — empty when an end date lands before the first run.
  const previewRuns = upcomingRuns({ nextRunAt, frequency, endDate }, 6);
  const account = linkedAccounts.find((a) => a.id === accountId);
  const destination = linkedCircle
    ? linkedCircle.name
    : linkedPlan
      ? linkedPlan.title
      : 'CirclePay AI Wallet';

  /**
   * Circles whose cadence matches the plan, for the optional link picker.
   * Left to the React Compiler rather than `useMemo` — a manual dependency list
   * over the derived `frequency` trips `react-hooks/preserve-manual-memoization`.
   */
  const linkableCircles = type === 'instalment' ? [] : circles.filter((c) => c.frequency === frequency);
  const linkablePlans = type === 'instalment' ? partPayPlans.filter((p) => p.status === 'active') : [];

  /** Review rows, in the order the mockup lists them. */
  const summaryRows: [string, string][] = [
    ['Plan Name', name.trim()],
    ['Type', planTypeMeta[type].label],
    ['Frequency', frequencyLabel(frequency)],
    ['Amount', formatNaira(amountNum, 2)],
    ['Start Date', formatDate(startDate)],
    ['End Date', endDate ? formatDate(endDate) : 'No end date'],
    ['Debit From', account ? accountLabel(account) : '—'],
    ['Funds', destination],
  ];

  const chooseType = (t: SavingsPlanType) => {
    setType(t);
    setBaseFrequency(FREQ_FOR[t]);
    setCircleId(undefined);
    setPartPayId(undefined);
  };

  const chooseCircle = (id: string) => {
    if (circleId === id) {
      setCircleId(undefined);
      return;
    }
    const c = circles.find((x) => x.id === id);
    if (!c) return;
    setCircleId(id);
    setPartPayId(undefined);
    setAmountInput(String(c.amountPerMember));
    setErrors((e) => ({ ...e, amount: undefined }));
    if (!name.trim()) setName(`${planTypeMeta[type].label} – ${c.name}`);
  };

  const choosePlan = (id: string) => {
    if (partPayId === id) {
      setPartPayId(undefined);
      return;
    }
    const p = partPayPlans.find((x) => x.id === id);
    if (!p) return;
    setPartPayId(id);
    setCircleId(undefined);
    setAmountInput(String(p.installmentAmount));
    setErrors((e) => ({ ...e, amount: undefined }));
    if (!name.trim()) setName(`Instalment – ${p.title}`);
  };

  const validateStep1 = (): boolean => {
    const found: Errors = {};
    if (!name.trim()) found.name = 'Give your plan a name';
    if (!amountNum || amountNum <= 0) found.amount = 'Enter an amount to deduct';
    if (endParsed.invalid) found.endDate = 'Use the date format YYYY-MM-DD';
    else if (endDate && new Date(endDate).getTime() <= new Date(startDate).getTime()) {
      found.endDate = 'End date must be after the start date';
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const next = () => {
    if (step === 0) {
      if (!validateStep1()) return;
    } else if (step === 1 && !accountId) {
      setErrors({ account: 'Choose an account to debit' });
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const back = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setErrors({});
    setStep((s) => s - 1);
  };

  const startLink = (bank: string) => {
    if (linking) return;
    setLinking(bank);
    // Simulated Open Banking handshake, same 1.4s as circles/link-bank.
    timer.current = setTimeout(() => {
      linkAccount(bank);
      const newest = useStore.getState().linkedAccounts.at(-1);
      setLinking(undefined);
      if (newest) {
        setAccountId(newest.id);
        setErrors((e) => ({ ...e, account: undefined }));
      }
    }, 1400);
  };

  const submit = () => {
    if (!accountId) {
      setStep(1);
      setErrors({ account: 'Choose an account to debit' });
      return;
    }
    setCreated(
      createSavingsPlan({
        name: name.trim(),
        type,
        amount: amountNum,
        frequency,
        accountId,
        startDate,
        endDate,
        circleId,
        partPayId,
      })
    );
  };

  if (created) {
    return (
      <Screen backgroundColor={colors.primaryDeep}>
        <View style={styles.successWrap}>
          <View style={styles.successCheck}>
            <Ionicons name="checkmark" size={34} color={colors.onPrimary} />
          </View>
          <Text style={styles.successTitle}>Plan Created Successfully!</Text>
          <Text style={styles.successBody}>
            Your {planTypeMeta[created.type].label} Plan has been set up and is now active.
          </Text>

          <Card style={styles.successCard}>
            <View style={styles.successRow}>
              <IconBubble name="sync-circle-outline" color={colors.success} bg={colors.successBg} />
              <View style={styles.grow}>
                <Text style={styles.successPlan}>{created.name}</Text>
                <Text style={styles.successMeta}>
                  {formatNaira(created.amount, 2)} · {frequencyLabel(created.frequency)}
                </Text>
              </View>
            </View>
            <Text style={styles.successDetail}>Starts on: {formatDate(created.startDate)}</Text>
            <Text style={styles.successDetail}>Next deduction: 08:00 AM</Text>
          </Card>

          <Button title="Done" onPress={() => router.replace('/auto-savings')} style={styles.doneBtn} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Create Automated Savings Plan" />
      <View style={styles.rail}>
        <StepDots count={4} current={step} />
      </View>

      {step === 0 && (
        <>
          <Text style={styles.legend}>Select Plan Type</Text>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => chooseType(t)}
              accessibilityRole="radio"
              accessibilityState={{ selected: type === t }}
              style={({ pressed }) => [
                styles.typeCard,
                type === t && styles.typeCardOn,
                pressed && styles.pressed,
              ]}>
              <IconBubble name={TYPE_ICON[t]} />
              <View style={styles.grow}>
                <Text style={styles.typeTitle}>{planTypeMeta[t].label}</Text>
                <Text style={styles.typeBlurb}>{planTypeMeta[t].blurb}</Text>
              </View>
              <Ionicons
                name={type === t ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={type === t ? colors.primary : colors.faint}
              />
            </Pressable>
          ))}

          <Text style={styles.legend}>Plan Details</Text>
          <Field
            label="Plan Name"
            placeholder="e.g Daily Personal Savings"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
            }}
            error={errors.name}
          />
          <Field
            label="Amount to Deduct"
            placeholder="1,000"
            keyboardType="numeric"
            value={amountValue}
            onChangeText={(t) => {
              setAmountInput(t);
              if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
            }}
            left={<Text style={styles.naira}>₦</Text>}
            editable={!locked}
            error={errors.amount}
            hint={locked ? 'Set by the commitment you linked' : undefined}
          />
          <Field
            label="Deduction Frequency"
            value={frequencyLabel(frequency)}
            editable={false}
            hint={locked ? 'Matches the commitment you linked' : undefined}
          />
          <Field
            label="Start Date"
            value={formatDate(startDate)}
            editable={false}
            hint="Deductions run at 08:00"
          />
          <Field
            label="End Date (Optional)"
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            value={endInput}
            onChangeText={(t) => {
              setEndInput(t);
              if (errors.endDate) setErrors((e) => ({ ...e, endDate: undefined }));
            }}
            error={errors.endDate}
            hint="Leave blank for no end date"
            right={
              endInput ? (
                <Pressable
                  onPress={() => {
                    setEndInput('');
                    setErrors((e) => ({ ...e, endDate: undefined }));
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear end date">
                  <Ionicons name="close-circle" size={18} color={colors.faint} />
                </Pressable>
              ) : (
                <Ionicons name="calendar-outline" size={18} color={colors.faint} />
              )
            }
          />

          {(linkableCircles.length > 0 || linkablePlans.length > 0) && (
            <>
              <Text style={styles.legend}>Fund an existing commitment (optional)</Text>
              {linkableCircles.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => chooseCircle(c.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: circleId === c.id }}
                  style={({ pressed }) => [
                    styles.linkRow,
                    circleId === c.id && styles.typeCardOn,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.linkName}>{c.name}</Text>
                  <Text style={styles.linkMeta}>
                    {formatNaira(c.amountPerMember)} · {c.frequency}
                  </Text>
                </Pressable>
              ))}
              {linkablePlans.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => choosePlan(p.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: partPayId === p.id }}
                  style={({ pressed }) => [
                    styles.linkRow,
                    partPayId === p.id && styles.typeCardOn,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.linkName}>{p.title}</Text>
                  <Text style={styles.linkMeta}>
                    {formatNaira(p.installmentAmount)} · {p.frequency}
                  </Text>
                </Pressable>
              ))}
            </>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.legend}>Debit From</Text>
          {linkedAccounts.length === 0 && (
            <Text style={styles.emptyText}>No accounts linked yet — pick a bank below.</Text>
          )}
          {linkedAccounts.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => {
                setAccountId(a.id);
                if (errors.account) setErrors((e) => ({ ...e, account: undefined }));
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: accountId === a.id }}
              style={({ pressed }) => [
                styles.linkRow,
                accountId === a.id && styles.typeCardOn,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.linkName}>{accountLabel(a)}</Text>
              {!!a.purpose && <Text style={styles.linkMeta}>{a.purpose}</Text>}
            </Pressable>
          ))}

          <Text style={styles.legend}>Or link a new bank</Text>
          <BankPicker banks={BANKS} busy={linking} onSelect={startLink} />
          <View style={styles.secureRow}>
            <Ionicons name="lock-closed" size={13} color={colors.success} />
            <Text style={styles.secureText}>Your data is encrypted and secure</Text>
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.legend}>Deduction Schedule</Text>
          <Card>
            <Text style={styles.scheduleLabel}>Next Deduction</Text>
            <Text style={styles.scheduleValue}>{formatDate(nextRunAt)} · 08:00 AM</Text>
            <View style={styles.flowRow}>
              <Ionicons name="business-outline" size={16} color={colors.sub} />
              <Text style={styles.flowText}>From {account ? accountLabel(account) : '—'}</Text>
            </View>
            <View style={styles.flowRow}>
              <Ionicons name="arrow-down" size={16} color={colors.primary} />
              <Text style={styles.flowText}>To {destination}</Text>
            </View>
          </Card>

          <Text style={styles.legend}>Next deductions</Text>
          {previewRuns.length === 0 ? (
            <Text style={styles.emptyText}>
              Your end date falls before the first deduction — nothing would be deducted.
            </Text>
          ) : (
            <Card padded={false} style={styles.group}>
              {previewRuns.map((iso) => (
                <View key={iso} style={styles.upcomingRow}>
                  <Text style={styles.upcomingDate}>{formatDate(iso)}</Text>
                  <Text style={styles.upcomingAmount}>{formatNaira(amountNum, 2)}</Text>
                </View>
              ))}
            </Card>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.legend}>Plan Summary</Text>
          <Card padded={false} style={styles.group}>
            {summaryRows.map(([label, value]) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue}>{value}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {!!errors.account && <Text style={styles.error}>{errors.account}</Text>}

      <View style={styles.actions}>
        <Button title="Back" variant="secondary" onPress={back} style={styles.backBtn} />
        <Button
          title={step === 3 ? 'Create Plan' : 'Continue'}
          onPress={step === 3 ? submit : next}
          disabled={!!linking}
          style={styles.nextBtn}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rail: { marginBottom: spacing.xl },
  grow: { flex: 1 },
  pressed: { opacity: 0.8 },
  legend: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  typeCardOn: { borderColor: colors.primary, backgroundColor: colors.chip },
  typeTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  typeBlurb: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  naira: { fontFamily: fonts.mono, fontSize: 14, color: colors.sub },
  linkRow: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  linkName: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  linkMeta: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.sub,
    marginBottom: spacing.sm,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  secureText: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.sub },
  scheduleLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub },
  scheduleValue: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, marginTop: 3 },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  flowText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.ink, flexShrink: 1 },
  group: { paddingHorizontal: spacing.lg },
  upcomingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  upcomingDate: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.ink },
  upcomingAmount: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.ink },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub },
  summaryValue: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  error: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.danger, marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  backBtn: { flex: 1 },
  nextBtn: { flex: 1.4 },
  successWrap: { alignItems: 'center', paddingTop: spacing.xxl },
  successCheck: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 21,
    color: colors.onPrimary,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  successBody: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.onPrimaryDim,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  successCard: { width: '100%', marginTop: spacing.xxl },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  successPlan: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  successMeta: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  successDetail: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub, marginTop: spacing.sm },
  doneBtn: { marginTop: spacing.xl, alignSelf: 'stretch' },
});
