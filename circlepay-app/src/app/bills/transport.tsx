import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getCategory } from '@/lib/billers';
import { daysFromNow, formatDate, formatNaira } from '@/lib/format';
import { searchTrips, TRIP_CITIES, type Trip, type TripMode } from '@/lib/travel';
import { useStore, type PayBillInput } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import {
  AmountText, BrandTile, Button, Card, Chip, EmptyState, Screen, ScreenHeader,
} from '@/ui';

const TRANSPORT_FEE = getCategory('transport')?.fee ?? 0;

interface Query {
  mode: TripMode;
  from: string;
  to: string;
  date: string;
}

/** Horizontal city picker used for both origin and destination. */
function CityRow({
  value, exclude, onSelect,
}: { value: string; exclude: string; onSelect: (city: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityRow}>
      {TRIP_CITIES.filter((c) => c !== exclude).map((c) => (
        <Chip key={c} label={c} selected={c === value} onPress={() => onSelect(c)} />
      ))}
    </ScrollView>
  );
}

function TripCard({
  trip, selected, onPress,
}: { trip: Trip; selected: boolean; onPress: () => void }) {
  const cheapest = Math.min(...trip.classes.map((c) => c.amount));
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tripCard,
        selected && styles.tripCardSelected,
        pressed && { opacity: 0.85 },
      ]}>
      <BrandTile name={trip.operator} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={styles.tripOperator} numberOfLines={1}>{trip.operator}</Text>
        <View style={styles.tripTimes}>
          <Text style={styles.tripTime}>{trip.departTime}</Text>
          <View style={styles.tripLine} />
          <Text style={styles.tripDuration}>{trip.durationLabel}</Text>
          <View style={styles.tripLine} />
          <Text style={styles.tripTime}>{trip.arriveTime}</Text>
        </View>
      </View>
      <View style={styles.tripPrice}>
        <Text style={styles.tripPriceLabel}>from</Text>
        <AmountText amount={cheapest} size={14} color={selected ? colors.primary : colors.ink} />
      </View>
    </Pressable>
  );
}

