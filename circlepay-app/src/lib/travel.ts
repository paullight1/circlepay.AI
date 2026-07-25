/**
 * Hotel and transport inventory for the two booking categories of Bills.
 *
 * Kept out of `billers.ts` because these browse-and-book flows have their own
 * shape — rooms, nights and seat classes rather than a customer reference.
 * Trip results are synthesised deterministically from the route, so any
 * origin/destination pair returns the same believable set of options.
 */
import { Ionicons } from '@expo/vector-icons';

export interface HotelRoom {
  id: string;
  label: string;          // "Deluxe Room"
  detail: string;         // "King bed · Breakfast included"
  pricePerNight: number;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  area: string;           // "Victoria Island"
  rating: number;         // 4.7
  reviews: number;
  about: string;
  amenities: { icon: keyof typeof Ionicons.glyphMap; label: string }[];
  rooms: HotelRoom[];
}

export const HOTEL_CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Enugu'] as const;

export const HOTELS: Hotel[] = [
  {
    id: 'h-eko-grand',
    name: 'Eko Grand Suites',
    city: 'Lagos',
    area: 'Victoria Island',
    rating: 4.7,
    reviews: 1284,
    about:
      'Lagoon-facing suites minutes from the business district, with a rooftop pool and 24-hour power.',
    amenities: [
      { icon: 'wifi', label: 'Free Wi-Fi' },
      { icon: 'restaurant', label: 'Breakfast' },
      { icon: 'water', label: 'Pool' },
      { icon: 'car', label: 'Parking' },
    ],
    rooms: [
      { id: 'r-std', label: 'Standard Room', detail: 'Queen bed · 1 guest', pricePerNight: 85000 },
      { id: 'r-dlx', label: 'Deluxe Room', detail: 'King bed · Breakfast included', pricePerNight: 128000 },
      { id: 'r-suite', label: 'Executive Suite', detail: 'Lounge · Lagoon view', pricePerNight: 210000 },
    ],
  },
  {
    id: 'h-ikeja-crown',
    name: 'Ikeja Crown Hotel',
    city: 'Lagos',
    area: 'Ikeja GRA',
    rating: 4.4,
    reviews: 902,
    about:
      'Ten minutes from the airport, built for early flights and long working days.',
    amenities: [
      { icon: 'wifi', label: 'Free Wi-Fi' },
      { icon: 'airplane', label: 'Airport shuttle' },
      { icon: 'barbell', label: 'Gym' },
      { icon: 'restaurant', label: 'Breakfast' },
    ],
    rooms: [
      { id: 'r-std', label: 'Classic Room', detail: 'Double bed · 2 guests', pricePerNight: 62000 },
      { id: 'r-dlx', label: 'Business Room', detail: 'Work desk · Breakfast', pricePerNight: 94000 },
      { id: 'r-suite', label: 'Crown Suite', detail: 'Separate living area', pricePerNight: 155000 },
    ],
  },
  {
    id: 'h-maitama-grand',
    name: 'Maitama Grand',
    city: 'Abuja',
    area: 'Maitama',
    rating: 4.8,
    reviews: 2140,
    about:
      'Quiet grounds in the diplomatic quarter, with conference halls and a garden restaurant.',
    amenities: [
      { icon: 'wifi', label: 'Free Wi-Fi' },
      { icon: 'business', label: 'Conference' },
      { icon: 'water', label: 'Pool' },
      { icon: 'shield-checkmark', label: '24h security' },
    ],
    rooms: [
      { id: 'r-std', label: 'Superior Room', detail: 'Queen bed · Garden view', pricePerNight: 98000 },
      { id: 'r-dlx', label: 'Diplomat Room', detail: 'King bed · Breakfast included', pricePerNight: 146000 },
      { id: 'r-suite', label: 'Presidential Suite', detail: 'Two bedrooms · Butler', pricePerNight: 320000 },
    ],
  },
  {
    id: 'h-wuse-park',
    name: 'Wuse Park Hotel',
    city: 'Abuja',
    area: 'Wuse 2',
    rating: 4.2,
    reviews: 611,
    about:
      'Straightforward comfort in the middle of Wuse, walking distance to the market and offices.',
    amenities: [
      { icon: 'wifi', label: 'Free Wi-Fi' },
      { icon: 'restaurant', label: 'Restaurant' },
      { icon: 'car', label: 'Parking' },
    ],
    rooms: [
      { id: 'r-std', label: 'Standard Room', detail: 'Double bed · 2 guests', pricePerNight: 45000 },
      { id: 'r-dlx', label: 'Deluxe Room', detail: 'King bed · Breakfast', pricePerNight: 72000 },
    ],
  },
  {
    id: 'h-rivers-pearl',
    name: 'Rivers Pearl Hotel',
    city: 'Port Harcourt',
    area: 'GRA Phase 2',
    rating: 4.3,
    reviews: 748,
    about:
      'A calm base in old GRA with generator-backed power and a well-reviewed kitchen.',
    amenities: [
      { icon: 'wifi', label: 'Free Wi-Fi' },
      { icon: 'restaurant', label: 'Breakfast' },
      { icon: 'flash', label: '24h power' },
    ],
    rooms: [
      { id: 'r-std', label: 'Standard Room', detail: 'Queen bed · 1 guest', pricePerNight: 52000 },
      { id: 'r-dlx', label: 'Pearl Deluxe', detail: 'King bed · Breakfast included', pricePerNight: 88000 },
    ],
  },
  {
    id: 'h-udi-lake',
    name: 'Udi Lake Resort',
    city: 'Enugu',
    area: 'Independence Layout',
    rating: 4.1,
    reviews: 465,
    about:
      'Lakeside chalets on the edge of the city — the quiet option for a weekend away.',
    amenities: [
      { icon: 'wifi', label: 'Free Wi-Fi' },
      { icon: 'water', label: 'Lake view' },
      { icon: 'restaurant', label: 'Restaurant' },
      { icon: 'car', label: 'Parking' },
    ],
    rooms: [
      { id: 'r-std', label: 'Garden Chalet', detail: 'Double bed · 2 guests', pricePerNight: 38000 },
      { id: 'r-dlx', label: 'Lakeside Chalet', detail: 'King bed · Lake view', pricePerNight: 64000 },
    ],
  },
];

