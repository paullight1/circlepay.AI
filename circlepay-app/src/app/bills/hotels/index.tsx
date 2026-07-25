import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatNaira } from '@/lib/format';
import { HOTELS, HOTEL_CITIES, hotelFromPrice, type Hotel } from '@/lib/travel';
import { colors, fonts, gradients, radius, spacing } from '@/theme/tokens';
import { BrandTile, Card, Chip, EmptyState, Screen, ScreenHeader } from '@/ui';

function HotelCard({ hotel, onPress }: { hotel: Hotel; onPress: () => void }) {
  return (
    <Card onPress={onPress} padded={false} style={styles.card}>
      <LinearGradient
        colors={gradients.payout}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}>
        <Ionicons name="bed" size={70} color={colors.onPrimary} style={styles.bannerIcon} />
        <BrandTile name={hotel.name} size={46} />
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={12} color={colors.warning} />
          <Text style={styles.ratingText}>{hotel.rating.toFixed(1)}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{hotel.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.sub} />
          <Text style={styles.meta}>{hotel.area}, {hotel.city}</Text>
        </View>
        <View style={styles.priceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.priceLabel}>from</Text>
            <Text style={styles.price}>
              {formatNaira(hotelFromPrice(hotel))}
              <Text style={styles.priceUnit}> / night</Text>
            </Text>
          </View>
          <Text style={styles.reviews}>{hotel.reviews.toLocaleString('en-US')} reviews</Text>
          <Ionicons name="chevron-forward" size={17} color={colors.faint} />
        </View>
      </View>
    </Card>
  );
}

export default function HotelBrowse() {
  const router = useRouter();
  const [city, setCity] = useState<string>('all');

  const results = HOTELS.filter((h) => city === 'all' || h.city === city);

  return (
    <Screen>
      <ScreenHeader title="Hotels" subtitle="Book a room and pay from your wallet" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        <Chip label="All cities" selected={city === 'all'} onPress={() => setCity('all')} />
        {HOTEL_CITIES.map((c) => (
          <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />
        ))}
      </ScrollView>

      {results.length === 0 ? (
        <EmptyState
          icon="bed-outline"
          title="No hotels in this city yet"
          body="Try another city — we are adding partners every week."
        />
      ) : (
        results.map((h) => (
          <HotelCard
            key={h.id}
            hotel={h}
            onPress={() => router.push({ pathname: '/bills/hotels/[id]', params: { id: h.id } })}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.lg },

  card: { marginBottom: spacing.md, overflow: 'hidden' },
  banner: {
    height: 92,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerIcon: { position: 'absolute', right: -6, bottom: -14, opacity: 0.18 },
  ratingPill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingText: { fontFamily: fonts.bold, fontSize: 12, color: colors.onPrimary },

  body: { padding: spacing.lg },
  name: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  priceLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.faint },
  price: { fontFamily: fonts.mono, fontSize: 16, color: colors.primary },
  priceUnit: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub },
  reviews: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.faint },
});
