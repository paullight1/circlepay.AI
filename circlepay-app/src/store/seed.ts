/**
 * Seed data mirroring the CirclePay AI design mockups.
 * Dates are generated relative to "now" so countdowns and schedules stay live.
 */
import { daysFromNow, minutesAgo } from '@/lib/format';
import type {
  AgentLocation, AppNotification, Campaign, Circle, LinkedAccount,
  PartPayPlan, Transaction, TrustSignal, User, Wallet,
} from './types';

export const seedUser: User = {
  id: 'u-godfrey',
  name: 'Godfrey Okoro',
  firstName: 'Godfrey',
  phone: '+234 803 555 0147',
  circlePayId: 'CPAI-7834-5689',
  kycTier: 0,
  pinSet: false,
  biometricsEnabled: false,
  trustScore: 720,
};

export const seedWallet: Wallet = {
  available: 98450.2,
  savings: 27230.3,
  onHold: 27230.3,
};

export const seedTrustSignals: TrustSignal[] = [
  { id: 'ts-1', label: 'On-time payments', detail: '46 of 48 contributions paid on time', positive: true },
  { id: 'ts-2', label: 'Circle participation', detail: 'Active in 3 circles for 8 months', positive: true },
  { id: 'ts-3', label: 'Account activity', detail: 'Consistent weekly wallet activity', positive: true },
  { id: 'ts-4', label: 'Default history', detail: 'No defaults recorded', positive: true },
  { id: 'ts-5', label: '2 late payments', detail: 'Two contributions paid late in the last 6 months', positive: false },
];

const esusuMembers = [
  { name: 'Tunde O.', status: 'paid', position: 1 },
  { name: 'Godfrey Okoro', status: 'paid', position: 2, isYou: true },
  { name: 'Blessing A.', status: 'late', position: 3, riskLevel: 'high', riskScore: 65 },
  { name: 'Chidi M.', status: 'paid', position: 4 },
  { name: 'Aisha K.', status: 'paid', position: 5 },
  { name: 'Emeka N.', status: 'pending', position: 6 },
  { name: 'Ruth I.', status: 'paid', position: 7 },
  { name: 'Segun B.', status: 'paid', position: 8 },
  { name: 'Joy E.', status: 'pending', position: 9 },
  { name: 'Daniel U.', status: 'paid', position: 10 },
] as const;

export const seedCircles: Circle[] = [
  {
    id: 'c-family-esusu',
    name: 'Family Esusu',
    frequency: 'weekly',
    amountPerMember: 10000,
    members: esusuMembers.map((m, i) => ({
      id: `m-esusu-${i + 1}`,
      name: m.name,
      status: m.status,
      amount: 10000,
      isYou: 'isYou' in m ? m.isYou : undefined,
      position: m.position,
      riskLevel: 'riskLevel' in m ? m.riskLevel : 'low',
      riskScore: 'riskScore' in m ? m.riskScore : 12,
    })),
    currentCycle: 1, // Tunde O. receives next
    nextPayoutDate: daysFromNow(3, 12, 45),
    backupPoolPct: 10,
    backupPoolBalance: 54000,
    status: 'active',
    createdAt: daysFromNow(-56),
  },
  {
    id: 'c-friends-ajo',
    name: 'Friends Ajo Group',
    frequency: 'daily',
    amountPerMember: 1000,
    members: [
      'Godfrey Okoro', 'Joy E.', 'Tunde O.', 'Aisha K.', 'Sam W.', 'Ngozi P.',
      'Ibrahim S.', 'Kemi A.', 'Uche D.', 'Femi L.', 'Amara O.', 'David N.',
    ].map((name, i) => ({
      id: `m-ajo-${i + 1}`,
      name,
      status: i < 9 ? 'paid' as const : 'pending' as const,
      amount: 1000,
      isYou: i === 0,
      position: i + 1,
      riskLevel: 'low' as const,
      riskScore: 10,
    })),
    currentCycle: 5,
    nextPayoutDate: daysFromNow(0, 18, 0),
    backupPoolPct: 10,
    backupPoolBalance: 4800,
    status: 'active',
    createdAt: daysFromNow(-30),
  },
  {
    id: 'c-business-savings',
    name: 'Business Savings Circle',
    frequency: 'monthly',
    amountPerMember: 50000,
    members: ['Godfrey Okoro', 'Chidi M.', 'Ruth I.', 'Segun B.', 'Emeka N.', 'Blessing A.'].map((name, i) => ({
      id: `m-biz-${i + 1}`,
      name,
      status: i < 4 ? 'paid' as const : 'pending' as const,
      amount: 50000,
      isYou: i === 0,
      position: i + 1,
      riskLevel: i === 5 ? 'high' as const : 'low' as const,
      riskScore: i === 5 ? 65 : 15,
    })),
    currentCycle: 2,
    nextPayoutDate: daysFromNow(19, 9, 0),
    backupPoolPct: 10,
    backupPoolBalance: 30000,
    status: 'active',
    createdAt: daysFromNow(-64),
  },
];

