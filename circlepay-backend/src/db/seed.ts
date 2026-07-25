/**
 * Seed the database with the same demo data the app ships with
 * (`circlepay-app/src/store/seed.ts`) so a fresh backend serves an identical
 * experience for the seeded user "Godfrey Okoro".
 *
 * Run: `npm run db:seed`  (always wipes + reseeds — this is a demo database).
 * Log in from the app by requesting an OTP for +234 803 555 0147.
 */
import 'dotenv/config';

import { createDb } from './drizzle.client';
import * as s from './schema';

const money = (n: number): string => n.toFixed(2);

function daysFromNow(days: number, hour?: number, minute?: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  if (hour !== undefined) d.setHours(hour, minute ?? 0, 0, 0);
  return d;
}
const minutesAgo = (min: number): Date => new Date(Date.now() - min * 60_000);

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const { db, sql } = createDb(url, 1);

  console.log('Wiping existing data…');
  // Child → parent order to satisfy FKs.
  await db.delete(s.donations);
  await db.delete(s.campaigns);
  await db.delete(s.installments);
  await db.delete(s.partPayPlans);
  await db.delete(s.circleMembers);
  await db.delete(s.circles);
  await db.delete(s.scratchCardRedemptions);
  await db.delete(s.withdrawalRequests);
  await db.delete(s.notifications);
  await db.delete(s.trustSignals);
  await db.delete(s.linkedAccounts);
  await db.delete(s.transactions);
  await db.delete(s.wallets);
  await db.delete(s.otpCodes);
  await db.delete(s.agents);
  await db.delete(s.users);

  console.log('Seeding user + wallet…');
  const [user] = await db
    .insert(s.users)
    .values({
      name: 'Godfrey Okoro',
      firstName: 'Godfrey',
      phone: '+234 803 555 0147',
      circlePayId: 'CPAI-7834-5689',
      kycTier: 0,
      pinSet: false,
      biometricsEnabled: false,
      onboarded: true,
      trustScore: 720,
    })
    .returning();
  const uid = user!.id;

  await db.insert(s.wallets).values({
    userId: uid,
    available: money(98450.2),
    savings: money(27230.3),
    onHold: money(27230.3),
  });

  // ── Trust signals ──
  console.log('Seeding trust signals…');
  await db.insert(s.trustSignals).values([
    { userId: uid, label: 'On-time payments', detail: '46 of 48 contributions paid on time', positive: true, sort: 1 },
    { userId: uid, label: 'Circle participation', detail: 'Active in 3 circles for 8 months', positive: true, sort: 2 },
    { userId: uid, label: 'Account activity', detail: 'Consistent weekly wallet activity', positive: true, sort: 3 },
    { userId: uid, label: 'Default history', detail: 'No defaults recorded', positive: true, sort: 4 },
    { userId: uid, label: '2 late payments', detail: 'Two contributions paid late in the last 6 months', positive: false, sort: 5 },
  ]);

  // ── Circles ──
  console.log('Seeding circles…');
  type SeedMember = {
    name: string;
    status: 'paid' | 'pending' | 'late';
    position: number;
    isYou?: boolean;
    riskLevel?: 'low' | 'moderate' | 'high';
    riskScore?: number;
  };

  async function insertCircle(
    circle: typeof s.circles.$inferInsert,
    members: SeedMember[],
    amountPerMember: number,
  ): Promise<void> {
    const [row] = await db.insert(s.circles).values(circle).returning();
    await db.insert(s.circleMembers).values(
      members.map((m) => ({
        circleId: row!.id,
        userId: m.isYou ? uid : null,
        name: m.name,
        status: m.status,
        amount: money(amountPerMember),
        isYou: m.isYou ?? false,
        position: m.position,
        riskLevel: m.riskLevel ?? 'low',
        riskScore: m.riskScore ?? 12,
      })),
    );
  }

  await insertCircle(
    {
      ownerId: uid,
      name: 'Family Esusu',
      frequency: 'weekly',
      amountPerMember: money(10000),
      currentCycle: 1,
      nextPayoutDate: daysFromNow(3, 12, 45),
      backupPoolPct: 10,
      backupPoolBalance: money(54000),
      status: 'active',
      createdAt: daysFromNow(-56),
    },
    [
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
    ],
    10000,
  );

  const ajoNames = ['Godfrey Okoro', 'Joy E.', 'Tunde O.', 'Aisha K.', 'Sam W.', 'Ngozi P.', 'Ibrahim S.', 'Kemi A.', 'Uche D.', 'Femi L.', 'Amara O.', 'David N.'];
  await insertCircle(
    {
      ownerId: uid,
      name: 'Friends Ajo Group',
      frequency: 'daily',
      amountPerMember: money(1000),
      currentCycle: 5,
      nextPayoutDate: daysFromNow(0, 18, 0),
      backupPoolPct: 10,
      backupPoolBalance: money(4800),
      status: 'active',
      createdAt: daysFromNow(-30),
    },
    ajoNames.map((name, i) => ({
      name,
      status: (i < 9 ? 'paid' : 'pending') as SeedMember['status'],
      position: i + 1,
      isYou: i === 0,
      riskLevel: 'low' as const,
      riskScore: 10,
    })),
    1000,
  );

  const bizNames = ['Godfrey Okoro', 'Chidi M.', 'Ruth I.', 'Segun B.', 'Emeka N.', 'Blessing A.'];
  await insertCircle(
    {
      ownerId: uid,
      name: 'Business Savings Circle',
      frequency: 'monthly',
      amountPerMember: money(50000),
      currentCycle: 2,
      nextPayoutDate: daysFromNow(19, 9, 0),
      backupPoolPct: 10,
      backupPoolBalance: money(30000),
      status: 'active',
      createdAt: daysFromNow(-64),
    },
    bizNames.map((name, i) => ({
      name,
      status: (i < 4 ? 'paid' : 'pending') as SeedMember['status'],
      position: i + 1,
      isYou: i === 0,
      riskLevel: (i === 5 ? 'high' : 'low') as SeedMember['riskLevel'],
      riskScore: i === 5 ? 65 : 15,
    })),
    50000,
  );

  // ── PartPay plans ──
  console.log('Seeding PartPay plans…');
  async function insertPlan(
    plan: typeof s.partPayPlans.$inferInsert,
    schedule: { offsetDays: number; amount: number; status: 'paid' | 'upcoming' | 'pending'; position: number }[],
  ): Promise<void> {
    const [row] = await db.insert(s.partPayPlans).values(plan).returning();
    await db.insert(s.installments).values(
      schedule.map((i) => ({
        planId: row!.id,
        dueDate: daysFromNow(i.offsetDays, 9, 0),
        amount: money(i.amount),
        status: i.status,
        position: i.position,
      })),
    );
  }

  const rentSchedule = Array.from({ length: 12 }, (_, i) => ({
    offsetDays: -30 + 30 * i,
    amount: 50000,
    status: (i < 2 ? 'paid' : i === 2 ? 'upcoming' : 'pending') as 'paid' | 'upcoming' | 'pending',
    position: i + 1,
  }));
  await insertPlan(
    {
      userId: uid,
      title: 'Rent - 2 Bedroom Apartment',
      detail: '123 Allen Avenue, Ikeja, Lagos',
      category: 'Rent',
      model: 'gradual',
      totalAmount: money(600000),
      initialPayment: money(50000),
      installmentAmount: money(50000),
      frequency: 'monthly',
      durationMonths: 12,
      paidAmount: money(100000),
      serviceFeePct: 0,
      status: 'active',
      createdAt: daysFromNow(-42),
    },
    rentSchedule,
  );

  const schoolSchedule = Array.from({ length: 4 }, (_, i) => ({
    offsetDays: -25 + 30 * i,
    amount: 30000,
    status: (i < 2 ? 'paid' : i === 2 ? 'upcoming' : 'pending') as 'paid' | 'upcoming' | 'pending',
    position: i + 1,
  }));
  await insertPlan(
    {
      userId: uid,
      title: 'School Fees - Term 2',
      detail: 'Sunrise International School',
      category: 'School Fees',
      model: 'upfront',
      totalAmount: money(120000),
      initialPayment: money(30000),
      installmentAmount: money(30000),
      frequency: 'monthly',
      durationMonths: 4,
      paidAmount: money(60000),
      serviceFeePct: 3,
      status: 'active',
      createdAt: daysFromNow(-55),
    },
    schoolSchedule,
  );

  const hospitalSchedule = Array.from({ length: 5 }, (_, i) => ({
    offsetDays: -20 + 30 * i,
    amount: 15000,
    status: (i < 2 ? 'paid' : i === 2 ? 'upcoming' : 'pending') as 'paid' | 'upcoming' | 'pending',
    position: i + 1,
  }));
  await insertPlan(
    {
      userId: uid,
      title: 'Hospital Bill - Mother',
      detail: 'St. Nicholas Hospital, Lagos',
      category: 'Medical Bills',
      model: 'gradual',
      totalAmount: money(75000),
      initialPayment: money(15000),
      installmentAmount: money(15000),
      frequency: 'monthly',
      durationMonths: 5,
      paidAmount: money(30000),
      serviceFeePct: 0,
      status: 'active',
      createdAt: daysFromNow(-50),
    },
    hospitalSchedule,
  );

  // ── Campaigns ──
  console.log('Seeding campaigns…');
  async function insertCampaign(
    campaign: typeof s.campaigns.$inferInsert,
    dons: { donor: string; amount: number; minutesAgo: number; method: 'wallet' | 'transfer' | 'ussd' | 'agent' }[],
  ): Promise<void> {
    const [row] = await db.insert(s.campaigns).values(campaign).returning();
    if (dons.length) {
      await db.insert(s.donations).values(
        dons.map((d) => ({
          campaignId: row!.id,
          donorUserId: null,
          donor: d.donor,
          amount: money(d.amount),
          method: d.method,
          createdAt: minutesAgo(d.minutesAgo),
        })),
      );
    }
  }

  await insertCampaign(
    {
      ownerId: null,
      code: 'CP-784512',
      title: "Support Mama Chinedu's Burial",
      organizer: 'Chidi M.',
      category: 'Burial',
      target: money(500000),
      raised: money(256500),
      supporters: 124,
      deadline: daysFromNow(3, 23, 59),
      about: 'Our beloved mother, Mama Chinedu, passed on peacefully on May 10th. We are raising funds to support the burial and related expenses. Any support will be deeply appreciated.',
      status: 'active',
    },
    [
      { donor: 'Joy E.', amount: 5000, minutesAgo: 2, method: 'wallet' },
      { donor: 'Emeka N.', amount: 2000, minutesAgo: 5, method: 'transfer' },
      { donor: 'Segun B.', amount: 10000, minutesAgo: 10, method: 'wallet' },
      { donor: 'Ruth I.', amount: 1000, minutesAgo: 15, method: 'ussd' },
      { donor: 'Anonymous', amount: 1000, minutesAgo: 20, method: 'agent' },
      { donor: 'Blessing A.', amount: 20000, minutesAgo: 180, method: 'wallet' },
      { donor: 'Tunde O.', amount: 15000, minutesAgo: 240, method: 'transfer' },
      { donor: 'Aisha K.', amount: 10000, minutesAgo: 300, method: 'wallet' },
      { donor: 'Chidi M.', amount: 10000, minutesAgo: 360, method: 'wallet' },
      { donor: 'Daniel U.', amount: 5000, minutesAgo: 420, method: 'wallet' },
    ],
  );

  await insertCampaign(
    {
      ownerId: null,
      code: 'CP-784620',
      title: "John's Birthday Support",
      organizer: 'Joy E.',
      category: 'Birthday',
      target: money(100000),
      raised: money(75200),
      supporters: 81,
      deadline: daysFromNow(2, 23, 59),
      about: "John turns 40! Friends and family are coming together to celebrate his birthday and support his new chapter. Join us with any amount.",
      status: 'active',
    },
    [
      { donor: 'Godfrey Okoro', amount: 5000, minutesAgo: 500, method: 'wallet' },
      { donor: 'Kemi A.', amount: 2000, minutesAgo: 700, method: 'transfer' },
    ],
  );

  await insertCampaign(
    {
      ownerId: null,
      code: 'CP-785001',
      title: "Help Tunde's Medical Bills",
      organizer: 'Tunde O.',
      category: 'Medical',
      target: money(300000),
      raised: money(120000),
      supporters: 73,
      deadline: daysFromNow(5, 23, 59),
      about: 'Tunde needs urgent surgery and the family needs support to cover hospital bills. Every contribution counts — thank you for standing with us.',
      status: 'active',
    },
    [
      { donor: 'Ngozi P.', amount: 10000, minutesAgo: 60, method: 'wallet' },
      { donor: 'Anonymous', amount: 1000, minutesAgo: 90, method: 'agent' },
    ],
  );

  // ── Agents (global) ──
  console.log('Seeding agents…');
  await db.insert(s.agents).values([
    { name: 'Mega Plaza Kiosk', address: '12 Herbert Macaulay Way, Yaba', distanceKm: '0.2', open: true, kind: 'kiosk', agentCode: 'AGT-24580' },
    { name: 'Peace & Sons Store', address: '20 Allen Avenue, Ikeja', distanceKm: '1.3', open: true, kind: 'store', agentCode: 'AGT-11934' },
    { name: "Blessing's Point", address: "45 Alaba Int'l Market, Ojo", distanceKm: '2.1', open: true, kind: 'agent', agentCode: 'AGT-30217' },
    { name: 'Tomiwa Ventures', address: 'Shop 7, Computer Village, Ikeja', distanceKm: '2.8', open: true, kind: 'store', agentCode: 'AGT-15662' },
    { name: 'Chuks Connect', address: '3 Bode Thomas St, Surulere', distanceKm: '3.4', open: false, kind: 'agent', agentCode: 'AGT-40912' },
  ]);

  // ── Linked accounts ──
  await db.insert(s.linkedAccounts).values([
    { userId: uid, bank: 'GTBank', last4: '1234', active: true, purpose: 'Family Esusu · Weekly' },
    { userId: uid, bank: 'Opay', last4: '5678', active: true, purpose: 'Rent Payment Plan · Monthly' },
  ]);

  // ── Transactions ──
  console.log('Seeding transactions…');
  await db.insert(s.transactions).values([
    { userId: uid, title: 'Auto Deduction', subtitle: 'Family Esusu', amount: money(10000), direction: 'out', status: 'success', category: 'circle', createdAt: minutesAgo(60 * 4) },
    { userId: uid, title: 'Payment - School Fees', subtitle: 'PartPay installment', amount: money(25000), direction: 'out', status: 'success', category: 'partpay', createdAt: minutesAgo(60 * 22) },
    { userId: uid, title: 'Auto Deduction', subtitle: 'Friends Ajo Group', amount: money(1000), direction: 'out', status: 'success', category: 'circle', createdAt: minutesAgo(60 * 26) },
    { userId: uid, title: 'Backup Pool Contribution', subtitle: 'Family Esusu · 10%', amount: money(1000), direction: 'out', status: 'success', category: 'circle', createdAt: minutesAgo(60 * 48) },
    { userId: uid, title: 'Manual Contribution', subtitle: 'Business Savings Circle', amount: money(10000), direction: 'out', status: 'success', category: 'circle', createdAt: minutesAgo(60 * 72) },
    { userId: uid, title: 'Wallet Top-up', subtitle: 'GTBank •••• 1234', amount: money(50000), direction: 'in', status: 'success', category: 'wallet', createdAt: minutesAgo(60 * 96) },
    { userId: uid, title: 'Late Fee (Blessing A.)', subtitle: 'Family Esusu penalty share', amount: money(500), direction: 'in', status: 'deducted', category: 'fee', createdAt: minutesAgo(60 * 120) },
  ]);

  // ── Notifications ──
  console.log('Seeding notifications…');
  await db.insert(s.notifications).values([
    { userId: uid, type: 'alert', title: 'AI Alert', body: 'Blessing A. is 2 days late. Please reach out to them.', read: false, createdAt: minutesAgo(2) },
    { userId: uid, type: 'payment', title: 'Payment Received', body: 'Chidi M. has paid ₦10,000 to Family Esusu.', read: false, createdAt: minutesAgo(10) },
    { userId: uid, type: 'payout', title: 'Upcoming Payout', body: 'Tunde O. will receive ₦100,000 in 3 days.', read: false, createdAt: minutesAgo(60) },
    { userId: uid, type: 'backup', title: 'Backup Pool Update', body: '₦1,000 added to backup pool today.', read: true, createdAt: minutesAgo(120) },
    { userId: uid, type: 'campaign', title: 'Campaign Milestone', body: "Support Mama Chinedu's Burial has passed 50% of its goal.", read: true, createdAt: minutesAgo(200) },
  ]);

  console.log(`\n✓ Seed complete. Sign in from the app with phone: ${user!.phone}`);
  console.log('  (OTP is printed in the server logs / returned by /api/auth/request-otp in dev mode.)');
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
