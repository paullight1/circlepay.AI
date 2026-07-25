/**
 * Biller catalogue for the Bills feature.
 *
 * Pure data plus a few helpers — no React — so the pay screens stay generic:
 * adding a network, a disco or a TV package is a data edit, not a code change.
 * Seven of the nine categories share one screen (`bills/[category]`); hotels and
 * transport browse-and-book instead, and keep only their hub metadata here.
 */
import { Ionicons } from '@expo/vector-icons';

import type { BillCategoryId } from '@/store/types';
import { colors } from '@/theme/tokens';

export interface BillPlan {
  id: string;
  label: string;      // "10GB" · "Compact Plus" · "Result Checker"
  detail: string;     // "30 days" · "1 Month" · "1 PIN"
  amount: number;
}

export interface Biller {
  id: string;
  name: string;
  /** 2–3 character tile label; derived from the name when omitted. */
  short?: string;
  /** Plans for this biller; falls back to the category's shared plans. */
  plans?: BillPlan[];
}

/** An extra single-choice toggle above the reference field (meter type etc.). */
export interface BillVariant {
  label: string;
  options: { id: string; label: string }[];
  /** Appended when the choice is echoed on the receipt: "Prepaid" + "meter". */
  suffix?: string;
}

export interface RefField {
  label: string;
  placeholder: string;
  keyboard: 'number-pad' | 'phone-pad';
  minLength: number;
  maxLength: number;
  /** Runs the simulated lookup and shows the resolved name/username. */
  lookup?: 'name' | 'username';
}

export interface BillCategory {
  id: BillCategoryId;
  label: string;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  /** Convenience fee added on top of the amount. */
  fee: number;
  /** Where the hub tile navigates. */
  route: string;
  refField?: RefField;
  billers?: Biller[];
  variant?: BillVariant;
  /** Amount is typed/chipped rather than picked from a plan. */
  quickAmounts?: number[];
  /** Shared plans, used when a biller declares none of its own. */
  plans?: BillPlan[];
  /** Plans are bought in multiples (exam pins). */
  quantity?: boolean;
  /** Extra credential printed on the receipt. */
  issues?: 'token' | 'pins';
}

const NETWORKS: Biller[] = [
  { id: 'mtn', name: 'MTN', short: 'MTN' },
  { id: 'glo', name: 'Glo', short: 'GLO' },
  { id: 'airtel', name: 'Airtel', short: 'AIR' },
  { id: '9mobile', name: '9mobile', short: '9MB' },
];

const DATA_PLANS: BillPlan[] = [
  { id: 'd-500mb', label: '500MB', detail: '30 days', amount: 500 },
  { id: 'd-1gb', label: '1GB', detail: '30 days', amount: 1000 },
  { id: 'd-2gb', label: '2GB', detail: '30 days', amount: 2000 },
  { id: 'd-5gb', label: '5GB', detail: '30 days', amount: 4500 },
  { id: 'd-10gb', label: '10GB', detail: '30 days', amount: 8000 },
  { id: 'd-20gb', label: '20GB', detail: '30 days', amount: 15000 },
  { id: 'd-40gb', label: '40GB', detail: '30 days', amount: 25000 },
];

const PHONE_FIELD: RefField = {
  label: 'Phone number',
  placeholder: '0803 555 0147',
  keyboard: 'phone-pad',
  minLength: 11,
  maxLength: 14,
};

