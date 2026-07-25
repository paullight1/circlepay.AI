/**
 * CirclePay AI — Drizzle schema (PostgreSQL).
 *
 * Mirrors the frontend domain model in `circlepay-app/src/store/types.ts` so the
 * API contract stays identical to what the app already consumes. Money columns
 * use `numeric(14,2)` (naira with kobo precision); the mapping layer in each
 * service converts them to plain JS numbers for the wire format the app expects.
 *
 * Note: for a production ledger you'd store integer minor units (kobo) and never
 * floats. numeric(14,2) is exact decimal (not a float) and is a safe choice here.
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// ── Enums ───────────────────────────────────────────────────────────────────
export const memberStatusEnum = pgEnum('member_status', ['paid', 'pending', 'late']);
export const txStatusEnum = pgEnum('tx_status', ['success', 'pending', 'failed', 'deducted']);
export const txDirectionEnum = pgEnum('tx_direction', ['in', 'out']);
export const txCategoryEnum = pgEnum('tx_category', ['circle', 'wallet', 'partpay', 'campaign', 'agent', 'fee']);
export const frequencyEnum = pgEnum('frequency', ['daily', 'weekly', 'monthly']);
export const payModelEnum = pgEnum('pay_model', ['gradual', 'upfront']);
export const installmentStatusEnum = pgEnum('installment_status', ['paid', 'upcoming', 'pending']);
export const circleStatusEnum = pgEnum('circle_status', ['active', 'completed', 'pending']);
export const planStatusEnum = pgEnum('plan_status', ['active', 'completed']);
export const campaignStatusEnum = pgEnum('campaign_status', ['active', 'completed']);
export const campaignCategoryEnum = pgEnum('campaign_category', [
  'Burial', 'Birthday', 'Medical', 'Wedding', 'School Fees', 'Community',
]);
export const payCategoryEnum = pgEnum('pay_category', [
  'Rent', 'School Fees', 'Medical Bills', 'Consumer Products', 'Business Services', 'Other',
]);
export const donationMethodEnum = pgEnum('donation_method', ['wallet', 'transfer', 'ussd', 'agent']);
export const agentKindEnum = pgEnum('agent_kind', ['kiosk', 'store', 'agent']);
export const notifTypeEnum = pgEnum('notif_type', ['alert', 'payment', 'payout', 'backup', 'campaign', 'system']);
export const riskLevelEnum = pgEnum('risk_level', ['low', 'moderate', 'high']);
export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['pending', 'completed', 'expired']);

const money = (name: string) => numeric(name, { precision: 14, scale: 2 });

// ── Users ───────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  firstName: text('first_name').notNull(),
  phone: text('phone').notNull().unique(),
  circlePayId: text('circle_pay_id').notNull().unique(),
  kycTier: integer('kyc_tier').notNull().default(0), // 0 | 1 | 2
  pinHash: text('pin_hash'),
  pinSet: boolean('pin_set').notNull().default(false),
  biometricsEnabled: boolean('biometrics_enabled').notNull().default(false),
  onboarded: boolean('onboarded').notNull().default(false),
  trustScore: integer('trust_score').notNull().default(720),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// One wallet per user (available / savings / onHold buckets from the app).
export const wallets = pgTable('wallets', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  available: money('available').notNull().default('0'),
  savings: money('savings').notNull().default('0'),
  onHold: money('on_hold').notNull().default('0'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── OTP (phone-first auth) ──────────────────────────────────────────────────
export const otpCodes = pgTable(
  'otp_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    phone: text('phone').notNull(),
    code: text('code').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('otp_phone_idx').on(t.phone)],
);

// ── Wallet transactions (the user-facing money feed) ────────────────────────
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    amount: money('amount').notNull(),
    direction: txDirectionEnum('direction').notNull(),
    status: txStatusEnum('status').notNull().default('success'),
    category: txCategoryEnum('category').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('tx_user_created_idx').on(t.userId, t.createdAt)],
);

// ── Linked bank accounts ────────────────────────────────────────────────────
export const linkedAccounts = pgTable('linked_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  bank: text('bank').notNull(),
  last4: text('last4').notNull(),
  active: boolean('active').notNull().default(true),
  purpose: text('purpose'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Circles (rotating savings) ──────────────────────────────────────────────
export const circles = pgTable('circles', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  frequency: frequencyEnum('frequency').notNull(),
  amountPerMember: money('amount_per_member').notNull(),
  currentCycle: integer('current_cycle').notNull().default(1),
  nextPayoutDate: timestamp('next_payout_date', { withTimezone: true }).notNull(),
  backupPoolPct: integer('backup_pool_pct').notNull().default(10),
  backupPoolBalance: money('backup_pool_balance').notNull().default('0'),
  status: circleStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const circleMembers = pgTable(
  'circle_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    circleId: uuid('circle_id')
      .notNull()
      .references(() => circles.id, { onDelete: 'cascade' }),
    // Nullable: seeded/other members are names only until a real user joins.
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    status: memberStatusEnum('status').notNull().default('pending'),
    amount: money('amount').notNull(),
    isYou: boolean('is_you').notNull().default(false),
    position: integer('position').notNull(),
    riskLevel: riskLevelEnum('risk_level').default('low'),
    riskScore: integer('risk_score').default(10),
  },
  (t) => [index('circle_member_circle_idx').on(t.circleId)],
);

// ── PartPay (installment plans) ─────────────────────────────────────────────
export const partPayPlans = pgTable('part_pay_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  detail: text('detail'),
  category: payCategoryEnum('category').notNull(),
  model: payModelEnum('model').notNull(),
  totalAmount: money('total_amount').notNull(),
  initialPayment: money('initial_payment').notNull(),
  installmentAmount: money('installment_amount').notNull(),
  frequency: frequencyEnum('frequency').notNull().default('monthly'),
  durationMonths: integer('duration_months').notNull(),
  paidAmount: money('paid_amount').notNull().default('0'),
  serviceFeePct: integer('service_fee_pct').notNull().default(0),
  status: planStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const installments = pgTable(
  'installments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => partPayPlans.id, { onDelete: 'cascade' }),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    amount: money('amount').notNull(),
    status: installmentStatusEnum('status').notNull().default('pending'),
    position: integer('position').notNull(),
  },
  (t) => [index('installment_plan_idx').on(t.planId)],
);

// ── CircleSupport (campaigns) ───────────────────────────────────────────────
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  organizer: text('organizer').notNull(),
  category: campaignCategoryEnum('category').notNull(),
  target: money('target').notNull(),
  raised: money('raised').notNull().default('0'),
  supporters: integer('supporters').notNull().default(0),
  deadline: timestamp('deadline', { withTimezone: true }).notNull(),
  about: text('about').notNull(),
  status: campaignStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const donations = pgTable(
  'donations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    donorUserId: uuid('donor_user_id').references(() => users.id, { onDelete: 'set null' }),
    donor: text('donor').notNull(),
    amount: money('amount').notNull(),
    method: donationMethodEnum('method').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('donation_campaign_idx').on(t.campaignId)],
);

// ── Agent / kiosk network ───────────────────────────────────────────────────
export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  distanceKm: numeric('distance_km', { precision: 6, scale: 2 }).notNull(),
  open: boolean('open').notNull().default(true),
  kind: agentKindEnum('kind').notNull(),
  agentCode: text('agent_code').notNull().unique(), // "AGT-24580"
});

// Redeemed scratch-card serials — one row per user redemption, unique serial.
export const scratchCardRedemptions = pgTable(
  'scratch_card_redemptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    serial: text('serial').notNull().unique(),
    amount: money('amount').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

// Kiosk cash-out requests (time-limited one-time code).
export const withdrawalRequests = pgTable(
  'withdrawal_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    amount: money('amount').notNull(),
    fee: money('fee').notNull(),
    status: withdrawalStatusEnum('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('withdrawal_user_idx').on(t.userId)],
);

// ── Trust & notifications ───────────────────────────────────────────────────
export const trustSignals = pgTable('trust_signals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  detail: text('detail').notNull(),
  positive: boolean('positive').notNull(),
  sort: integer('sort').notNull().default(0),
});

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notifTypeEnum('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('notif_user_created_idx').on(t.userId, t.createdAt)],
);

// ── Relations (for query API) ───────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, { fields: [users.id], references: [wallets.userId] }),
  transactions: many(transactions),
  circles: many(circles),
  plans: many(partPayPlans),
  campaigns: many(campaigns),
  notifications: many(notifications),
  trustSignals: many(trustSignals),
  linkedAccounts: many(linkedAccounts),
}));

export const circlesRelations = relations(circles, ({ one, many }) => ({
  owner: one(users, { fields: [circles.ownerId], references: [users.id] }),
  members: many(circleMembers),
}));

export const circleMembersRelations = relations(circleMembers, ({ one }) => ({
  circle: one(circles, { fields: [circleMembers.circleId], references: [circles.id] }),
}));

export const partPayPlansRelations = relations(partPayPlans, ({ one, many }) => ({
  user: one(users, { fields: [partPayPlans.userId], references: [users.id] }),
  schedule: many(installments),
}));

export const installmentsRelations = relations(installments, ({ one }) => ({
  plan: one(partPayPlans, { fields: [installments.planId], references: [partPayPlans.id] }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  owner: one(users, { fields: [campaigns.ownerId], references: [users.id] }),
  donations: many(donations),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  campaign: one(campaigns, { fields: [donations.campaignId], references: [campaigns.id] }),
}));

// Handy row types
export type UserRow = typeof users.$inferSelect;
export type WalletRow = typeof wallets.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
export type CircleRow = typeof circles.$inferSelect;
export type CircleMemberRow = typeof circleMembers.$inferSelect;
export type PartPayPlanRow = typeof partPayPlans.$inferSelect;
export type InstallmentRow = typeof installments.$inferSelect;
export type CampaignRow = typeof campaigns.$inferSelect;
export type DonationRow = typeof donations.$inferSelect;
export type AgentRow = typeof agents.$inferSelect;
export type LinkedAccountRow = typeof linkedAccounts.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;
export type TrustSignalRow = typeof trustSignals.$inferSelect;
export type WithdrawalRow = typeof withdrawalRequests.$inferSelect;
