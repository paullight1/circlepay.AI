/**
 * CirclePay AI app store — single zustand store, persisted to AsyncStorage.
 *
 * Feature screens read state with selectors and mutate ONLY through the
 * actions defined here so money movements stay consistent across features
 * (every action that moves money also writes a Transaction).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { electricityToken, examPins } from '@/lib/billers';
import { daysFromNow, formatNaira, uid } from '@/lib/format';
import { advance, fastForward, firstRunAt, MAX_CATCHUP } from '@/lib/savings';
import {
  seedAgents, seedBills, seedCampaigns, seedCircles, seedLinkedAccounts,
  seedNotifications, seedPlans, seedSavingsPlans, seedTransactions,
  seedTrustSignals, seedUser, seedWallet,
} from './seed';
import type {
  AgentLocation, AppNotification, BillAgentRequest, BillCategoryId, BillMethod,
  BillPayment, Campaign, Circle, CircleMember, Donation, Frequency,
  LinkedAccount, PartPayPlan, PayCategory, PayModel, SavingsPlan, SavingsRun,
  Transaction, TrustSignal, User, Wallet, WithdrawalRequest,
} from './types';

/** Home grid default, in the order drawn in the designs. */
const DEFAULT_QUICK_ACCESS = [
  'savings', 'auto-savings', 'circles', 'support', 'bills', 'airtime', 'pos',
];

export interface CreateCircleInput {
  name: string;
  memberCount: number;
  amountPerMember: number;
  frequency: Frequency;
  startDate?: string;
}

export interface CreatePlanInput {
  title: string;
  detail?: string;
  category: PayCategory;
  model: PayModel;
  totalAmount: number;
  durationMonths: number;
}

export interface CreateCampaignInput {
  title: string;
  category: Campaign['category'];
  target: number;
  deadlineDays: number;
  about: string;
}

/** Everything a bill purchase needs, whatever the category. */
export interface PayBillInput {
  categoryId: BillCategoryId;
  categoryLabel: string;
  billerId: string;
  billerName: string;
  customerRef: string;
  customerName?: string;
  planLabel?: string;
  detail?: string;
  amount: number;
  fee: number;
  /** Credential the biller issues on success. */
  issues?: 'token' | 'pins';
  pinPrefix?: string;
  pinCount?: number;
}

export interface BillResult {
  ok: boolean;
  payment?: BillPayment;
  error?: string;
}

export interface CreateSavingsPlanInput {
  name: string;
  type: SavingsPlan['type'];
  amount: number;
  frequency: Frequency;
  accountId: string;
  startDate: string;
  endDate?: string;
  circleId?: string;
  partPayId?: string;
}

/** Fields a user may change on an existing plan. */
export type SavingsPlanPatch = Partial<
  Pick<SavingsPlan, 'name' | 'amount' | 'frequency' | 'accountId' | 'startDate' | 'endDate'>
>;

interface AppState {
  // ── Auth / onboarding ──
  onboarded: boolean;        // finished phone→OTP→KYC→PIN flow
  seenOnboarding: boolean;   // finished the intro carousel — survives sign-out
  seenWelcome: boolean;      // the post-setup welcome modal has fired
  coachMarksSeen: string[];  // tab keys whose coach mark has been dismissed
  user: User;
  setOnboarded: (v: boolean) => void;
  setSeenOnboarding: (v: boolean) => void;
  setSeenWelcome: (v: boolean) => void;
  markCoachMarkSeen: (key: string) => void;
  setKycTier: (tier: 0 | 1 | 2) => void;
  setPin: (enabledBiometrics: boolean) => void;
  updateUser: (patch: Partial<User>) => void;

  // ── Wallet ──
  wallet: Wallet;
  transactions: Transaction[];
  addMoney: (amount: number, source: string) => void;
  withdrawFromWallet: (amount: number, destination: string, fee?: number) => boolean;
  transfer: (amount: number, recipient: string) => boolean;

  // ── Circles ──
  circles: Circle[];
  createCircle: (input: CreateCircleInput) => Circle;
  contributeToCircle: (circleId: string, source?: 'manual' | 'auto') => boolean;

  // ── PartPay ──
  plans: PartPayPlan[];
  createPlan: (input: CreatePlanInput) => PartPayPlan;
  payInstallment: (planId: string, installmentId: string) => boolean;