export const BILL_CATEGORIES: BillCategory[] = [
  {
    id: 'airtime',
    label: 'Airtime',
    caption: 'Top up any network',
    icon: 'phone-portrait',
    color: colors.warning,
    bg: colors.warningBg,
    fee: 0,
    route: '/bills/airtime',
    refField: PHONE_FIELD,
    billers: NETWORKS,
    quickAmounts: [100, 200, 500, 1000, 2000, 5000],
  },
  {
    id: 'data',
    label: 'Data',
    caption: 'Bundles that last',
    icon: 'wifi',
    color: colors.info,
    bg: colors.infoBg,
    fee: 0,
    route: '/bills/data',
    refField: PHONE_FIELD,
    billers: NETWORKS,
    plans: DATA_PLANS,
  },
  {
    id: 'electricity',
    label: 'Electricity',
    caption: 'Prepaid & postpaid',
    icon: 'flash',
    color: colors.warning,
    bg: colors.warningBg,
    fee: 100,
    route: '/bills/electricity',
    issues: 'token',
    variant: {
      label: 'Meter type',
      suffix: 'meter',
      options: [
        { id: 'prepaid', label: 'Prepaid' },
        { id: 'postpaid', label: 'Postpaid' },
      ],
    },
    refField: {
      label: 'Meter number',
      placeholder: '04123456789',
      keyboard: 'number-pad',
      minLength: 10,
      maxLength: 13,
      lookup: 'name',
    },
    billers: [
      { id: 'ikeja', name: 'Ikeja Electric', short: 'IKE' },
      { id: 'ekedc', name: 'EKEDC', short: 'EKO' },
      { id: 'aedc', name: 'AEDC', short: 'AED' },
      { id: 'phed', name: 'PHED', short: 'PHE' },
      { id: 'kedco', name: 'KEDCO', short: 'KED' },
      { id: 'ibedc', name: 'IBEDC', short: 'IBD' },
    ],
    quickAmounts: [1000, 2000, 5000, 10000, 20000, 50000],
  },
  {
    id: 'cable-tv',
    label: 'Cable TV',
    caption: 'DStv, GOtv & more',
    icon: 'tv',
    color: colors.primary,
    bg: colors.chip,
    fee: 100,
    route: '/bills/cable-tv',
    refField: {
      label: 'Smartcard / IUC number',
      placeholder: '7032518844',
      keyboard: 'number-pad',
      minLength: 10,
      maxLength: 12,
      lookup: 'name',
    },
    billers: [
      {
        id: 'dstv',
        name: 'DStv',
        short: 'DTV',
        plans: [
          { id: 'dstv-padi', label: 'Padi', detail: '1 Month', amount: 4400 },
          { id: 'dstv-yanga', label: 'Yanga', detail: '1 Month', amount: 6000 },
          { id: 'dstv-confam', label: 'Confam', detail: '1 Month', amount: 11000 },
          { id: 'dstv-compact', label: 'Compact', detail: '1 Month', amount: 19000 },
          { id: 'dstv-compact-plus', label: 'Compact Plus', detail: '1 Month', amount: 30000 },
          { id: 'dstv-premium', label: 'Premium', detail: '1 Month', amount: 44500 },
        ],
      },
      {
        id: 'gotv',
        name: 'GOtv',
        short: 'GTV',
        plans: [
          { id: 'gotv-smallie', label: 'Smallie', detail: '1 Month', amount: 1900 },
          { id: 'gotv-jinja', label: 'Jinja', detail: '1 Month', amount: 3900 },
          { id: 'gotv-jolli', label: 'Jolli', detail: '1 Month', amount: 5800 },
          { id: 'gotv-max', label: 'Max', detail: '1 Month', amount: 8500 },
          { id: 'gotv-supa', label: 'Supa', detail: '1 Month', amount: 11400 },
        ],
      },
      {
        id: 'startimes',
        name: 'StarTimes',
        short: 'STV',
        plans: [
          { id: 'star-nova', label: 'Nova', detail: '1 Month', amount: 1900 },
          { id: 'star-basic', label: 'Basic', detail: '1 Month', amount: 3700 },
          { id: 'star-smart', label: 'Smart', detail: '1 Month', amount: 5100 },
          { id: 'star-classic', label: 'Classic', detail: '1 Month', amount: 5500 },
          { id: 'star-super', label: 'Super', detail: '1 Month', amount: 9800 },
        ],
      },
    ],
  },
  {
    id: 'betting',
    label: 'Betting',
    caption: 'Fund your account',
    icon: 'football',
    color: colors.success,
    bg: colors.successBg,
    fee: 50,
    route: '/bills/betting',
    refField: {
      label: 'Betting user ID',
      placeholder: '4821906',
      keyboard: 'number-pad',
      minLength: 6,
      maxLength: 12,
      lookup: 'username',
    },
    billers: [
      { id: 'bet9ja', name: 'Bet9ja', short: 'B9J' },
      { id: 'sportybet', name: 'SportyBet', short: 'SPY' },
      { id: '1xbet', name: '1xBet', short: '1XB' },
      { id: 'betking', name: 'BetKing', short: 'BKG' },
      { id: 'msport', name: 'MSport', short: 'MSP' },
    ],
    quickAmounts: [500, 1000, 2000, 5000, 10000, 20000],
  },
  {
    id: 'internet',
    label: 'Internet',
    caption: 'Home & office data',
    icon: 'globe',
    color: colors.info,
    bg: colors.infoBg,
    fee: 100,
    route: '/bills/internet',
    refField: {
      label: 'Account / device number',
      placeholder: '0201458822',
      keyboard: 'number-pad',
      minLength: 9,
      maxLength: 12,
      lookup: 'name',
    },
    billers: [
      {
        id: 'spectranet',
        name: 'Spectranet',
        short: 'SPE',
        plans: [
          { id: 'spec-15', label: '15GB', detail: '30 days', amount: 8000 },
          { id: 'spec-40', label: '40GB', detail: '30 days', amount: 14000 },
          { id: 'spec-65', label: '65GB', detail: '30 days', amount: 18000 },
          { id: 'spec-unl', label: 'Unlimited', detail: '30 days', amount: 25000 },
        ],
      },
      {
        id: 'smile',
        name: 'Smile',
        short: 'SMI',
        plans: [
          { id: 'smile-10', label: '10GB', detail: '30 days', amount: 6500 },
          { id: 'smile-25', label: '25GB', detail: '30 days', amount: 11000 },
          { id: 'smile-60', label: '60GB', detail: '30 days', amount: 19000 },
          { id: 'smile-unl', label: 'Unlimited', detail: '30 days', amount: 28000 },
        ],
      },
      {
        id: 'swift',
        name: 'Swift',
        short: 'SWI',
        plans: [
          { id: 'swift-20', label: '20GB', detail: '30 days', amount: 9500 },
          { id: 'swift-50', label: '50GB', detail: '30 days', amount: 16000 },
          { id: 'swift-100', label: '100GB', detail: '30 days', amount: 26000 },
        ],
      },
      {
        id: 'starlink',
        name: 'Starlink',
        short: 'STL',
        plans: [
          { id: 'star-lite', label: 'Residential Lite', detail: '1 Month', amount: 38000 },
          { id: 'star-res', label: 'Residential', detail: '1 Month', amount: 57000 },
          { id: 'star-roam', label: 'Mobile Roam', detail: '1 Month', amount: 167000 },
        ],
      },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    caption: 'Exam pins & vouchers',
    icon: 'school',
    color: colors.danger,
    bg: colors.dangerBg,
    fee: 150,
    route: '/bills/education',
    quantity: true,
    issues: 'pins',
    refField: {
      label: 'Candidate phone number',
      placeholder: '0803 555 0147',
      keyboard: 'phone-pad',
      minLength: 11,
      maxLength: 14,
    },
    billers: [
      {
        id: 'waec',
        name: 'WAEC',
        short: 'WAE',
        plans: [
          { id: 'waec-checker', label: 'Result Checker', detail: '1 PIN', amount: 3500 },
          { id: 'waec-reg', label: 'Registration PIN', detail: '1 PIN', amount: 27000 },
        ],
      },
      {
        id: 'neco',
        name: 'NECO',
        short: 'NEC',
        plans: [
          { id: 'neco-checker', label: 'Result Checker', detail: '1 PIN', amount: 1500 },
          { id: 'neco-reg', label: 'Registration PIN', detail: '1 PIN', amount: 16500 },
        ],
      },
      {
        id: 'jamb',
        name: 'JAMB',
        short: 'JMB',
        plans: [
          { id: 'jamb-utme', label: 'UTME PIN', detail: '1 PIN', amount: 7700 },
          { id: 'jamb-de', label: 'Direct Entry PIN', detail: '1 PIN', amount: 8700 },
        ],
      },
      {
        id: 'nabteb',
        name: 'NABTEB',
        short: 'NAB',
        plans: [
          { id: 'nabteb-checker', label: 'Result Checker', detail: '1 PIN', amount: 1200 },
          { id: 'nabteb-reg', label: 'Registration PIN', detail: '1 PIN', amount: 12000 },
        ],
      },
    ],
  },
  {
    id: 'hotels',
    label: 'Hotels',
    caption: 'Book & pay in-app',
    icon: 'bed',
    color: colors.primary,
    bg: colors.chip,
    fee: 0,
    route: '/bills/hotels',
  },
  {
    id: 'transport',
    label: 'Transport',
    caption: 'Flights & bus tickets',
    icon: 'airplane',
    color: colors.success,
    bg: colors.successBg,
    fee: 500,
    route: '/bills/transport',
  },
];

/** Categories handled by the shared `bills/[category]` screen. */
export const FORM_CATEGORY_IDS: BillCategoryId[] = [
  'airtime', 'data', 'electricity', 'cable-tv', 'betting', 'internet', 'education',
];

export function getCategory(id: string | undefined): BillCategory | undefined {
  return BILL_CATEGORIES.find((c) => c.id === id);
}

export function getBiller(category: BillCategory, billerId: string): Biller | undefined {
  return category.billers?.find((b) => b.id === billerId);
}

/** A biller's own plans, falling back to the category's shared list. */
export function plansFor(category: BillCategory, biller: Biller | undefined): BillPlan[] {
  return biller?.plans ?? category.plans ?? [];
}

/** "MTN" → "MTN", "Ikeja Electric" → "IKE" — the initials tile label. */
export function billerShort(biller: Biller): string {
  return biller.short ?? biller.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
}

/** Stable 32-bit hash — the same technique `avatarColor` uses. */
function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

const LOOKUP_NAMES = [
  'Amaka Nwosu', 'Ibrahim Suleiman', 'Chinedu Eze', 'Funmilayo Adeyemi',
  'Musa Danjuma', 'Ngozi Okafor', 'Segun Balogun', 'Halima Yusuf',
  'Emeka Obi', 'Tolu Adebayo', 'Blessing Idahosa', 'Yusuf Bello',
];

/**
 * Simulated biller lookup. Deterministic on the reference, so the same meter
 * number always resolves to the same customer across restarts.
 */
export function lookupCustomer(kind: 'name' | 'username', ref: string): string {
  const clean = ref.replace(/\D/g, '');
  const name = LOOKUP_NAMES[hash(clean) % LOOKUP_NAMES.length]!;
  if (kind === 'name') return name.toUpperCase();
  const first = name.split(' ')[0]!.toLowerCase();
  return `${first}${clean.slice(-3)}`;
}

/** 20-digit prepaid meter token, grouped in fives: "1234 5678 9012 3456 7890". */
export function electricityToken(seed: string): string {
  let h = hash(seed);
  let digits = '';
  while (digits.length < 20) {
    h = (h * 1103515245 + 12345) >>> 0;
    digits += String(h % 100000).padStart(5, '0');
  }
  return digits.slice(0, 20).replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** `count` exam pins of the form "WAEC-4821-9037". */
export function examPins(seed: string, prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const h = hash(`${seed}-${i}`);
    const a = String(h % 10000).padStart(4, '0');
    const b = String(Math.floor(h / 10000) % 10000).padStart(4, '0');
    return `${prefix.toUpperCase()}-${a}-${b}`;
  });
}