export default function TransportScreen() {
  const router = useRouter();
  const payBill = useStore((s) => s.payBill);
  const requestAgentBillPayment = useStore((s) => s.requestAgentBillPayment);

  const [mode, setMode] = useState<TripMode>('flight');
  const [from, setFrom] = useState('Lagos');
  const [to, setTo] = useState('Abuja');
  const [dayOffset, setDayOffset] = useState(1);
  const [query, setQuery] = useState<Query | null>(null);
  const [tripId, setTripId] = useState('');
  const [classId, setClassId] = useState('');
  const [error, setError] = useState<string | undefined>();

  const travelDate = daysFromNow(dayOffset, 8, 0);
  const results = useMemo(
    () => (query ? searchTrips(query.mode, query.from, query.to, query.date) : []),
    [query]
  );
  const trip = results.find((t) => t.id === tripId);
  const seat = trip?.classes.find((c) => c.id === classId);
  const amount = seat?.amount ?? 0;
  const total = amount > 0 ? amount + TRANSPORT_FEE : 0;

  const onSearch = () => {
    if (from === to) return setError('Choose two different cities.');
    setError(undefined);
    setTripId('');
    setClassId('');
    setQuery({ mode, from, to, date: travelDate });
  };

  const onSelectTrip = (t: Trip) => {
    setTripId(t.id);
    setClassId(t.classes[0]?.id ?? '');
    setError(undefined);
  };

  const onSwap = () => {
    setFrom(to);
    setTo(from);
    setQuery(null);
    setTripId('');
  };

  const buildInput = (): PayBillInput => ({
    categoryId: 'transport',
    categoryLabel: mode === 'flight' ? 'Flight' : 'Bus ticket',
    billerId: trip!.operatorId,
    billerName: trip!.operator,
    customerRef: `${trip!.from} → ${trip!.to}`,
    planLabel: seat!.label,
    detail:
      `${trip!.departTime}–${trip!.arriveTime} · ${trip!.durationLabel} · ` +
      `${formatDate(query!.date)}`,
    amount,
    fee: TRANSPORT_FEE,
  });

  const onPayFromWallet = () => {
    if (!trip || !seat) return setError('Select a trip and seat class to continue.');
    const res = payBill(buildInput());
    if (!res.ok || !res.payment) return setError(res.error ?? 'Booking failed. Try again.');
    router.replace({ pathname: '/bills/receipt', params: { id: res.payment.id } });
  };

  const onPayAtAgent = () => {
    if (!trip || !seat) return setError('Select a trip and seat class to continue.');
    const res = requestAgentBillPayment(buildInput());
    if (!res.ok) return setError(res.error ?? 'Could not generate an agent code.');
    router.replace('/bills/agent-code');
  };

  return (
    <Screen>
      <ScreenHeader title="Transport" subtitle="Flights and interstate bus tickets" />

      <View style={styles.modeRow}>
        <Chip
          label="Flights"
          selected={mode === 'flight'}
          icon={<Ionicons name="airplane" size={14} color={mode === 'flight' ? colors.primary : colors.sub} />}
          onPress={() => { setMode('flight'); setQuery(null); setTripId(''); }}
          style={styles.modeChip}
        />
        <Chip
          label="Buses"
          selected={mode === 'bus'}
          icon={<Ionicons name="bus" size={14} color={mode === 'bus' ? colors.primary : colors.sub} />}
          onPress={() => { setMode('bus'); setQuery(null); setTripId(''); }}
          style={styles.modeChip}
        />
      </View>

      <Card padded={false} style={styles.searchCard}>
        <View style={styles.fieldBlock}>
          <View style={styles.fieldHead}>
            <Text style={styles.fieldLabel}>From</Text>
            <Pressable onPress={onSwap} hitSlop={10} style={({ pressed }) => [styles.swapBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="swap-vertical" size={16} color={colors.primary} />
            </Pressable>
          </View>
          <CityRow value={from} exclude={to} onSelect={(c) => { setFrom(c); setQuery(null); setTripId(''); }} />
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>To</Text>
          <CityRow value={to} exclude={from} onSelect={(c) => { setTo(c); setQuery(null); setTripId(''); }} />
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Travel date</Text>
            <Text style={styles.dateHint}>
              {dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : `In ${dayOffset} days`}
            </Text>
          </View>
          <Pressable
            onPress={() => { setDayOffset((d) => Math.max(0, d - 1)); setQuery(null); setTripId(''); }}
            hitSlop={8}
            style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="chevron-back" size={16} color={colors.primary} />
          </Pressable>
          <Text style={styles.dateValue}>{formatDate(travelDate)}</Text>
          <Pressable
            onPress={() => { setDayOffset((d) => Math.min(90, d + 1)); setQuery(null); setTripId(''); }}
            hitSlop={8}
            style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        </View>
      </Card>

      <Button
        title={mode === 'flight' ? 'Search Flights' : 'Search Buses'}
        icon={<Ionicons name="search" size={17} color={colors.onPrimary} />}
        onPress={onSearch}
        style={styles.searchBtn}
      />

      {!query ? (
        <EmptyState
          icon={mode === 'flight' ? 'airplane-outline' : 'bus-outline'}
          title="Pick a route to begin"
          body="Choose where you are leaving from, where you are going, and the day you travel."
        />
      ) : (
        <>
          <Text style={styles.resultsLabel}>
            {results.length} {mode === 'flight' ? 'flights' : 'trips'} · {query.from} → {query.to}
          </Text>
          {results.map((t) => (
            <TripCard key={t.id} trip={t} selected={t.id === tripId} onPress={() => onSelectTrip(t)} />
          ))}
        </>
      )}

      {!!trip && (
        <>
          <Text style={styles.sectionLabel}>Seat class</Text>
          <View style={styles.classRow}>
            {trip.classes.map((c) => (
              <Chip
                key={c.id}
                label={`${c.label} · ${formatNaira(c.amount)}`}
                selected={c.id === classId}
                onPress={() => { setClassId(c.id); setError(undefined); }}
              />
            ))}
          </View>

          <Card style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{seat?.label ?? 'Fare'}</Text>
              <AmountText amount={amount} decimals={2} size={14} />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Booking fee</Text>
              <AmountText amount={TRANSPORT_FEE} decimals={2} size={14} />
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <AmountText amount={total} decimals={2} size={16} color={colors.primary} />
            </View>
          </Card>
        </>
      )}

      {!!error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={17} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!!trip && (
        <View style={styles.actions}>
          <Button title={`Pay ${formatNaira(total)}`} onPress={onPayFromWallet} />
          <Button
            title="Pay at an Agent"
            variant="ghost"
            icon={<Ionicons name="storefront-outline" size={17} color={colors.primary} />}
            onPress={onPayAtAgent}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  modeChip: { flex: 1, justifyContent: 'center' },

  searchCard: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  fieldBlock: { paddingVertical: spacing.md },
  fieldHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.sub },
  swapBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.chip,
    alignItems: 'center', justifyContent: 'center',
  },
  cityRow: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm },
  cardDivider: { height: 1, backgroundColor: colors.border },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  dateHint: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.faint, marginTop: 2 },
  dateValue: {
    fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink,
    minWidth: 88, textAlign: 'center',
  },
  stepBtn: {
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: colors.chip,
    alignItems: 'center', justifyContent: 'center',
  },

  searchBtn: { marginTop: spacing.lg, marginBottom: spacing.md },

  resultsLabel: {
    fontFamily: fonts.semibold, fontSize: 12.5, color: colors.sub,
    marginTop: spacing.md, marginBottom: spacing.sm,
  },
  tripCard: {
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
  tripCardSelected: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  tripOperator: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  tripTimes: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  tripTime: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
  tripLine: { flex: 1, height: 1, backgroundColor: colors.borderStrong, maxWidth: 18 },
  tripDuration: { fontFamily: fonts.medium, fontSize: 11, color: colors.sub },
  tripPrice: { alignItems: 'flex-end' },
  tripPriceLabel: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.faint },

  sectionLabel: {
    fontFamily: fonts.bold, fontSize: 15, color: colors.ink,
    marginTop: spacing.xl, marginBottom: spacing.md,
  },
  classRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  summary: { marginTop: spacing.lg },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: spacing.md, paddingVertical: 5,
  },
  summaryLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.sub },
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