export function getHotel(id: string | undefined): Hotel | undefined {
  return HOTELS.find((h) => h.id === id);
}

/** Cheapest nightly rate, for the "from ₦x" line on browse cards. */
export function hotelFromPrice(hotel: Hotel): number {
  return Math.min(...hotel.rooms.map((r) => r.pricePerNight));
}

// ── Transport ──────────────────────────────────────────────────────────────

export type TripMode = 'flight' | 'bus';

export interface TripClass {
  id: string;
  label: string;
  amount: number;
}

export interface Trip {
  id: string;
  mode: TripMode;
  operator: string;
  operatorId: string;
  from: string;
  to: string;
  departTime: string;     // "07:30"
  arriveTime: string;     // "08:45"
  durationLabel: string;  // "1h 15m"
  classes: TripClass[];
}

export const TRIP_CITIES = [
  'Lagos', 'Abuja', 'Port Harcourt', 'Enugu', 'Kano', 'Owerri', 'Benin City', 'Ibadan',
] as const;

const AIRLINES = [
  { id: 'air-peace', name: 'Air Peace' },
  { id: 'ibom-air', name: 'Ibom Air' },
  { id: 'arik-air', name: 'Arik Air' },
  { id: 'green-africa', name: 'Green Africa' },
];

const BUS_LINES = [
  { id: 'gig', name: 'GIG Motors' },
  { id: 'abc', name: 'ABC Transport' },
  { id: 'gigm-plus', name: 'God is Good Motors' },
  { id: 'young-shall-grow', name: 'Young Shall Grow' },
];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

/** minutes-from-midnight → "07:30" */
function clock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Deterministic result set for a route and date — four operators with
 * staggered departures and fares that stay put when the screen re-renders.
 */
export function searchTrips(mode: TripMode, from: string, to: string, dateIso: string): Trip[] {
  const operators = mode === 'flight' ? AIRLINES : BUS_LINES;
  const seed = hash(`${mode}|${from}|${to}|${dateIso.slice(0, 10)}`);
  return operators.map((op, i) => {
    const h = hash(`${seed}-${op.id}`);
    const depart = mode === 'flight' ? 6 * 60 + ((h % 12) * 70) % 720 : 5 * 60 + ((h % 10) * 90) % 600;
    const travel = mode === 'flight' ? 65 + (h % 40) : 360 + (h % 5) * 60 + (h % 4) * 15;
    const base = mode === 'flight' ? 85000 + (h % 12) * 4500 : 18000 + (h % 10) * 1800;
    const classes: TripClass[] =
      mode === 'flight'
        ? [
            { id: 'economy', label: 'Economy', amount: base },
            { id: 'premium', label: 'Premium Economy', amount: Math.round(base * 1.45) },
            { id: 'business', label: 'Business', amount: Math.round(base * 2.2) },
          ]
        : [
            { id: 'standard', label: 'Standard', amount: base },
            { id: 'executive', label: 'Executive', amount: Math.round(base * 1.35) },
          ];
    return {
      id: `${mode}-${op.id}-${i}`,
      mode,
      operator: op.name,
      operatorId: op.id,
      from,
      to,
      departTime: clock(depart),
      arriveTime: clock(depart + travel),
      durationLabel: duration(travel),
      classes,
    };
  });
}
