import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { daysFromNow, formatDate, formatNaira } from '@/lib/format';
import { getHotel, type HotelRoom } from '@/lib/travel';
import { useStore, type PayBillInput } from '@/store/useStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/tokens';
import {
  AmountText, BrandTile, Button, Card, EmptyState, Screen, ScreenHeader,
} from '@/ui';

const MAX_NIGHTS = 14;
const MAX_GUESTS = 6;
const HOTEL_FEE = 0;

function CounterRow({
  label, hint, value, min, max, onChange,
}: {
  label: string; hint: string; value: number; min: number; max: number;
  onChange: (next: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepperLabel}>{label}</Text>
        <Text style={styles.stepperHint}>{hint}</Text>
      </View>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        hitSlop={8}
        style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}>
        <Ionicons name="remove" size={17} color={colors.primary} />
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        hitSlop={8}
        style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}>
        <Ionicons name="add" size={17} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function RoomRow({
  room, nights, selected, onPress,
}: { room: HotelRoom; nights: number; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.roomRow,
        selected && styles.roomRowSelected,
        pressed && { opacity: 0.85 },
      ]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.roomLabel}>{room.label}</Text>
        <Text style={styles.roomDetail}>{room.detail}</Text>
        <Text style={styles.roomNights}>
          {formatNaira(room.pricePerNight)} × {nights} {nights === 1 ? 'night' : 'nights'}
        </Text>
      </View>
      <AmountText
        amount={room.pricePerNight * nights}
        size={15}
        color={selected ? colors.primary : colors.ink}
      />
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