export const seedPlans: PartPayPlan[] = [
  {
    id: 'p-rent',
    title: 'Rent - 2 Bedroom Apartment',
    detail: '123 Allen Avenue, Ikeja, Lagos',
    category: 'Rent',
    model: 'gradual',
    totalAmount: 600000,
    initialPayment: 50000,
    installmentAmount: 50000,
    frequency: 'monthly',
    durationMonths: 12,
    paidAmount: 100000,
    serviceFeePct: 0,
    schedule: Array.from({ length: 12 }, (_, i) => ({
      id: `p-rent-i${i + 1}`,
      date: daysFromNow(-30 + 30 * i, 9, 0),
      amount: 50000,
      status: i < 2 ? 'paid' as const : i === 2 ? 'upcoming' as const : 'pending' as const,
    })),
    status: 'active',
    createdAt: daysFromNow(-42),
  },
  {
    id: 'p-school',
    title: 'School Fees - Term 2',
    detail: 'Sunrise International School',
    category: 'School Fees',
    model: 'upfront',
    totalAmount: 120000,
    initialPayment: 30000,
    installmentAmount: 30000,
    frequency: 'monthly',
    durationMonths: 4,
    paidAmount: 60000,
    serviceFeePct: 3,
    schedule: Array.from({ length: 4 }, (_, i) => ({
      id: `p-school-i${i + 1}`,
      date: daysFromNow(-25 + 30 * i, 9, 0),
      amount: 30000,
      status: i < 2 ? 'paid' as const : i === 2 ? 'upcoming' as const : 'pending' as const,
    })),
    status: 'active',
    createdAt: daysFromNow(-55),
  },
  {
    id: 'p-hospital',
    title: 'Hospital Bill - Mother',
    detail: 'St. Nicholas Hospital, Lagos',
    category: 'Medical Bills',
    model: 'gradual',
    totalAmount: 75000,
    initialPayment: 15000,
    installmentAmount: 15000,
    frequency: 'monthly',
    durationMonths: 5,
    paidAmount: 30000,
    serviceFeePct: 0,
    schedule: Array.from({ length: 5 }, (_, i) => ({
      id: `p-hosp-i${i + 1}`,
      date: daysFromNow(-20 + 30 * i, 9, 0),
      amount: 15000,
      status: i < 2 ? 'paid' as const : i === 2 ? 'upcoming' as const : 'pending' as const,
    })),
    status: 'active',
    createdAt: daysFromNow(-50),
  },
];

export const seedCampaigns: Campaign[] = [
  {
    id: 'cam-mama-chinedu',
    code: 'CP-784512',
    title: "Support Mama Chinedu's Burial",
    organizer: 'Chidi M.',
    category: 'Burial',
    target: 500000,
    raised: 256500,
    supporters: 124,
    deadline: daysFromNow(3, 23, 59),
    about:
      'Our beloved mother, Mama Chinedu, passed on peacefully on May 10th. We are raising funds to support the burial and related expenses. Any support will be deeply appreciated.',
    donations: [
      { id: 'd-1', donor: 'Joy E.', amount: 5000, date: minutesAgo(2), method: 'wallet' },
      { id: 'd-2', donor: 'Emeka N.', amount: 2000, date: minutesAgo(5), method: 'transfer' },
      { id: 'd-3', donor: 'Segun B.', amount: 10000, date: minutesAgo(10), method: 'wallet' },
      { id: 'd-4', donor: 'Ruth I.', amount: 1000, date: minutesAgo(15), method: 'ussd' },
      { id: 'd-5', donor: 'Anonymous', amount: 1000, date: minutesAgo(20), method: 'agent' },
      { id: 'd-6', donor: 'Blessing A.', amount: 20000, date: minutesAgo(180), method: 'wallet' },
      { id: 'd-7', donor: 'Tunde O.', amount: 15000, date: minutesAgo(240), method: 'transfer' },
      { id: 'd-8', donor: 'Aisha K.', amount: 10000, date: minutesAgo(300), method: 'wallet' },
      { id: 'd-9', donor: 'Chidi M.', amount: 10000, date: minutesAgo(360), method: 'wallet' },
      { id: 'd-10', donor: 'Daniel U.', amount: 5000, date: minutesAgo(420), method: 'wallet' },
    ],
    isMine: false,
    status: 'active',
  },
  {
    id: 'cam-john-birthday',
    code: 'CP-784620',
    title: "John's Birthday Support",
    organizer: 'Joy E.',
    category: 'Birthday',
    target: 100000,
    raised: 75200,
    supporters: 81,
    deadline: daysFromNow(2, 23, 59),
    about:
      "John turns 40! Friends and family are coming together to celebrate his birthday and support his new chapter. Join us with any amount.",
    donations: [
      { id: 'd-11', donor: 'Godfrey Okoro', amount: 5000, date: minutesAgo(500), method: 'wallet' },
      { id: 'd-12', donor: 'Kemi A.', amount: 2000, date: minutesAgo(700), method: 'transfer' },
    ],
    isMine: false,
    status: 'active',
  },
  {
    id: 'cam-tunde-medical',
    code: 'CP-785001',
    title: "Help Tunde's Medical Bills",
    organizer: 'Tunde O.',
    category: 'Medical',
    target: 300000,
    raised: 120000,
    supporters: 73,
    deadline: daysFromNow(5, 23, 59),
    about:
      'Tunde needs urgent surgery and the family needs support to cover hospital bills. Every contribution counts — thank you for standing with us.',
    donations: [
      { id: 'd-13', donor: 'Ngozi P.', amount: 10000, date: minutesAgo(60), method: 'wallet' },
      { id: 'd-14', donor: 'Anonymous', amount: 1000, date: minutesAgo(90), method: 'agent' },
    ],
    isMine: false,
    status: 'active',
  },
];