  // ── CircleSupport ──
  campaigns: Campaign[];
  createCampaign: (input: CreateCampaignInput) => Campaign;
  donate: (campaignId: string, amount: number, method: Donation['method'], donor?: string) => boolean;

  // ── Bills ──
  bills: BillPayment[];
  payBill: (input: PayBillInput) => BillResult;
  billAgentRequest: BillAgentRequest | null;
  requestAgentBillPayment: (input: PayBillInput) => BillResult;
  completeAgentBillPayment: () => void;
  cancelAgentBillPayment: () => void;
  /** Pushes the token/PIN notification once a bill has settled. */
  notifyBillCredential: (payment: BillPayment) => void;

  // ── Agent / kiosk ──
  agents: AgentLocation[];
  linkedAccounts: LinkedAccount[];
  linkAccount: (bank: string) => void;
  redeemedSerials: string[];
  redeemScratchCard: (serial: string) => { ok: boolean; amount?: number; error?: string };
  withdrawal: WithdrawalRequest | null;
  requestKioskWithdrawal: (amount: number) => WithdrawalRequest | null;
  completeKioskWithdrawal: () => void;
  cancelKioskWithdrawal: () => void;

  // ── Automated savings ──
  savingsPlans: SavingsPlan[];
  createSavingsPlan: (input: CreateSavingsPlanInput) => SavingsPlan;
  updateSavingsPlan: (id: string, patch: SavingsPlanPatch) => void;
  pauseSavingsPlan: (id: string) => void;
  resumeSavingsPlan: (id: string) => void;
  cancelSavingsPlan: (id: string) => void;
  /** Executes every deduction that has come due. Returns how many ran. */
  runDueSavings: () => number;

  // ── Home Quick Access ──
  quickAccess: string[];
  setQuickAccess: (ids: string[]) => void;

  // ── Trust & notifications ──
  trustSignals: TrustSignal[];
  notifications: AppNotification[];
  markAllNotificationsRead: () => void;
  pushNotification: (n: Omit<AppNotification, 'id' | 'date' | 'read'>) => void;

  // ── Misc ──
  resetApp: () => void;
}

function tx(partial: Omit<Transaction, 'id' | 'date'>): Transaction {
  return { ...partial, id: uid('t'), date: new Date().toISOString() };
}

/** Bill receipt reference, e.g. "CPB-4821906". */
function billReference(): string {
  return `CPB-${Math.floor(1000000 + ((Date.now() * 7919) % 9000000))}`;
}

/**
 * Builds the BillPayment record, minting the token or PINs the biller issues.
 * Both are derived from the reference so a receipt re-opened from history shows
 * the credential it was issued with.
 */
function buildBillPayment(
  input: PayBillInput,
  method: BillMethod,
  status: BillPayment['status']
): BillPayment {
  const reference = billReference();
  return {
    id: uid('b'),
    reference,
    categoryId: input.categoryId,
    categoryLabel: input.categoryLabel,
    billerId: input.billerId,
    billerName: input.billerName,
    customerRef: input.customerRef,
    customerName: input.customerName,
    planLabel: input.planLabel,
    detail: input.detail,
    amount: input.amount,
    fee: input.fee,
    method,
    status,
    date: new Date().toISOString(),
    token: input.issues === 'token' ? electricityToken(reference) : undefined,
    pins:
      input.issues === 'pins'
        ? examPins(reference, input.pinPrefix ?? input.billerName, Math.max(1, input.pinCount ?? 1))
        : undefined,
  };
}

