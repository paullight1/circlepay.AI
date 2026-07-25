/** Domain model for CirclePay AI. Shared by every feature — do not fork these shapes. */

export type MemberStatus = 'paid' | 'pending' | 'late';
export type TxStatus = 'success' | 'pending' | 'failed' | 'deducted';
export type Frequency = 'daily' | 'weekly' | 'monthly';
export type PayModel = 'gradual' | 'upfront';
export type InstallmentStatus = 'paid' | 'upcoming' | 'pending';
export type CampaignCategory =
  | 'Burial' | 'Birthday' | 'Medical' | 'Wedding' | 'School Fees' | 'Community';
export type PayCategory =
  | 'Rent' | 'School Fees' | 'Medical Bills' | 'Consumer Products' | 'Business Services' | 'Other';
export type NotifType = 'alert' | 'payment' | 'payout' | 'backup' | 'campaign' | 'system';
export type BillCategoryId =
  | 'airtime' | 'data' | 'electricity' | 'cable-tv' | 'betting'
  | 'internet' | 'education' | 'hotels' | 'transport';
export type BillMethod = 'wallet' | 'agent';

export interface User {
  id: string;
  name: string;          // "Godfrey Okoro"
  firstName: string;     // "Godfrey"
  phone: string;
  circlePayId: string;   // "CPAI-7834-5689"
  kycTier: 0 | 1 | 2;
  pinSet: boolean;
  biometricsEnabled: boolean;
  trustScore: number;    // 720
}

export interface TrustSignal {
  id: string;
  label: string;
  detail: string;
  positive: boolean;
}

export interface Transaction {
  id: string;
  title: string;
  subtitle?: string;
  amount: number;          // positive number; `direction` gives sign
  direction: 'in' | 'out';
  date: string;            // ISO
  status: TxStatus;
  category: 'circle' | 'wallet' | 'partpay' | 'campaign' | 'agent' | 'fee' | 'bill';
}

export interface CircleMember {
  id: string;
  name: string;
  status: MemberStatus;
  amount: number;
  isYou?: boolean;
  position: number;         // payout order, 1-based
  riskLevel?: 'low' | 'moderate' | 'high';
  riskScore?: number;       // 0-100
}

export interface Circle {
  id: string;
  name: string;              // "Family Esusu"
  frequency: Frequency;
  amountPerMember: number;   // ₦10,000
  members: CircleMember[];
  currentCycle: number;      // 1-based; receiver = member with position === currentCycle
  nextPayoutDate: string;    // ISO
  backupPoolPct: number;     // 10
  backupPoolBalance: number;
  status: 'active' | 'completed' | 'pending';
  createdAt: string;
}

export interface Installment {
  id: string;
  date: string;              // ISO
  amount: number;
  status: InstallmentStatus;
}

export interface PartPayPlan {
  id: string;
  title: string;             // "Rent - 2 Bedroom Apartment"
  detail?: string;           // "123 Allen Avenue, Ikeja, Lagos"
  category: PayCategory;
  model: PayModel;
  totalAmount: number;
  initialPayment: number;
  installmentAmount: number;
  frequency: Frequency;
  durationMonths: number;
  paidAmount: number;
  serviceFeePct: number;     // upfront model only (e.g. 3)
  schedule: Installment[];
  status: 'active' | 'completed';
  createdAt: string;
}

export interface Donation {
  id: string;
  donor: string;             // "Anonymous" allowed
  amount: number;
  date: string;
  method: 'wallet' | 'transfer' | 'ussd' | 'agent';
}

export interface Campaign {
  id: string;
  code: string;              // "CP-784512"
  title: string;             // "Support Mama Chinedu's Burial"
  organizer: string;         // "Chidi M."
  category: CampaignCategory;
  target: number;
  raised: number;
  supporters: number;
  deadline: string;          // ISO
  about: string;
  donations: Donation[];
  isMine?: boolean;
  status: 'active' | 'completed';
}

export interface AgentLocation {
  id: string;
  name: string;              // "Mega Plaza Kiosk"
  address: string;
  distanceKm: number;
  open: boolean;
  kind: 'kiosk' | 'store' | 'agent';
  agentId: string;           // "AGT-24580"
}

export interface LinkedAccount {
  id: string;
  bank: string;              // "GTBank"
  last4: string;             // "1234"
  active: boolean;
  purpose?: string;          // "Family Esusu · Weekly"
}

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  date: string;              // ISO
  read: boolean;
}

export interface WithdrawalRequest {
  code: string;              // "872641" shown as "872 641"
  amount: number;
  fee: number;
  expiresAt: string;         // ISO, ~5 minutes
  status: 'pending' | 'completed' | 'expired';
}

/**
 * A single bill purchase — airtime, data, a DStv package, an electricity token,
 * a hotel booking, a bus seat. One shape for all nine categories so the hub,
 * history and receipt screens stay generic.
 */
export interface BillPayment {
  id: string;
  reference: string;         // "CPB-4821906"
  categoryId: BillCategoryId;
  categoryLabel: string;     // "Cable TV"
  billerId: string;
  billerName: string;        // "DStv"
  customerRef: string;       // meter / smartcard / phone / booking ref
  customerName?: string;     // resolved by the simulated lookup
  planLabel?: string;        // "Compact Plus · 1 Month"
  detail?: string;           // "2 nights · Deluxe Room · 2 guests"
  amount: number;
  fee: number;
  method: BillMethod;
  status: 'success' | 'pending' | 'failed';
  date: string;              // ISO
  token?: string;            // electricity token, prepaid meters only
  pins?: string[];           // exam pins
}

/** One-time code shown to an agent so their terminal can settle a bill. */
export interface BillAgentRequest {
  code: string;              // "540 118" shown spaced
  paymentId: string;
  expiresAt: string;         // ISO, ~5 minutes
  status: 'pending' | 'completed';
}

export interface Wallet {
  available: number;
  savings: number;           // held in circles/plans
  onHold: number;            // pooled in groups
}
