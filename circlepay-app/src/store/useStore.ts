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

import { daysFromNow, uid } from '@/lib/format';
import {
  seedAgents, seedCampaigns, seedCircles, seedLinkedAccounts,
  seedNotifications, seedPlans, seedTransactions, seedTrustSignals,
  seedUser, seedWallet,
} from './seed';
import type {
  AgentLocation, AppNotification, Campaign, Circle, CircleMember, Donation,
  Frequency, LinkedAccount, PartPayPlan, PayCategory, PayModel, Transaction,
  TrustSignal, User, Wallet, WithdrawalRequest,
} from './types';

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

interface AppState {
  // ── Auth / onboarding ──
  onboarded: boolean;        // finished welcome→OTP→KYC→PIN flow
  user: User;
  setOnboarded: (v: boolean) => void;
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
  contributeToCircle: (circleId: string) => boolean;

  // ── PartPay ──
  plans: PartPayPlan[];
  createPlan: (input: CreatePlanInput) => PartPayPlan;
  payInstallment: (planId: string, installmentId: string) => boolean;

  // ── CircleSupport ──
  campaigns: Campaign[];
  createCampaign: (input: CreateCampaignInput) => Campaign;
  donate: (campaignId: string, amount: number, method: Donation['method'], donor?: string) => boolean;

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
      user: seedUser,
      setOnboarded: (v) => set({ onboarded: v }),
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

      contributeToCircle: (circleId) => {
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
            tx({ title: 'Manual Contribution', subtitle: circle.name, amount, direction: 'out', status: 'success', category: 'circle' }),
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
          user: seedUser,
          wallet: seedWallet,
          transactions: seedTransactions,
          circles: seedCircles,
          plans: seedPlans,
          campaigns: seedCampaigns,
          agents: seedAgents,
          linkedAccounts: seedLinkedAccounts,
          redeemedSerials: [],
          withdrawal: null,
          trustSignals: seedTrustSignals,
          notifications: seedNotifications,
        }),
    }),
    {
      name: 'circlepay-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** Total balance = available + on hold (as on the design's balance card). */
export function selectTotalBalance(s: Pick<AppState, 'wallet'>): number {
  return s.wallet.available + s.wallet.onHold;
}