/** Scratch card serials: 14-16 digits. Denomination derived from the serial so demo is deterministic. */
function scratchCardValue(serial: string): number {
  const clean = serial.replace(/\s|-/g, '');
  if (!/^\d{14,16}$/.test(clean)) return 0;
  const denoms = [1000, 5000, 10000];
  return denoms[Number(clean[clean.length - 1]) % 3]!;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      seenOnboarding: false,
      seenWelcome: false,
      coachMarksSeen: [],
      user: seedUser,
      setOnboarded: (v) => set({ onboarded: v }),
      setSeenOnboarding: (v) => set({ seenOnboarding: v }),
      setSeenWelcome: (v) => set({ seenWelcome: v }),
      markCoachMarkSeen: (key) =>
        set((s) =>
          s.coachMarksSeen.includes(key)
            ? s
            : { coachMarksSeen: [...s.coachMarksSeen, key] }
        ),
      setKycTier: (tier) => set((s) => ({ user: { ...s.user, kycTier: tier } })),
      setPin: (bio) => set((s) => ({ user: { ...s.user, pinSet: true, biometricsEnabled: bio } })),
      updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),

      wallet: seedWallet,
      transactions: seedTransactions,

      addMoney: (amount, source) =>
        set((s) => ({
          wallet: { ...s.wallet, available: s.wallet.available + amount },
          transactions: [
            tx({ title: 'Wallet Top-up', subtitle: source, amount, direction: 'in', status: 'success', category: 'wallet' }),
            ...s.transactions,
          ],
        })),

      withdrawFromWallet: (amount, destination, fee = 0) => {
        const s = get();
        if (amount + fee > s.wallet.available) return false;
        set({
          wallet: { ...s.wallet, available: s.wallet.available - amount - fee },
          transactions: [
            tx({ title: 'Withdrawal', subtitle: destination, amount: amount + fee, direction: 'out', status: 'success', category: 'wallet' }),
            ...s.transactions,
          ],
        });
        return true;
      },

      transfer: (amount, recipient) => {
        const s = get();
        if (amount > s.wallet.available) return false;
        set({
          wallet: { ...s.wallet, available: s.wallet.available - amount },
          transactions: [
            tx({ title: 'Transfer', subtitle: `To ${recipient}`, amount, direction: 'out', status: 'success', category: 'wallet' }),
            ...s.transactions,
          ],
        });
        return true;
      },

      circles: seedCircles,

      createCircle: (input) => {
        const you: CircleMember = {
          id: uid('m'), name: get().user.name, status: 'pending',
          amount: input.amountPerMember, isYou: true, position: 1,
          riskLevel: 'low', riskScore: 10,
        };
        const others: CircleMember[] = Array.from({ length: Math.max(0, input.memberCount - 1) }, (_, i) => ({
          id: uid('m'), name: `Member ${i + 2}`, status: 'pending',
          amount: input.amountPerMember, position: i + 2, riskLevel: 'low', riskScore: 10,
        }));
        const circle: Circle = {
          id: uid('c'), name: input.name, frequency: input.frequency,
          amountPerMember: input.amountPerMember, members: [you, ...others],
          currentCycle: 1,
          nextPayoutDate:
            input.startDate ??
            daysFromNow(input.frequency === 'daily' ? 1 : input.frequency === 'weekly' ? 7 : 30),
          backupPoolPct: 10, backupPoolBalance: 0, status: 'pending',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ circles: [circle, ...s.circles] }));
        get().pushNotification({
          type: 'system', title: 'Circle Created',
          body: `${input.name} is ready. Share the invite link to add members.`,
        });
        return circle;
      },

      contributeToCircle: (circleId, source = 'manual') => {
        const s = get();
        const circle = s.circles.find((c) => c.id === circleId);
        if (!circle) return false;
        const amount = circle.amountPerMember;
        if (amount > s.wallet.available) return false;
        const backup = Math.round(amount * (circle.backupPoolPct / 100));
        set({
          wallet: { ...s.wallet, available: s.wallet.available - amount, onHold: s.wallet.onHold + amount },
          circles: s.circles.map((c) =>
            c.id === circleId
              ? {
                  ...c,
                  backupPoolBalance: c.backupPoolBalance + backup,
                  members: c.members.map((m) => (m.isYou ? { ...m, status: 'paid' } : m)),
                }
              : c
          ),
          transactions: [
            tx({
              title: source === 'auto' ? 'Automated Contribution' : 'Manual Contribution',
              subtitle: circle.name,
              amount,
              direction: 'out',
              status: 'success',
              category: 'circle',
            }),
            ...s.transactions,
          ],
        });
        return true;
      },

      plans: seedPlans,

      createPlan: (input) => {
        const perMonth = Math.ceil(input.totalAmount / input.durationMonths);
        const plan: PartPayPlan = {
          id: uid('p'),
          title: input.title,
          detail: input.detail,
          category: input.category,
          model: input.model,
          totalAmount: input.totalAmount,
          initialPayment: perMonth,
          installmentAmount: perMonth,
          frequency: 'monthly',
          durationMonths: input.durationMonths,
          paidAmount: 0,
          serviceFeePct: input.model === 'upfront' ? 3 : 0,
          schedule: Array.from({ length: input.durationMonths }, (_, i) => ({
            id: uid('i'),
            date: daysFromNow(30 * (i + 1), 9, 0),
            amount: perMonth,
            status: i === 0 ? 'upcoming' as const : 'pending' as const,
          })),
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ plans: [plan, ...s.plans] }));
        get().pushNotification({
          type: 'system', title: 'Payment Plan Created',
          body: `${input.title} — first payment due soon. We will remind you before each due date.`,
        });
        return plan;
      },

      payInstallment: (planId, installmentId) => {
        const s = get();
        const plan = s.plans.find((p) => p.id === planId);
        const inst = plan?.schedule.find((i) => i.id === installmentId);
        if (!plan || !inst || inst.status === 'paid') return false;
        if (inst.amount > s.wallet.available) return false;
        set({
          wallet: { ...s.wallet, available: s.wallet.available - inst.amount },
          plans: s.plans.map((p) => {
            if (p.id !== planId) return p;
            const schedule = p.schedule.map((i) => (i.id === installmentId ? { ...i, status: 'paid' as const } : i));
            const nextPending = schedule.find((i) => i.status === 'pending');
            if (nextPending) nextPending.status = 'upcoming';
            const paidAmount = p.paidAmount + inst.amount;
            return { ...p, schedule, paidAmount, status: paidAmount >= p.totalAmount ? 'completed' : 'active' };
          }),
          transactions: [
            tx({ title: `Payment - ${plan.title}`, subtitle: 'PartPay installment', amount: inst.amount, direction: 'out', status: 'success', category: 'partpay' }),
            ...s.transactions,
          ],
        });
        return true;
      },

      campaigns: seedCampaigns,

      createCampaign: (input) => {
        const campaign: Campaign = {
          id: uid('cam'),
          code: `CP-${Math.floor(100000 + (Date.now() % 900000))}`,
          title: input.title,
          organizer: get().user.name,
          category: input.category,
          target: input.target,
          raised: 0,
          supporters: 0,
          deadline: daysFromNow(input.deadlineDays, 23, 59),
          about: input.about,
          donations: [],
          isMine: true,
          status: 'active',
        };
        set((s) => ({ campaigns: [campaign, ...s.campaigns] }));
        get().pushNotification({
          type: 'campaign', title: 'Campaign Live',
          body: `${input.title} is live. Share your link to start receiving support.`,
        });
        return campaign;
      },

      donate: (campaignId, amount, method, donor) => {
        const s = get();
        const campaign = s.campaigns.find((c) => c.id === campaignId);
        if (!campaign) return false;
        if (method === 'wallet') {
          if (amount > s.wallet.available) return false;
          set({ wallet: { ...s.wallet, available: s.wallet.available - amount } });
        }
        const donation: Donation = {
          id: uid('d'), donor: donor ?? s.user.name, amount,
          date: new Date().toISOString(), method,
        };
        set((cur) => ({
          campaigns: cur.campaigns.map((c) =>
            c.id === campaignId
              ? { ...c, raised: c.raised + amount, supporters: c.supporters + 1, donations: [donation, ...c.donations] }
              : c
          ),
          transactions: [
            tx({ title: 'Donation', subtitle: campaign.title, amount, direction: 'out', status: 'success', category: 'campaign' }),
            ...cur.transactions,
          ],
        }));
        return true;
      },

      bills: seedBills,

      payBill: (input) => {
        const s = get();
        const total = input.amount + input.fee;
        if (input.amount <= 0) return { ok: false, error: 'Enter a valid amount.' };
        if (total > s.wallet.available) {
          return {
            ok: false,
            error:
              `Insufficient balance. ${formatNaira(total)} needed, ` +
              `${formatNaira(s.wallet.available, 2)} available.`,
          };
        }
        const payment = buildBillPayment(input, 'wallet', 'success');
        set({
          wallet: { ...s.wallet, available: s.wallet.available - total },
          bills: [payment, ...s.bills],
          transactions: [
            tx({
              title: payment.billerName,
              subtitle: `${payment.categoryLabel} · ${payment.customerRef}`,
              amount: total, direction: 'out', status: 'success', category: 'bill',
            }),
            ...s.transactions,
          ],
        });
        get().notifyBillCredential(payment);
        return { ok: true, payment };
      },

      billAgentRequest: null,

      requestAgentBillPayment: (input) => {
        const s = get();
        const total = input.amount + input.fee;
        if (input.amount <= 0) return { ok: false, error: 'Enter a valid amount.' };
        if (total > s.wallet.available) {
          return {
            ok: false,
            error:
              `Insufficient balance. The agent charges your wallet ${formatNaira(total)}, ` +
              `${formatNaira(s.wallet.available, 2)} available.`,
          };
        }
        const payment = buildBillPayment(input, 'agent', 'pending');
        set({
          bills: [payment, ...s.bills],
          billAgentRequest: {
            code: String(Math.floor(100000 + ((Date.now() * 7919) % 900000))),
            paymentId: payment.id,
            expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
            status: 'pending',
          },
        });
        return { ok: true, payment };
      },

      completeAgentBillPayment: () => {
        const s = get();
        const req = s.billAgentRequest;
        const payment = s.bills.find((b) => b.id === req?.paymentId);
        if (!req || req.status !== 'pending' || !payment) return;
        const total = payment.amount + payment.fee;
        if (total > s.wallet.available) {
          // Balance moved since the code was issued — record the failure honestly.
          set({
            billAgentRequest: null,
            bills: s.bills.map((b) => (b.id === payment.id ? { ...b, status: 'failed' as const } : b)),
          });
          return;
        }
        set({
          billAgentRequest: { ...req, status: 'completed' },
          wallet: { ...s.wallet, available: s.wallet.available - total },
          bills: s.bills.map((b) => (b.id === payment.id ? { ...b, status: 'success' as const } : b)),
          transactions: [
            tx({
              title: payment.billerName,
              subtitle: `${payment.categoryLabel} · Paid at agent`,
              amount: total, direction: 'out', status: 'success', category: 'bill',
            }),
            ...s.transactions,
          ],
        });
        get().notifyBillCredential(payment);
      },

      cancelAgentBillPayment: () => {
        const s = get();
        const id = s.billAgentRequest?.paymentId;
        set({
          billAgentRequest: null,
          bills: id ? s.bills.filter((b) => !(b.id === id && b.status === 'pending')) : s.bills,
        });
      },

      notifyBillCredential: (payment) => {
        if (payment.token) {
          get().pushNotification({
            type: 'payment',
            title: 'Meter Token Ready',
            body: `Your ${payment.billerName} token is ${payment.token}. It is saved on your receipt.`,
          });
        }
        if (payment.pins?.length) {
          get().pushNotification({
            type: 'payment',
            title: 'PINs Delivered',
            body: `${payment.pins.length} ${payment.billerName} PIN${payment.pins.length > 1 ? 's are' : ' is'} on your receipt.`,
          });
        }
      },

      agents: seedAgents,
      linkedAccounts: seedLinkedAccounts,
      linkAccount: (bank) =>
        set((s) => ({
          linkedAccounts: [
            ...s.linkedAccounts,
            { id: uid('la'), bank, last4: String(1000 + (Date.now() % 9000)), active: true },
          ],
        })),

      redeemedSerials: [],
      redeemScratchCard: (serial) => {
        const clean = serial.replace(/\s|-/g, '');
        const value = scratchCardValue(clean);
        if (!value) return { ok: false, error: 'Enter a valid 14–16 digit serial number.' };
        if (get().redeemedSerials.includes(clean)) return { ok: false, error: 'This card has already been used.' };
        set((s) => ({
          redeemedSerials: [...s.redeemedSerials, clean],
          wallet: { ...s.wallet, available: s.wallet.available + value },
          transactions: [
            tx({ title: 'Scratch Card Redeemed', subtitle: `Card •••• ${clean.slice(-4)}`, amount: value, direction: 'in', status: 'success', category: 'agent' }),
            ...s.transactions,
          ],
        }));
        return { ok: true, amount: value };
      },

      withdrawal: null,
      requestKioskWithdrawal: (amount) => {
        const s = get();
        const fee = Math.max(100, Math.round(amount * 0.01));
        if (amount + fee > s.wallet.available) return null;
        const code = String(Math.floor(100000 + ((Date.now() * 7919) % 900000)));
        const req: WithdrawalRequest = {
          code, amount, fee,
          expiresAt: new Date(Date.now() + 5 * 60000).toISOString(),
          status: 'pending',
        };
        set({ withdrawal: req });
        return req;
      },
      completeKioskWithdrawal: () => {
        const s = get();
        const w = s.withdrawal;
        if (!w || w.status !== 'pending') return;
        set({
          withdrawal: { ...w, status: 'completed' },
          wallet: { ...s.wallet, available: s.wallet.available - w.amount - w.fee },
          transactions: [
            tx({ title: 'Kiosk Cash Withdrawal', subtitle: `Code ${w.code}`, amount: w.amount + w.fee, direction: 'out', status: 'success', category: 'agent' }),
            ...s.transactions,
          ],
        });
      },
      cancelKioskWithdrawal: () => set({ withdrawal: null }),

      savingsPlans: seedSavingsPlans,

      createSavingsPlan: (input) => {
        const plan: SavingsPlan = {
          id: uid('sp'),
          name: input.name.trim(),
          type: input.type,
          amount: input.amount,
          frequency: input.frequency,
          accountId: input.accountId,
          startDate: input.startDate,
          endDate: input.endDate,
          nextRunAt: firstRunAt(input.startDate, input.frequency),
          status: 'active',
          totalSaved: 0,
          runs: [],
          circleId: input.circleId,
          partPayId: input.partPayId,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ savingsPlans: [plan, ...s.savingsPlans] }));
        get().pushNotification({
          type: 'savings',
          title: 'Automated Plan Created',
          body: `${plan.name} is active. First deduction on ${new Date(plan.nextRunAt).toDateString()}.`,
        });
        return plan;
      },

      updateSavingsPlan: (id, patch) =>
        set((s) => ({
          savingsPlans: s.savingsPlans.map((p) => {
            if (p.id !== id) return p;
            const next = { ...p, ...patch };
            // Any change to cadence or start moves the next deduction.
            const rescheduled =
              patch.frequency !== undefined || patch.startDate !== undefined
                ? firstRunAt(next.startDate, next.frequency)
                : p.nextRunAt;
            return { ...next, nextRunAt: rescheduled };
          }),
        })),

      pauseSavingsPlan: (id) =>
        set((s) => ({
          savingsPlans: s.savingsPlans.map((p) =>
            p.id === id ? { ...p, status: 'paused' as const } : p
          ),
        })),

      // Resuming must not fire the deductions missed while paused.
      resumeSavingsPlan: (id) =>
        set((s) => ({
          savingsPlans: s.savingsPlans.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'active' as const,
                  nextRunAt: fastForward(p.nextRunAt, p.frequency).next,
                }
              : p
          ),
        })),

      cancelSavingsPlan: (id) =>
        set((s) => ({ savingsPlans: s.savingsPlans.filter((p) => p.id !== id) })),

      runDueSavings: () => {
        const now = new Date();
        let executed = 0;

        /**
         * Runs one deduction and advances the plan.
         *
         * Returns whether a deduction actually happened — NOT whether it
         * succeeded. A failed debit still ran (it appended a transaction and
         * advanced the schedule); a plan that simply had nothing left to pay
         * did not, and must not be counted.
         */
        const runOnce = (planId: string): 'ran' | 'nothing-due' => {
          const s = get();
          const plan = s.savingsPlans.find((p) => p.id === planId);
          if (!plan) return 'nothing-due';

          let ok: boolean;
          // Distinguishes "no money" from "the linked record refused it", so the
          // failure we report to the user is the one that actually happened.
          const insufficient = plan.amount > s.wallet.available;

          if (plan.circleId) {
            // Delegate so the circle really advances — and so we do not append a
            // second transaction; contributeToCircle already appends one.
            ok = s.contributeToCircle(plan.circleId, 'auto');
          } else if (plan.partPayId) {
            const target = s.plans.find((p) => p.id === plan.partPayId);
            const due = target?.schedule.find((i) => i.status === 'upcoming');
            if (!due) {
              set((st) => ({
                savingsPlans: st.savingsPlans.map((p) =>
                  p.id === planId ? { ...p, status: 'completed' as const } : p
                ),
              }));
              return 'nothing-due';
            }
            ok = s.payInstallment(plan.partPayId, due.id);
          } else {
            ok = plan.amount <= s.wallet.available;
            if (ok) {
              set((st) => ({
                wallet: {
                  ...st.wallet,
                  available: st.wallet.available - plan.amount,
                  savings: st.wallet.savings + plan.amount,
                },
                transactions: [
                  tx({
                    title: plan.name,
                    subtitle: 'Automated Savings',
                    amount: plan.amount,
                    direction: 'out',
                    status: 'success',
                    category: 'savings',
                  }),
                  ...st.transactions,
                ],
              }));
            }
          }

          if (!ok) {
            // A failed auto-debit is user-visible, never a silent no-op.
            set((st) => ({
              transactions: [
                tx({
                  title: plan.name,
                  subtitle: 'Automated Savings',
                  amount: plan.amount,
                  direction: 'out',
                  status: 'failed',
                  category: 'savings',
                }),
                ...st.transactions,
              ],
            }));
            get().pushNotification({
              type: 'alert',
              title: 'Auto-debit failed',
              body: insufficient
                ? `${plan.name} could not be deducted — your wallet balance was too low.`
                : `${plan.name} could not be deducted — the linked circle or plan did not accept it.`,
            });
          }

          const run: SavingsRun = {
            id: uid('sr'),
            date: new Date().toISOString(),
            amount: plan.amount,
            status: ok ? 'success' : 'failed',
            reason: ok ? undefined : insufficient ? 'Insufficient balance' : 'Could not be applied',
          };

          // Advance even on failure, or an empty wallet retries on every app open.
          set((st) => ({
            savingsPlans: st.savingsPlans.map((p) =>
              p.id === planId
                ? {
                    ...p,
                    nextRunAt: advance(p.nextRunAt, p.frequency),
                    totalSaved: ok ? p.totalSaved + plan.amount : p.totalSaved,
                    runs: [run, ...p.runs],
                  }
                : p
            ),
          }));
          return 'ran';
        };

        for (const seen of get().savingsPlans) {
          if (seen.status !== 'active') continue;

          for (let i = 0; i < MAX_CATCHUP; i++) {
            const plan = get().savingsPlans.find((p) => p.id === seen.id);
            if (!plan || plan.status !== 'active') break;
            if (new Date(plan.nextRunAt).getTime() > now.getTime()) break;
            if (plan.endDate && new Date(plan.nextRunAt).getTime() > new Date(plan.endDate).getTime()) {
              set((st) => ({
                savingsPlans: st.savingsPlans.map((p) =>
                  p.id === plan.id ? { ...p, status: 'completed' as const } : p
                ),
              }));
              break;
            }
            if (runOnce(plan.id) === 'ran') executed++;
          }

          // Hit the cap and still behind → skip the rest, but say so.
          const after = get().savingsPlans.find((p) => p.id === seen.id);
          if (after && after.status === 'active' && new Date(after.nextRunAt).getTime() <= now.getTime()) {
            const { next, skipped } = fastForward(after.nextRunAt, after.frequency, now);
            set((st) => ({
              savingsPlans: st.savingsPlans.map((p) => (p.id === after.id ? { ...p, nextRunAt: next } : p)),
            }));
            if (skipped > 0) {
              get().pushNotification({
                type: 'savings',
                title: 'Deductions skipped',
                body: `${skipped} ${after.name} deduction${skipped > 1 ? 's were' : ' was'} skipped while you were away.`,
              });
            }
          }
        }

        return executed;
      },

      quickAccess: DEFAULT_QUICK_ACCESS,
      setQuickAccess: (ids) => set({ quickAccess: ids }),

      trustSignals: seedTrustSignals,
      notifications: seedNotifications,
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      pushNotification: (n) =>
        set((s) => ({
          notifications: [{ ...n, id: uid('n'), date: new Date().toISOString(), read: false }, ...s.notifications],
        })),

      resetApp: () =>
        set({
          onboarded: false,
          seenOnboarding: false,
          seenWelcome: false,
          coachMarksSeen: [],
          user: seedUser,
          wallet: seedWallet,
          transactions: seedTransactions,
          circles: seedCircles,
          plans: seedPlans,
          campaigns: seedCampaigns,
          bills: seedBills,
          billAgentRequest: null,
          agents: seedAgents,
          linkedAccounts: seedLinkedAccounts,
          redeemedSerials: [],
          withdrawal: null,
          savingsPlans: seedSavingsPlans,
          quickAccess: DEFAULT_QUICK_ACCESS,
          trustSignals: seedTrustSignals,
          notifications: seedNotifications,
        }),
    }),
    {
      name: 'circlepay-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** Total balance = available + on hold (as on the design's balance card). */
export function selectTotalBalance(s: Pick<AppState, 'wallet'>): number {
  return s.wallet.available + s.wallet.onHold;
}