export default function HotelDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const hotel = getHotel(id);

  const payBill = useStore((s) => s.payBill);
  const requestAgentBillPayment = useStore((s) => s.requestAgentBillPayment);

  const [roomId, setRoomId] = useState(hotel?.rooms[0]?.id ?? '');
  const [checkInOffset, setCheckInOffset] = useState(1);
  const [nights, setNights] = useState(2);
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState<string | undefined>();

  if (!hotel) {
    return (
      <Screen>
        <ScreenHeader title="Hotel" />
        <EmptyState icon="bed-outline" title="Hotel not found" body="Pick another hotel to continue." />
        <Button title="Back to Hotels" onPress={() => router.replace('/bills/hotels')} />
      </Screen>
    );
  }

  const room = hotel.rooms.find((r) => r.id === roomId);
  const checkIn = daysFromNow(checkInOffset, 14, 0);
  const checkOut = daysFromNow(checkInOffset + nights, 11, 0);
  const amount = (room?.pricePerNight ?? 0) * nights;
  const total = amount + HOTEL_FEE;

  const buildInput = (): PayBillInput => ({
    categoryId: 'hotels',
    categoryLabel: 'Hotels',
    billerId: hotel.id,
    billerName: hotel.name,
    customerRef: `${hotel.area}, ${hotel.city}`,
    planLabel: room?.label,
    detail:
      `${nights} ${nights === 1 ? 'night' : 'nights'} · ${guests} ${guests === 1 ? 'guest' : 'guests'} · ` +
      `${formatDate(checkIn)} → ${formatDate(checkOut)}`,
    amount,
    fee: HOTEL_FEE,
  });

  const onPayFromWallet = () => {
    if (!room) return setError('Select a room to continue.');
    const res = payBill(buildInput());
    if (!res.ok || !res.payment) return setError(res.error ?? 'Booking failed. Try again.');
    router.replace({ pathname: '/bills/receipt', params: { id: res.payment.id } });
  };

  const onPayAtAgent = () => {
    if (!room) return setError('Select a room to continue.');
    const res = requestAgentBillPayment(buildInput());
    if (!res.ok) return setError(res.error ?? 'Could not generate an agent code.');
    router.replace('/bills/agent-code');
  };

  return (
    <Screen>
      <ScreenHeader title={hotel.name} />

      <LinearGradient
        colors={gradients.payout}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <Ionicons name="bed" size={92} color={colors.onPrimary} style={styles.heroIcon} />
        <BrandTile name={hotel.name} size={50} />
        <Text style={styles.heroName}>{hotel.name}</Text>
        <Text style={styles.heroMeta}>{hotel.area}, {hotel.city}</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Ionicons name="star" size={13} color={colors.warning} />
            <Text style={styles.heroStatText}>{hotel.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.heroStatText}>
            {hotel.reviews.toLocaleString('en-US')} reviews
          </Text>
        </View>
      </LinearGradient>

      <Text style={styles.about}>{hotel.about}</Text>

      <View style={styles.amenities}>
        {hotel.amenities.map((a) => (
          <View key={a.label} style={styles.amenity}>
            <Ionicons name={a.icon} size={14} color={colors.primary} />
            <Text style={styles.amenityLabel}>{a.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Your stay</Text>
      <Card padded={false} style={styles.stayCard}>
        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepperLabel}>Check-in</Text>
            <Text style={styles.stepperHint}>Check-out {formatDate(checkOut)}</Text>
          </View>
          <Pressable
            onPress={() => setCheckInOffset((d) => Math.max(0, d - 1))}
            hitSlop={8}
            style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="chevron-back" size={16} color={colors.primary} />
          </Pressable>
          <Text style={styles.dateValue}>{formatDate(checkIn)}</Text>
          <Pressable
            onPress={() => setCheckInOffset((d) => Math.min(120, d + 1))}
            hitSlop={8}
            style={({ pressed }) => [styles.stepBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        </View>
        <View style={styles.stayDivider} />
        <CounterRow
          label="Nights"
          hint={`Until ${formatDate(checkOut)}`}
          value={nights}
          min={1}
          max={MAX_NIGHTS}
          onChange={setNights}
        />
        <View style={styles.stayDivider} />
        <CounterRow
          label="Guests"
          hint="Occupancy per room"
          value={guests}
          min={1}
          max={MAX_GUESTS}
          onChange={setGuests}
        />
      </Card>

      <Text style={styles.sectionLabel}>Choose a room</Text>
      {hotel.rooms.map((r) => (
        <RoomRow
          key={r.id}
          room={r}
          nights={nights}
          selected={r.id === roomId}
          onPress={() => { setRoomId(r.id); setError(undefined); }}
        />
      ))}

      <Card style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{room?.label ?? 'Room'} × {nights}</Text>
          <AmountText amount={amount} decimals={2} size={14} />
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Booking fee (free)</Text>
          <AmountText amount={HOTEL_FEE} decimals={2} size={14} />
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
          title={total > 0 ? `Book for ${formatNaira(total)}` : 'Book Room'}
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
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: 4,
    overflow: 'hidden',
  },
  heroIcon: { position: 'absolute', right: -10, bottom: -20, opacity: 0.16 },
  heroName: { fontFamily: fonts.extrabold, fontSize: 19, color: colors.onPrimary, marginTop: spacing.md },
  heroMeta: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.onPrimaryDim },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroStatText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onPrimary },

  about: {
    fontFamily: fonts.medium, fontSize: 13, color: colors.sub,
    lineHeight: 19, marginTop: spacing.lg,
  },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.chip,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  amenityLabel: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.chipText },

  sectionLabel: {
    fontFamily: fonts.bold, fontSize: 15, color: colors.ink,
    marginTop: spacing.xl, marginBottom: spacing.md,
  },

  stayCard: { paddingHorizontal: spacing.lg },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  dateValue: {
    fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink,
    minWidth: 88, textAlign: 'center',
  },
  stayDivider: { height: 1, backgroundColor: colors.border },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  stepperLabel: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  stepperHint: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  stepBtn: {
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: colors.chip,
    alignItems: 'center', justifyContent: 'center',
  },
  stepValue: { fontFamily: fonts.mono, fontSize: 16, color: colors.ink, minWidth: 22, textAlign: 'center' },

  roomRow: {
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
  roomRowSelected: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  roomLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  roomDetail: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  roomNights: { fontFamily: fonts.medium, fontSize: 11, color: colors.faint, marginTop: 3 },
  radio: {
    width: 21, height: 21, borderRadius: 11,
    borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  summary: { marginTop: spacing.md },
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