export const seedAgents: AgentLocation[] = [
  { id: 'ag-1', name: 'Mega Plaza Kiosk', address: '12 Herbert Macaulay Way, Yaba', distanceKm: 0.2, open: true, kind: 'kiosk', agentId: 'AGT-24580' },
  { id: 'ag-2', name: 'Peace & Sons Store', address: '20 Allen Avenue, Ikeja', distanceKm: 1.3, open: true, kind: 'store', agentId: 'AGT-11934' },
  { id: 'ag-3', name: "Blessing's Point", address: "45 Alaba Int'l Market, Ojo", distanceKm: 2.1, open: true, kind: 'agent', agentId: 'AGT-30217' },
  { id: 'ag-4', name: 'Tomiwa Ventures', address: 'Shop 7, Computer Village, Ikeja', distanceKm: 2.8, open: true, kind: 'store', agentId: 'AGT-15662' },
  { id: 'ag-5', name: 'Chuks Connect', address: '3 Bode Thomas St, Surulere', distanceKm: 3.4, open: false, kind: 'agent', agentId: 'AGT-40912' },
];

export const seedLinkedAccounts: LinkedAccount[] = [
  { id: 'la-1', bank: 'GTBank', last4: '1234', active: true, purpose: 'Family Esusu · Weekly' },
  { id: 'la-2', bank: 'Opay', last4: '5678', active: true, purpose: 'Rent Payment Plan · Monthly' },
];

export const seedTransactions: Transaction[] = [
  { id: 't-1', title: 'Auto Deduction', subtitle: 'Family Esusu', amount: 10000, direction: 'out', date: minutesAgo(60 * 4), status: 'success', category: 'circle' },
  { id: 't-2', title: 'Payment - School Fees', subtitle: 'PartPay installment', amount: 25000, direction: 'out', date: minutesAgo(60 * 22), status: 'success', category: 'partpay' },
  { id: 't-3', title: 'Auto Deduction', subtitle: 'Friends Ajo Group', amount: 1000, direction: 'out', date: minutesAgo(60 * 26), status: 'success', category: 'circle' },
  { id: 't-4', title: 'Backup Pool Contribution', subtitle: 'Family Esusu · 10%', amount: 1000, direction: 'out', date: minutesAgo(60 * 48), status: 'success', category: 'circle' },
  { id: 't-5', title: 'Manual Contribution', subtitle: 'Business Savings Circle', amount: 10000, direction: 'out', date: minutesAgo(60 * 72), status: 'success', category: 'circle' },
  { id: 't-6', title: 'Wallet Top-up', subtitle: 'GTBank •••• 1234', amount: 50000, direction: 'in', date: minutesAgo(60 * 96), status: 'success', category: 'wallet' },
  { id: 't-7', title: 'Late Fee (Blessing A.)', subtitle: 'Family Esusu penalty share', amount: 500, direction: 'in', date: minutesAgo(60 * 120), status: 'deducted', category: 'fee' },
];

export const seedNotifications: AppNotification[] = [
  { id: 'n-1', type: 'alert', title: 'AI Alert', body: 'Blessing A. is 2 days late. Please reach out to them.', date: minutesAgo(2), read: false },
  { id: 'n-2', type: 'payment', title: 'Payment Received', body: 'Chidi M. has paid ₦10,000 to Family Esusu.', date: minutesAgo(10), read: false },
  { id: 'n-3', type: 'payout', title: 'Upcoming Payout', body: 'Tunde O. will receive ₦100,000 in 3 days.', date: minutesAgo(60), read: false },
  { id: 'n-4', type: 'backup', title: 'Backup Pool Update', body: '₦1,000 added to backup pool today.', date: minutesAgo(120), read: true },
  { id: 'n-5', type: 'campaign', title: 'Campaign Milestone', body: "Support Mama Chinedu's Burial has passed 50% of its goal.", date: minutesAgo(200), read: true },
];
