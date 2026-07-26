# Automated Savings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users link a bank account and have CirclePay automatically deduct daily savings, weekly circle contributions and PartPay instalments on a schedule.

**Architecture:** A single `SavingsPlan` record covers all three cadences. Plans optionally point at an existing `Circle` or `PartPayPlan`, in which case a run delegates to the store action that already handles that domain, so no money logic is duplicated. Deductions execute through a catch-up engine (`runDueSavings`) called from the root layout on mount and foreground — the persisted store makes this genuinely real across days. Seven new screens plus a restructured Home and a new Savings tab.

**Tech Stack:** Expo SDK 57, expo-router (file-based, typed routes), React Native 0.86, TypeScript strict, zustand + AsyncStorage persist, Ionicons, expo-linear-gradient.

**Spec:** `docs/superpowers/specs/2026-07-26-automated-savings-design.md` — read it before Task 1.

## Global Constraints

- **Working directory is `circlepay-app/`.** Every command below runs from there.
- **THERE IS NO TEST SUITE IN THIS WORKSPACE.** Do not create one, do not invent a test command, do not claim tests pass. Verification per task is `npx tsc --noEmit`, a scoped lint, and the scripted manual walk in that task's steps. This overrides the usual TDD cycle.
- `npx tsc --noEmit` must pass at the end of every task. There is no `typecheck` script in this package.
- **`npm run lint` does NOT pass in this repo and never did.** The baseline at commit `983f349` is **47 problems (36 errors, 11 warnings)**, all pre-existing, concentrated in `react-hooks/set-state-in-effect`, `react-hooks/refs` and `@typescript-eslint/array-type` across `src/app/*` and two `src/ui` files. Lint **only your own files** — `npx eslint <the files you touched>` — and require those to be clean. Do not "fix" unrelated files to make the whole run green; that is a separate cleanup task, deliberately out of scope. Re-check the total at the end and confirm it has not grown past 47.
- **Never import from `@react-navigation/*`** — not installed. expo-router v57 vendors it. Use `expo-router` and `expo-router/js-tabs`.
- **Never hardcode a hex colour or font family string.** Use `@/theme/tokens` (`colors`, `gradients`, `radius`, `spacing`, `fonts`, `shadow`).
- **Icons are Ionicons only**, via `@expo/vector-icons`.
- **`Alert.alert` is a silent no-op on react-native-web.** Use `notify` / `confirm` from `@/lib/dialogs`.
- **Money formatting** goes through `AmountText` or `formatNaira` from `@/lib/format`; dates through `formatDate` / `formatDateTime`.
- **Every money movement appends a `Transaction`** — that invariant holds for automated runs too.
- Use existing `@/ui` components before building anything bespoke. Screen-local presentational components are fine (see `QuickTile` in `src/app/(tabs)/index.tsx` for the pattern).
- **Write `T[]`, never `Array<T>`** — the repo enables `@typescript-eslint/array-type`, so the `Array<…>` form fails your own file's lint gate.
- **Prefer a statically-typed lookup over `as keyof typeof Ionicons.glyphMap`.** Building an icon name with a template literal and casting defeats the check that catches typos; a `Record<K, keyof typeof Ionicons.glyphMap>` makes a bad name a compile error instead of an invisible glyph at runtime.
- Only route files belong under `src/app/**` — every file there becomes a route. Shared components go in `src/ui`, helpers in `src/lib`.
- No `any` unless genuinely unavoidable.
- Deductions run at **08:00 local**. Plan names, hero copy and benefit labels come verbatim from the spec.

---

## File Structure

**Create:**

| Path | Responsibility |
|---|---|
| `src/lib/savings.ts` | Schedule maths — pure, no store access |
| `src/lib/shortcuts.ts` | Home Quick Access shortcut registry |
| `src/ui/StepDots.tsx` | Horizontal 1-2-3-4 wizard progress |
| `src/ui/BankPicker.tsx` | 3-column bank selection grid |
| `src/hooks/use-auto-savings.ts` | Runs the catch-up engine on mount/foreground |
| `src/app/(tabs)/savings.tsx` | Savings overview tab |
| `src/app/auto-savings/_layout.tsx` | Stack |
| `src/app/auto-savings/index.tsx` | Automated Savings hub |
| `src/app/auto-savings/create.tsx` | 4-step wizard + success state |
| `src/app/auto-savings/history.tsx` | All runs across all plans |
| `src/app/auto-savings/[id]/_layout.tsx` | Stack |
| `src/app/auto-savings/[id]/index.tsx` | Plan Summary |
| `src/app/auto-savings/[id]/schedule.tsx` | Full schedule |
| `src/app/quick-access.tsx` | Home grid editor |
| `src/app/campaigns/index.tsx` | CircleSupport, moved off the tab bar |

**Modify:** `src/store/types.ts`, `src/store/seed.ts`, `src/store/useStore.ts`, `src/ui/index.ts`, `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/more.tsx`, `src/app/campaigns/[id]/receipt.tsx`, `src/app/circles/link-bank.tsx`, `designs/design-spec.md`.

**Delete:** `src/app/(tabs)/support.tsx` (moved to `src/app/campaigns/index.tsx`).

---

## Task 1: Domain types and seed data

**Files:**
- Modify: `src/store/types.ts`
- Modify: `src/store/seed.ts`
- Modify: `src/app/trust/notifications.tsx` — holds `TYPE_ICONS: Record<NotifType, …>`, an **exhaustive** map. Widening `NotifType` fails `tsc` (TS2741) until this gains a `savings` entry, so it is part of this task, not a later one.

**Interfaces:**
- Consumes: nothing.
- Produces: `SavingsPlanType`, `SavingsPlanStatus`, `SavingsRun`, `SavingsPlan` types; `seedSavingsPlans: SavingsPlan[]`; `Transaction.category` accepts `'savings'`; `NotifType` accepts `'savings'`; `LinkedAccount.first4?: string`.

- [ ] **Step 1: Add the new types**

Append to `src/store/types.ts`, after the `LinkedAccount` interface:

```ts
export type SavingsPlanType = 'daily' | 'weekly' | 'instalment';
export type SavingsPlanStatus = 'active' | 'paused' | 'completed';

/** One executed deduction attempt. Newest first inside `SavingsPlan.runs`. */
export interface SavingsRun {
  id: string;
  date: string;              // ISO — when it actually ran
  amount: number;
  status: 'success' | 'failed';
  reason?: string;           // "Insufficient balance"
}

/**
 * A bank-funded recurring deduction. When `circleId` or `partPayId` is set the
 * run delegates to that domain's existing store action, so the circle or plan
 * really advances instead of the money landing in a parallel pot.
 */
export interface SavingsPlan {
  id: string;
  name: string;              // "Daily Savings Plan"
  type: SavingsPlanType;
  amount: number;
  frequency: Frequency;
  accountId: string;         // LinkedAccount.id — the debit source
  startDate: string;         // ISO
  endDate?: string;          // ISO, optional
  nextRunAt: string;         // ISO — next deduction, 08:00 local
  status: SavingsPlanStatus;
  totalSaved: number;        // sum of successful runs
  runs: SavingsRun[];
  circleId?: string;
  partPayId?: string;
  createdAt: string;
}
```

- [ ] **Step 2: Extend the three existing types**

In `src/store/types.ts`:

```ts
// NotifType — add 'savings'
export type NotifType = 'alert' | 'payment' | 'payout' | 'backup' | 'campaign' | 'system' | 'savings';
```

In the `Transaction` interface, change the `category` line to:

```ts
  category: 'circle' | 'wallet' | 'partpay' | 'campaign' | 'agent' | 'fee' | 'bill' | 'savings';
```

In the `LinkedAccount` interface, add after `last4`:

```ts
  first4?: string;           // "1234" — renders "GTBank · 1234 **** **** 5678"
```

Widening `NotifType` breaks `src/app/trust/notifications.tsx`, whose `TYPE_ICONS` is an exhaustive `Record<NotifType, …>`. Add the matching entry there:

```ts
  savings: { name: 'sync-circle', color: colors.success, bg: colors.successBg },
```

`Transaction.category` needs no equivalent — no exhaustive record is keyed on it.

- [ ] **Step 3: Add `first4` to the seeded accounts**

Replace `seedLinkedAccounts` in `src/store/seed.ts`:

```ts
export const seedLinkedAccounts: LinkedAccount[] = [
  { id: 'la-1', bank: 'GTBank', last4: '1234', first4: '0582', active: true, purpose: 'Family Esusu · Weekly' },
  { id: 'la-2', bank: 'Opay', last4: '5678', first4: '2210', active: true, purpose: 'Rent Payment Plan · Monthly' },
];
```

- [ ] **Step 4: Seed three plans**

Add to `src/store/seed.ts`. Import **only** `SavingsPlan` in the existing type import — the `runs` arrays are inline literals contextually typed by `SavingsPlan`, so importing `SavingsRun` too would be an unused import and fail lint. `daysFromNow` is already imported and already accepts negative day offsets, so no new format helper is needed.

```ts
/**
 * Mirrors the mockup's Active Plans list, but named and priced from records
 * that actually exist in this seed: a circle-linked plan's amount must equal
 * `circle.amountPerMember` or the contribution would be wrong.
 */
export const seedSavingsPlans: SavingsPlan[] = [
  {
    id: 'sp-daily',
    name: 'Daily Savings Plan',
    type: 'daily',
    amount: 1000,
    frequency: 'daily',
    accountId: 'la-1',
    startDate: daysFromNow(-30, 8, 0),
    nextRunAt: daysFromNow(1, 8, 0),
    status: 'active',
    totalSaved: 12000,
    runs: [
      { id: 'sr-d1', date: daysFromNow(0, 8, 0), amount: 1000, status: 'success' },
      { id: 'sr-d2', date: daysFromNow(-1, 8, 0), amount: 1000, status: 'success' },
      { id: 'sr-d3', date: daysFromNow(-2, 8, 0), amount: 1000, status: 'success' },
    ],
    createdAt: daysFromNow(-30, 8, 0),
  },
  {
    id: 'sp-esusu',
    name: 'Weekly Contribution – Family Esusu',
    type: 'weekly',
    amount: 10000,
    frequency: 'weekly',
    accountId: 'la-1',
    circleId: 'c-family-esusu',
    startDate: daysFromNow(-56, 8, 0),
    nextRunAt: daysFromNow(4, 8, 0),
    status: 'active',
    totalSaved: 80000,
    runs: [
      { id: 'sr-e1', date: daysFromNow(-3, 8, 0), amount: 10000, status: 'success' },
      { id: 'sr-e2', date: daysFromNow(-10, 8, 0), amount: 10000, status: 'success' },
    ],
    createdAt: daysFromNow(-56, 8, 0),
  },
  {
    id: 'sp-school',
    name: 'Instalment – School Fees Term 2',
    type: 'instalment',
    amount: 30000,
    frequency: 'monthly',
    accountId: 'la-2',
    partPayId: 'p-school',
    startDate: daysFromNow(-60, 8, 0),
    nextRunAt: daysFromNow(14, 8, 0),
    status: 'active',
    totalSaved: 60000,
    runs: [
      { id: 'sr-s1', date: daysFromNow(-16, 8, 0), amount: 30000, status: 'success' },
      { id: 'sr-s2', date: daysFromNow(-46, 8, 0), amount: 30000, status: 'success' },
    ],
    createdAt: daysFromNow(-60, 8, 0),
  },
];
```

`daysFromNow(days, hour, minute)` already exists in `src/lib/format.ts` and accepts negative days — confirm by reading it before use. If it does not accept negatives, add `export function daysAgo(days: number, hour = 8, minute = 0)` there rather than inlining date maths in the seed.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes. `seedSavingsPlans` is unused so far — that is fine, it is exported.

- [ ] **Step 6: Commit**

```bash
git add circlepay-app/src/store/types.ts circlepay-app/src/store/seed.ts
git commit -m "Add SavingsPlan domain types and seed plans"
```

---

## Task 2: Schedule maths (`src/lib/savings.ts`)

**Files:**
- Create: `src/lib/savings.ts`

**Interfaces:**
- Consumes: `SavingsPlan`, `Frequency`, `LinkedAccount` from Task 1.
- Produces: `RUN_HOUR`, `MAX_CATCHUP`, `atRunHour`, `advance`, `firstRunAt`, `fastForward`, `upcomingRuns`, `frequencyLabel`, `accountLabel`, `planTypeMeta`.

Pure functions only — no store access, no React. This is where every date decision lives so the store action and the screens cannot drift apart.

- [ ] **Step 1: Write the module**

Create `src/lib/savings.ts`:

```ts
import type { Frequency, LinkedAccount, SavingsPlan, SavingsPlanType } from '@/store/types';

/** Deductions run at 08:00 local, as drawn in the designs. */
export const RUN_HOUR = 8;

/**
 * Most deductions executed in one catch-up sweep. Coming back after a month
 * must not fire thirty instant debits; anything beyond the cap is fast-forwarded
 * and reported rather than silently dropped.
 */
export const MAX_CATCHUP = 5;

/** The given date at 08:00 local, as an ISO string. */
export function atRunHour(date: Date | string): string {
  const d = new Date(date);
  d.setHours(RUN_HOUR, 0, 0, 0);
  return d.toISOString();
}

/** One period later than `iso`, preserving the time of day. */
export function advance(iso: string, frequency: Frequency): string {
  const d = new Date(iso);
  if (frequency === 'daily') d.setDate(d.getDate() + 1);
  else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

/** First deduction at or after `startDate` that is still in the future. */
export function firstRunAt(startDate: string, frequency: Frequency, now: Date = new Date()): string {
  let next = atRunHour(startDate);
  while (new Date(next).getTime() <= now.getTime()) next = advance(next, frequency);
  return next;
}

/**
 * Skip past every missed occurrence without executing it. Used when a plan is
 * resumed, and when a catch-up sweep hits `MAX_CATCHUP` while still behind.
 */
export function fastForward(
  iso: string,
  frequency: Frequency,
  now: Date = new Date()
): { next: string; skipped: number } {
  let next = iso;
  let skipped = 0;
  while (new Date(next).getTime() <= now.getTime()) {
    next = advance(next, frequency);
    skipped++;
  }
  return { next, skipped };
}

/**
 * The next `count` occurrences, stopping at the end date.
 *
 * Takes a structural subset rather than a whole `SavingsPlan` so the create
 * wizard can preview a schedule for a plan that does not exist yet, without
 * casting a half-built object.
 */
export function upcomingRuns(
  plan: Pick<SavingsPlan, 'nextRunAt' | 'frequency'> & { endDate?: string },
  count: number
): string[] {
  const out: string[] = [];
  let at = plan.nextRunAt;
  for (let i = 0; i < count; i++) {
    if (plan.endDate && new Date(at).getTime() > new Date(plan.endDate).getTime()) break;
    out.push(at);
    at = advance(at, plan.frequency);
  }
  return out;
}

/** "Every Day" / "Every Week" / "Every Month" — the deduction-frequency label. */
export function frequencyLabel(f: Frequency): string {
  if (f === 'daily') return 'Every Day';
  if (f === 'weekly') return 'Every Week';
  return 'Every Month';
}

/** "GTBank · 0582 **** **** 1234" — the From row on the schedule screens. */
export function accountLabel(a: LinkedAccount): string {
  return a.first4 ? `${a.bank} · ${a.first4} **** **** ${a.last4}` : `${a.bank} •••• ${a.last4}`;
}

/** Icon and accent per plan type. Accents reuse existing status semantics. */
export const planTypeMeta: Record<
  SavingsPlanType,
  { label: string; blurb: string; icon: 'wallet' | 'people' | 'cart'; tint: 'success' | 'primary' | 'warning' }
> = {
  daily: {
    label: 'Daily Savings',
    blurb: 'Deduct a fixed amount every day',
    icon: 'wallet',
    tint: 'success',
  },
  weekly: {
    label: 'Weekly Contribution',
    blurb: 'Deduct a fixed amount every week',
    icon: 'people',
    tint: 'primary',
  },
  instalment: {
    label: 'Instalment Payment',
    blurb: 'Pay for items in flexible instalments',
    icon: 'cart',
    tint: 'warning',
  },
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 3: Sanity-check the maths in a scratch script**

This is not a test suite — it is a throwaway check that the date logic is right before the store depends on it. Write it to the scratchpad, not the repo.

```bash
cat > /tmp/savings-check.mjs <<'EOF'
const RUN_HOUR = 8;
const atRunHour = (d) => { const x = new Date(d); x.setHours(RUN_HOUR,0,0,0); return x.toISOString(); };
const advance = (iso, f) => { const d = new Date(iso);
  if (f==='daily') d.setDate(d.getDate()+1);
  else if (f==='weekly') d.setDate(d.getDate()+7);
  else d.setMonth(d.getMonth()+1);
  return d.toISOString(); };
const fastForward = (iso, f, now) => { let next = iso, skipped = 0;
  while (new Date(next).getTime() <= now.getTime()) { next = advance(next, f); skipped++; }
  return { next, skipped }; };

const now = new Date('2026-07-26T12:00:00');
console.log('daily from 10 days ago:', fastForward(atRunHour('2026-07-16'), 'daily', now));
console.log('weekly from 30 days ago:', fastForward(atRunHour('2026-06-26'), 'weekly', now));
console.log('month-end rollover:', advance(atRunHour('2026-01-31'), 'monthly'));
EOF
node /tmp/savings-check.mjs
```

Expected: daily reports `skipped: 11` and a `next` of 2026-07-27T08:00 local; weekly reports `skipped: 5`; the month-end rollover lands in March (JavaScript's `setMonth` overflow — acceptable, and the reason plans store an explicit `nextRunAt` rather than a day-of-month).

- [ ] **Step 4: Commit**

```bash
git add circlepay-app/src/lib/savings.ts
git commit -m "Add savings schedule helpers"
```

---

## Task 3: Store slice and the catch-up engine

**Files:**
- Modify: `src/store/useStore.ts`

**Interfaces:**
- Consumes: Task 1 types, Task 2 helpers.
- Produces: state `savingsPlans: SavingsPlan[]`, `quickAccess: string[]`; actions `createSavingsPlan(input: CreateSavingsPlanInput) => SavingsPlan`, `updateSavingsPlan(id: string, patch: SavingsPlanPatch) => void`, `pauseSavingsPlan(id: string) => void`, `resumeSavingsPlan(id: string) => void`, `cancelSavingsPlan(id: string) => void`, `runDueSavings() => number`, `setQuickAccess(ids: string[]) => void`; `contributeToCircle` gains a second parameter.

- [ ] **Step 1: Imports and input types**

Add to the type import from `./types`: `SavingsPlan`, `SavingsRun`. Add a new import:

```ts
import { advance, fastForward, firstRunAt, MAX_CATCHUP } from '@/lib/savings';
```

Add near the other `Create*Input` interfaces:

```ts
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
```

- [ ] **Step 2: Declare the state and actions on `AppState`**

Add to the `AppState` interface, after the `linkedAccounts` block:

```ts
  savingsPlans: SavingsPlan[];
  createSavingsPlan: (input: CreateSavingsPlanInput) => SavingsPlan;
  updateSavingsPlan: (id: string, patch: SavingsPlanPatch) => void;
  pauseSavingsPlan: (id: string) => void;
  resumeSavingsPlan: (id: string) => void;
  cancelSavingsPlan: (id: string) => void;
  /** Executes every deduction that has come due. Returns how many ran. */
  runDueSavings: () => number;

  quickAccess: string[];
  setQuickAccess: (ids: string[]) => void;
```

Change the `contributeToCircle` declaration to:

```ts
  contributeToCircle: (circleId: string, source?: 'manual' | 'auto') => boolean;
```

- [ ] **Step 3: Teach `contributeToCircle` about automated runs**

In `src/store/useStore.ts`, the action currently starts `contributeToCircle: (circleId) => {`. Change the signature and the transaction title only — nothing else in the body moves:

```ts
      contributeToCircle: (circleId, source = 'manual') => {
```

and in its `transactions:` array, replace the `title` so it reads:

```ts
            tx({
              title: source === 'auto' ? 'Automated Contribution' : 'Manual Contribution',
              subtitle: circle.name,
              amount,
              direction: 'out',
              status: 'success',
              category: 'circle',
            }),
```

Existing callers pass one argument and keep the old wording.

- [ ] **Step 4: Add the CRUD actions**

Insert after the `linkAccount` action:

```ts
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
```

- [ ] **Step 5: Add the catch-up engine**

Insert directly after `cancelSavingsPlan`. It is one long action on purpose — the whole execution policy lives in one readable place.

```ts
      runDueSavings: () => {
        const now = new Date();
        let executed = 0;

        /** Runs one deduction and advances the plan. Returns false if it failed. */
        const runOnce = (planId: string): boolean => {
          const s = get();
          const plan = s.savingsPlans.find((p) => p.id === planId);
          if (!plan) return false;

          let ok: boolean;

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
              return true;
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
              body: `${plan.name} could not be deducted — your wallet balance was too low.`,
            });
          }

          const run: SavingsRun = {
            id: uid('sr'),
            date: new Date().toISOString(),
            amount: plan.amount,
            status: ok ? 'success' : 'failed',
            reason: ok ? undefined : 'Insufficient balance',
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
          return ok;
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
            runOnce(plan.id);
            executed++;
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
```

- [ ] **Step 6: Add the Quick Access slice**

Insert after `runDueSavings`:

```ts
      quickAccess: DEFAULT_QUICK_ACCESS,
      setQuickAccess: (ids) => set({ quickAccess: ids }),
```

and at the top of the file, below the imports:

```ts
/** Home grid default, in the order drawn in the designs. */
const DEFAULT_QUICK_ACCESS = [
  'savings', 'auto-savings', 'circles', 'support', 'bills', 'airtime', 'pos',
];
```

- [ ] **Step 7: Extend `resetApp`**

Add to the object passed to `set` inside `resetApp`:

```ts
          savingsPlans: seedSavingsPlans,
          quickAccess: DEFAULT_QUICK_ACCESS,
```

Also add `seedSavingsPlans` to the existing `from './seed'` import.

- [ ] **Step 8: Bump the persisted store name**

The persisted shape changed, and an existing install would rehydrate without `savingsPlans`, crashing every new screen. In the `persist` options at the bottom of the file:

```ts
      name: 'circlepay-store-v2',
```

- [ ] **Step 9: Typecheck and lint**

Run: `npx tsc --noEmit`, then `npx eslint <the files this task touched>`
Expected: tsc passes; your own files lint clean. Do NOT run `npm run lint` and expect green — the repo has a pre-existing 47-problem baseline (see Global Constraints). Confirm the total has not grown.

- [ ] **Step 10: Commit**

```bash
git add circlepay-app/src/store/useStore.ts
git commit -m "Add savings plan store slice and catch-up engine"
```

---

## Task 4: `StepDots` and `BankPicker`

**Files:**
- Create: `src/ui/StepDots.tsx`
- Create: `src/ui/BankPicker.tsx`
- Modify: `src/ui/index.ts`

**Interfaces:**
- Consumes: tokens, `BrandTile`.
- Produces: `<StepDots count={number} current={number} />` (`current` is 0-based); `<BankPicker banks={readonly string[]} selected?={string} busy?={string} onSelect={(bank: string) => void} />`; `BANKS` exported from `BankPicker`.
- **`BANKS` is `readonly ["GTBank", …]`, not `string[]`** — the code block below uses `as const`. The `banks` prop is `readonly string[]` so both `BANKS` and a plain array satisfy it, but do not assign `BANKS` to a mutable `string[]` without spreading.

- [ ] **Step 1: Write `StepDots`**

The existing `Stepper` is vertical and `AuthProgress` is segmented bars, so neither fits the wizard's `1—2—3—4` rail.

```tsx
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

interface Props {
  count: number;
  /** 0-based index of the step being shown. */
  current: number;
}

/** Horizontal numbered progress rail for multi-step wizards. */
export function StepDots({ count, current }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={i} style={styles.segment}>
            <View style={[styles.dot, (done || active) && styles.dotOn]}>
              {done ? (
                <Ionicons name="checkmark" size={13} color={colors.onPrimary} />
              ) : (
                <Text style={[styles.dotText, active && styles.dotTextOn]}>{i + 1}</Text>
              )}
            </View>
            {i < count - 1 && <View style={[styles.rail, done && styles.railOn]} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotText: { fontFamily: fonts.bold, fontSize: 12, color: colors.faint },
  dotTextOn: { color: colors.onPrimary },
  rail: { width: 34, height: 2, backgroundColor: colors.border },
  railOn: { backgroundColor: colors.primary },
});
```

- [ ] **Step 2: Write `BankPicker`**

```tsx
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { BrandTile } from './BrandTile';

/** The banks offered in the designs, in grid order. */
export const BANKS = [
  'GTBank', 'Access Bank', 'First Bank',
  'Zenith Bank', 'UBA', 'Fidelity Bank',
  'Sterling Bank', 'Other Banks',
] as const;

/** Short marks for the tiles — initials read badly for these names. */
const MARKS: Record<string, string> = {
  'GTBank': 'GT',
  'Access Bank': 'AC',
  'First Bank': 'FB',
  'Zenith Bank': 'Z',
  'UBA': 'UBA',
  'Fidelity Bank': 'FD',
  'Sterling Bank': 'ST',
  'Other Banks': '•••',
};

interface Props {
  banks: readonly string[];
  /** Currently chosen bank name. */
  selected?: string;
  /** Bank currently being linked — shows a spinner on that tile. */
  busy?: string;
  onSelect: (bank: string) => void;
}

/** Three-column bank grid used by Link Bank Account and the savings wizard. */
export function BankPicker({ banks, selected, busy, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {banks.map((bank) => {
        const isSelected = selected === bank;
        return (
          <Pressable
            key={bank}
            onPress={() => onSelect(bank)}
            disabled={!!busy}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled: !!busy }}
            style={({ pressed }) => [
              styles.tile,
              isSelected && styles.tileSelected,
              pressed && { opacity: 0.75 },
            ]}>
            {busy === bank ? (
              <ActivityIndicator color={colors.primary} style={styles.mark} />
            ) : (
              <BrandTile name={bank} label={MARKS[bank] ?? bank.slice(0, 2)} size={40} />
            )}
            <Text style={styles.label} numberOfLines={2}>{bank}</Text>
            {isSelected && (
              <View style={styles.check}>
                <Ionicons name="checkmark" size={11} color={colors.onPrimary} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    // Three per row, accounting for two 8px gaps.
    width: '31.5%',
    alignItems: 'center',
    gap: 7,
    paddingVertical: spacing.md,
    paddingHorizontal: 6,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  tileSelected: { borderColor: colors.primary, backgroundColor: colors.chip },
  mark: { width: 40, height: 40 },
  label: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink, textAlign: 'center' },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 3: Export both**

Add to `src/ui/index.ts`, keeping alphabetical order:

```ts
export { BANKS, BankPicker } from './BankPicker';
export { StepDots } from './StepDots';
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`, then `npx eslint <the files this task touched>`
Expected: tsc passes; your own files lint clean. Do NOT run `npm run lint` and expect green — the repo has a pre-existing 47-problem baseline (see Global Constraints). Confirm the total has not grown.

- [ ] **Step 5: Commit**

```bash
git add circlepay-app/src/ui/StepDots.tsx circlepay-app/src/ui/BankPicker.tsx circlepay-app/src/ui/index.ts
git commit -m "Add StepDots and BankPicker UI components"
```

---

## Task 5: Run deductions on app open

**Files:**
- Create: `src/hooks/use-auto-savings.ts`
- Modify: `src/app/_layout.tsx`

**Interfaces:**
- Consumes: `runDueSavings` from Task 3.
- Produces: `useAutoSavings(): void`.

- [ ] **Step 1: Write the hook**

Create `src/hooks/use-auto-savings.ts`:

```ts
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useStore } from '@/store/useStore';

/**
 * Executes any deduction that has come due — once on mount, and again whenever
 * the app returns to the foreground. There is no background scheduler; the
 * persisted store plus this sweep is what makes the schedule feel real.
 */
export function useAutoSavings(): void {
  const runDueSavings = useStore((s) => s.runDueSavings);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    runDueSavings();

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        runDueSavings();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [runDueSavings]);
}
```

- [ ] **Step 2: Call it from the root layout**

In `src/app/_layout.tsx`, add the import and call it inside `RootLayout`, after the `useFonts` call and before the `if (!loaded) return null;` guard — hooks must run unconditionally:

```ts
import { useAutoSavings } from '@/hooks/use-auto-savings';
```

```ts
  useAutoSavings();
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 4: Verify nothing fires on a fresh store**

Run: `npm run web`, open http://localhost:8081, and check the Recent Transactions list on Home.
Expected: unchanged — all three seeded plans have a future `nextRunAt`, so the sweep executes zero runs. If new transactions appear, a seeded `nextRunAt` is in the past; fix the seed rather than the engine.

- [ ] **Step 5: Commit**

```bash
git add circlepay-app/src/hooks/use-auto-savings.ts circlepay-app/src/app/_layout.tsx
git commit -m "Run due savings deductions on app open and foreground"
```

---

## Task 6: Savings tab replaces Support

**Files:**
- Create: `src/app/campaigns/index.tsx` (moved content)
- Delete: `src/app/(tabs)/support.tsx`
- Create: `src/app/(tabs)/savings.tsx`
- Modify: `src/app/(tabs)/_layout.tsx`
- Modify: `src/app/(tabs)/index.tsx:239`
- Modify: `src/app/campaigns/[id]/receipt.tsx:105`
- Modify: `src/app/(tabs)/more.tsx`

**Interfaces:**
- Consumes: Task 3 store state.
- Produces: routes `/campaigns` and `/(tabs)/savings`.

- [ ] **Step 1: Move the Support screen**

```bash
git mv "circlepay-app/src/app/(tabs)/support.tsx" circlepay-app/src/app/campaigns/index.tsx
```

The screen is now pushed rather than a tab root, so make two edits inside it:

1. Add `<ScreenHeader title="CircleSupport" />` as the first child of `<Screen>` (import it from `@/ui`) so the user can get back.
2. **Strip the coach-mark wiring.** It currently holds the tour's `support` stop — `useCoachMark('support', focused)`, the `ctaRef`, the `useIsFocused()` call and the `<CoachMark …>` element at the bottom. The tour is four *tab* stops; this screen is no longer a tab, and a new user who never opens it would leave that stop permanently unretired. Remove those, plus the now-unused `useRef`/`useIsFocused`/`useCoachMark`/`CoachMark` imports. The stop moves to the Savings tab in Step 4.

Keep everything else as-is.

- [ ] **Step 2: Update the two references**

`src/app/(tabs)/index.tsx:239` — `router.push('/(tabs)/support')` becomes `router.push('/campaigns')`.
`src/app/campaigns/[id]/receipt.tsx:105` — `router.replace('/(tabs)/support')` becomes `router.replace('/campaigns')`.

Confirm none remain:

```bash
grep -rn "(tabs)/support" circlepay-app/src || echo "clean"
```

Expected: `clean`.

- [ ] **Step 3: Give CircleSupport a home in the More hub**

In `src/app/(tabs)/more.tsx`, add a new section above "AI & Security":

```tsx
      <SectionHeader title="Community" />
      <Card padded={false} style={styles.group}>
        <ListRow title="CircleSupport" subtitle="Fundraise for life events with your community" chevron
          left={<IconBubble name="heart-outline" color={colors.danger} bg={colors.dangerBg} />}
          onPress={() => router.push('/campaigns')} />
      </Card>
```

And in the existing "Money" card, add a row after "Wallet":

```tsx
        <ListRow title="Automated Savings" subtitle="Auto-debit plans for savings & contributions" chevron
          left={<IconBubble name="sync-circle-outline" color={colors.success} bg={colors.successBg} />}
          onPress={() => router.push('/auto-savings')} />
```

- [ ] **Step 4: Retarget the tour stop, then write the Savings tab**

First, in `src/lib/coachTour.ts`, rename the third stop so the tour stays "four tab stops":

```ts
export const COACH_MARK_KEYS = ['home', 'circles', 'savings', 'more'] as const;
```

and in `COACH_MARK_COPY`, replace the `support` entry with:

```ts
  savings: { title: 'Automated Savings', body: 'Let CirclePay save for you on schedule' },
```

`coachMarksSeen` is persisted, but Task 3 bumped the store to `circlepay-store-v2`, so every install starts the tour fresh and no stale `support` key lingers.

Then create `src/app/(tabs)/savings.tsx`. It mounts the renamed mark against the Automated Savings row, and does not render a back button — it is a tab root.

```tsx
import { useIsFocused, useRouter } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCoachMark } from '@/lib/coachTour';
import { formatNaira } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing, shadow } from '@/theme/tokens';
import { AmountText, Button, Card, CoachMark, EmptyState, ListRow, Screen, SectionHeader } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

export default function Savings() {
  const router = useRouter();
  const wallet = useStore((s) => s.wallet);
  const circles = useStore((s) => s.circles);
  const plans = useStore((s) => s.savingsPlans);

  const totalSaved = wallet.savings + wallet.onHold;
  const automatedToDate = plans.reduce((sum, p) => sum + p.totalSaved, 0);
  const active = plans.filter((p) => p.status === 'active').length;

  // Tour stop 3 — the "Automated Savings" row. ListRow is a Pressable and does
  // not forward a ref, so the wrapper below exists purely to be measured.
  const autoRef = useRef<View | null>(null);
  const focused = useIsFocused();
  const autoMark = useCoachMark('savings', focused);

  return (
    <Screen>
      <Text style={styles.heading}>Savings</Text>

      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Saved</Text>
        <AmountText amount={totalSaved} decimals={2} size={30} />
        <View style={styles.split}>
          <View style={styles.splitCol}>
            <Text style={styles.splitLabel}>In circles</Text>
            <Text style={styles.splitValue}>{formatNaira(wallet.onHold, 2)}</Text>
          </View>
          <View style={styles.splitCol}>
            <Text style={styles.splitLabel}>In savings</Text>
            <Text style={styles.splitValue}>{formatNaira(wallet.savings, 2)}</Text>
          </View>
        </View>
      </Card>

      {/* Lifetime figure, deliberately outside the card above: a circle-linked
          plan's contributions already sit inside "In circles". */}
      <Text style={styles.footnote}>
        Automated to date · {formatNaira(automatedToDate, 2)}
      </Text>

      <SectionHeader title="Where your money is" />
      {plans.length === 0 ? (
        <>
          {/* EmptyState takes only icon/title/body — the action is a sibling Button. */}
          <EmptyState
            icon="sync-circle-outline"
            title="No automated plans yet"
            body="Set one up and CirclePay will save for you on schedule."
          />
          <Button title="Create a plan" onPress={() => router.push('/auto-savings/create')} />
        </>
      ) : (
        <Card padded={false} style={styles.group}>
          <View ref={autoRef} collapsable={false}>
            <ListRow title="Automated Savings" subtitle={`${active} active plan${active === 1 ? '' : 's'}`} chevron
              left={<IconBubble name="sync-circle-outline" color={colors.success} bg={colors.successBg} />}
              onPress={() => router.push('/auto-savings')} />
          </View>
          <ListRow title="Circle Savings" subtitle={`${circles.length} circle${circles.length === 1 ? '' : 's'}`} chevron
            left={<IconBubble name="people-outline" />}
            onPress={() => router.push('/(tabs)/circles')} />
          <ListRow title="Savings History" subtitle="Every automated deduction" chevron
            left={<IconBubble name="time-outline" color={colors.info} bg={colors.infoBg} />}
            onPress={() => router.push('/auto-savings/history')} />
        </Card>
      )}

      <CoachMark
        visible={autoMark.visible}
        targetRef={autoRef}
        title={autoMark.title}
        body={autoMark.body}
        onDismiss={autoMark.onDismiss}
        onSkipAll={autoMark.onSkipAll}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.ink, marginBottom: spacing.lg },
  totalCard: { alignItems: 'flex-start', ...shadow.card },
  totalLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.sub, marginBottom: 4 },
  split: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg },
  splitCol: { flex: 1 },
  splitLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginBottom: 3 },
  splitValue: { fontFamily: fonts.mono, fontSize: 14, color: colors.ink },
  footnote: {
    fontFamily: fonts.medium, fontSize: 12, color: colors.faint,
    marginTop: spacing.sm, marginLeft: spacing.xs,
  },
  group: { paddingHorizontal: spacing.lg, paddingVertical: 4, borderRadius: radius.lg },
});
```

`EmptyState` accepts only `icon`, `title` and `body` — that is why the call-to-action is a sibling `Button` rather than a prop. Do not add props to `EmptyState`.

- [ ] **Step 5: Rewire the tab bar**

In `src/app/(tabs)/_layout.tsx`, replace the `TAB_ICONS` map and the `<Tabs.Screen>` list. Tab order is Home · Savings · [Scan] · Circles · More — the bar splits `routes` into the first two and the rest, so declaration order is what positions them.

```ts
const TAB_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  savings: { icon: 'wallet', label: 'Savings' },
  circles: { icon: 'people', label: 'Circles' },
  more: { icon: 'grid', label: 'More' },
};
```

```tsx
      <Tabs.Screen name="index" />
      <Tabs.Screen name="savings" />
      <Tabs.Screen name="circles" />
      <Tabs.Screen name="more" />
```

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit`, then `npx eslint <the files this task touched>`
Expected: tsc passes; your own files lint clean. Do NOT run `npm run lint` and expect green — the repo has a pre-existing 47-problem baseline (see Global Constraints). Confirm the total has not grown.

- [ ] **Step 7: Walk it**

Run `npm run web`. Confirm: the tab bar reads Home · Savings · Scan & Pay · Circles · More; the Savings tab renders totals and three rows; Home's Support tile opens `/campaigns` and that screen has a working back button; More shows the new Community section.

- [ ] **Step 8: Commit**

```bash
git add -A circlepay-app/src/app
git commit -m "Replace Support tab with Savings; move CircleSupport to /campaigns"
```

---

## Task 7: Home Quick Access grid, promo banner and editor

**Files:**
- Create: `src/lib/shortcuts.ts`
- Create: `src/app/quick-access.tsx`
- Modify: `src/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `quickAccess` / `setQuickAccess` from Task 3.
- Produces: `SHORTCUTS: Shortcut[]`, `MAX_QUICK_ACCESS = 7`, `shortcutById(id: string): Shortcut | undefined`.

- [ ] **Step 1: Write the registry**

Create `src/lib/shortcuts.ts`:

```ts
import type { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

import { colors } from '@/theme/tokens';

export interface Shortcut {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  href: Href;
}

/** The eighth grid slot is always "More", so users pick seven. */
export const MAX_QUICK_ACCESS = 7;

export const SHORTCUTS: Shortcut[] = [
  { id: 'savings', label: 'Savings', icon: 'wallet', tint: colors.success, bg: colors.successBg, href: '/(tabs)/savings' },
  { id: 'auto-savings', label: 'Automated Savings', icon: 'sync-circle', tint: colors.primary, bg: colors.chip, href: '/auto-savings' },
  { id: 'circles', label: 'Circles', icon: 'people', tint: colors.primary, bg: colors.chip, href: '/(tabs)/circles' },
  { id: 'support', label: 'Support Groups', icon: 'heart', tint: colors.danger, bg: colors.dangerBg, href: '/campaigns' },
  { id: 'bills', label: 'Pay Bills', icon: 'receipt', tint: colors.warning, bg: colors.warningBg, href: '/bills' },
  { id: 'airtime', label: 'Airtime', icon: 'phone-portrait', tint: colors.info, bg: colors.infoBg, href: '/bills/airtime' },
  { id: 'pos', label: 'POS', icon: 'storefront', tint: colors.success, bg: colors.successBg, href: '/agent' },
  { id: 'partpay', label: 'PartPay', icon: 'calendar', tint: colors.info, bg: colors.infoBg, href: '/partpay' },
  { id: 'agent', label: 'Agent Banking', icon: 'business', tint: colors.warning, bg: colors.warningBg, href: '/agent' },
  { id: 'trust', label: 'Trust Score', icon: 'shield-checkmark', tint: colors.primary, bg: colors.chip, href: '/trust/score' },
  { id: 'wallet', label: 'Wallet', icon: 'card', tint: colors.sub, bg: colors.cardAlt, href: '/wallet' },
];

export function shortcutById(id: string): Shortcut | undefined {
  return SHORTCUTS.find((s) => s.id === id);
}
```

If `Href` is not exported from `expo-router` in this SDK, type `href` as `string` and cast at the `router.push` call site — do not reach into `@react-navigation/*`.

- [ ] **Step 2: Rebuild the Home grid**

In `src/app/(tabs)/index.tsx`, replace the whole `{/* Quick access */}` block (the `<View style={styles.quickRow}>` with four hardcoded `QuickTile`s) with:

```tsx
      {/* Quick access */}
      <SectionHeader
        title="Quick Access"
        actionLabel="Edit"
        onAction={() => router.push('/quick-access')}
      />
      <View style={styles.quickGrid}>
        {quickAccess.map((id) => {
          const s = shortcutById(id);
          if (!s) return null;
          return (
            <QuickTile
              key={s.id}
              icon={s.icon}
              tint={s.tint}
              bg={s.bg}
              label={s.label}
              onPress={() => router.push(s.href)}
            />
          );
        })}
        <QuickTile
          icon="ellipsis-horizontal"
          tint={colors.sub}
          bg={colors.cardAlt}
          label="More"
          onPress={() => router.push('/(tabs)/more')}
        />
      </View>
```

Add the selector alongside the others in the component:

```tsx
  const quickAccess = useStore((s) => s.quickAccess);
```

and the import:

```tsx
import { shortcutById } from '@/lib/shortcuts';
```

Replace the `quickRow` style with a wrapping grid, and let each tile take a quarter row:

```ts
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
```

and in `quickTile`, replace `flex: 1` with `width: '23.5%'` (four per row, three 8px gaps).

- [ ] **Step 3: Swap the promo banner**

Replace the promo `<LinearGradient>` block's text, button handler and icon:

```tsx
          <Text style={styles.promoTitle}>Build Your Future Automatically</Text>
          <Text style={styles.promoBody}>
            Let CirclePay AI help you save, pay and grow your money without stress.
          </Text>
          <Pressable
            onPress={() => router.push('/auto-savings')}
            style={({ pressed }) => [styles.promoBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.promoBtnLabel}>Set Up Now</Text>
          </Pressable>
```

with the icon changed to `<Ionicons name="sync-circle" size={24} color={colors.onPrimary} />`, and a new style:

```ts
  promoBody: {
    fontFamily: fonts.medium, fontSize: 12.5, color: colors.onPrimaryDim,
    lineHeight: 18, marginTop: 4,
  },
```

- [ ] **Step 4: Write the editor**

Create `src/app/quick-access.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MAX_QUICK_ACCESS, SHORTCUTS } from '@/lib/shortcuts';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import { Button, Card, ListRow, Screen, ScreenHeader } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

/** Home grid editor — pick 7; the 8th tile is always "More". */
export default function QuickAccessEditor() {
  const router = useRouter();
  const quickAccess = useStore((s) => s.quickAccess);
  const setQuickAccess = useStore((s) => s.setQuickAccess);
  const [chosen, setChosen] = useState<string[]>(quickAccess);

  const toggle = (id: string) =>
    setChosen((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_QUICK_ACCESS
          ? prev
          : [...prev, id]
    );

  const full = chosen.length >= MAX_QUICK_ACCESS;

  const save = () => {
    setQuickAccess(chosen);
    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Edit Quick Access" />
      <Text style={styles.intro}>
        Choose up to {MAX_QUICK_ACCESS} shortcuts for your home screen. They appear in the
        order you pick them.
      </Text>
      <Text style={styles.count}>{chosen.length} of {MAX_QUICK_ACCESS} selected</Text>

      <Card padded={false} style={styles.group}>
        {SHORTCUTS.map((s) => {
          const on = chosen.includes(s.id);
          const locked = !on && full;
          return (
            <ListRow
              key={s.id}
              title={s.label}
              subtitle={on ? `Position ${chosen.indexOf(s.id) + 1}` : locked ? 'Remove one to add this' : undefined}
              left={<IconBubble name={s.icon} color={s.tint} bg={s.bg} />}
              right={
                <Ionicons
                  name={on ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={on ? colors.primary : locked ? colors.border : colors.faint}
                />
              }
              onPress={() => toggle(s.id)}
              style={locked ? { opacity: 0.5 } : undefined}
            />
          );
        })}
      </Card>

      <Button
        title="Save"
        onPress={save}
        disabled={chosen.length === 0}
        style={{ marginTop: spacing.xl }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.sub, lineHeight: 20 },
  count: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.primary, marginTop: spacing.sm, marginBottom: spacing.lg },
  group: { paddingHorizontal: spacing.lg, paddingVertical: 4 },
});
```

`Button`'s signature is `{ title, onPress?, variant?, disabled?, loading?, icon?, style?, small? }` with `variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'` — verified, use it as written.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit`, then `npx eslint <the files this task touched>`
Expected: tsc passes; your own files lint clean. Do NOT run `npm run lint` and expect green — the repo has a pre-existing 47-problem baseline (see Global Constraints). Confirm the total has not grown.

- [ ] **Step 6: Walk it**

Run `npm run web`. Confirm: Home shows a 4×2 grid ending in "More"; every tile navigates; Edit opens the editor; deselecting one and selecting another then saving updates Home and survives a page reload (it is persisted).

- [ ] **Step 7: Commit**

```bash
git add circlepay-app/src/lib/shortcuts.ts circlepay-app/src/app/quick-access.tsx "circlepay-app/src/app/(tabs)/index.tsx"
git commit -m "Rebuild Home quick access as an editable 8-tile grid"
```

---

## Task 8: Automated Savings hub

**Files:**
- Create: `src/app/auto-savings/_layout.tsx`
- Create: `src/app/auto-savings/index.tsx`

**Interfaces:**
- Consumes: Task 2 helpers, Task 3 state.
- Produces: route `/auto-savings`.

- [ ] **Step 1: Stack layout**

Create `src/app/auto-savings/_layout.tsx`, copying the pattern from `src/app/circles/_layout.tsx` (read it first):

```tsx
import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function AutoSavingsLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
    />
  );
}
```

- [ ] **Step 2: Write the hub**

Create `src/app/auto-savings/index.tsx`. Copy is verbatim from the spec.

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatNaira } from '@/lib/format';
import { frequencyLabel, planTypeMeta } from '@/lib/savings';
import type { SavingsPlan, SavingsPlanType } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Card, Chip, EmptyState, ListRow, Screen, ScreenHeader, SectionHeader, StatusPill } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

// `T[]`, not `Array<T>` — this repo enables @typescript-eslint/array-type.
const FILTERS: { type: SavingsPlanType; label: string }[] = [
  { type: 'daily', label: 'Daily Savings' },
  { type: 'weekly', label: 'Weekly Contributions' },
  { type: 'instalment', label: 'Instalment Payments' },
];

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'barbell-outline', label: 'Builds financial discipline' },
  { icon: 'flag-outline', label: 'Helps you achieve goals faster' },
  { icon: 'notifications-off-outline', label: 'No need to remember' },
  { icon: 'shield-checkmark-outline', label: 'Secure & trustworthy' },
];

/** Accent colours per plan type, resolved from the shared token semantics. */
function accent(type: SavingsPlanType): { tint: string; bg: string } {
  const tint = planTypeMeta[type].tint;
  if (tint === 'success') return { tint: colors.success, bg: colors.successBg };
  if (tint === 'warning') return { tint: colors.warning, bg: colors.warningBg };
  return { tint: colors.primary, bg: colors.chip };
}

/** "Automatically deduct from your linked account every day" etc. */
function planSubtitle(plan: SavingsPlan): string {
  if (plan.type === 'daily') return 'Automatically deduct from your linked account every day.';
  if (plan.type === 'weekly') return `Every ${new Date(plan.nextRunAt).toLocaleDateString(undefined, { weekday: 'long' })}`;
  return `Next payment: ${formatDate(plan.nextRunAt)}`;
}

export default function AutoSavingsHub() {
  const router = useRouter();
  const plans = useStore((s) => s.savingsPlans);
  const [filter, setFilter] = useState<SavingsPlanType | null>('daily');

  const shown = filter ? plans.filter((p) => p.type === filter) : plans;

  return (
    <Screen>
      <ScreenHeader
        title="Automated Savings"
        right={
          <Pressable
            onPress={() => router.push('/auto-savings/history')}
            hitSlop={8}
            style={({ pressed }) => [styles.historyBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="time-outline" size={15} color={colors.primary} />
            <Text style={styles.historyLabel}>History</Text>
          </Pressable>
        }
      />

      <Card style={styles.hero}>
        <Text style={styles.heroTitle}>Save Automatically.{'\n'}Achieve Your Goals.</Text>
        <Text style={styles.heroBody}>
          Set it once, and let CirclePay handle the rest. Stay consistent and stress-free.
        </Text>
      </Card>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Chip
            key={f.type}
            label={f.label}
            selected={filter === f.type}
            onPress={() => setFilter((cur) => (cur === f.type ? null : f.type))}
            style={styles.filterChip}
          />
        ))}
      </View>

      <SectionHeader
        title="Active Plans"
        actionLabel={filter ? 'View all' : undefined}
        onAction={filter ? () => setFilter(null) : undefined}
      />

      {shown.length === 0 ? (
        <EmptyState
          icon="sync-circle-outline"
          title="No plans here yet"
          body="Create one below and CirclePay will handle the deductions for you."
        />
      ) : (
        shown.map((plan) => {
          const a = accent(plan.type);
          return (
            <Card key={plan.id} padded={false} style={styles.planCard}>
              <ListRow
                title={plan.name}
                subtitle={`${formatNaira(plan.amount, 2)} ${frequencyLabel(plan.frequency).toLowerCase()}\n${planSubtitle(plan)}`}
                left={<IconBubble name={`${planTypeMeta[plan.type].icon}-outline` as keyof typeof Ionicons.glyphMap} color={a.tint} bg={a.bg} />}
                right={<StatusPill small label={plan.status === 'active' ? 'Active' : plan.status === 'paused' ? 'Paused' : 'Done'} />}
                chevron
                onPress={() => router.push(`/auto-savings/${plan.id}`)}
                style={styles.planRow}
              />
            </Card>
          );
        })
      )}

      <SectionHeader title="Create New Plan" />
      <View style={styles.createRow}>
        {FILTERS.map((f) => {
          const a = accent(f.type);
          return (
            <Pressable
              key={f.type}
              onPress={() => router.push(`/auto-savings/create?type=${f.type}`)}
              style={({ pressed }) => [styles.createCard, { backgroundColor: a.bg }, pressed && { opacity: 0.8 }]}>
              <IconBubble
                name={`${planTypeMeta[f.type].icon}-outline` as keyof typeof Ionicons.glyphMap}
                color={a.tint}
                bg={colors.card}
              />
              <Text style={[styles.createTitle, { color: a.tint }]}>{planTypeMeta[f.type].label}</Text>
              <Text style={styles.createBlurb}>{planTypeMeta[f.type].blurb}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.benefits}>
        <Text style={styles.benefitsTitle}>Automated Savings Benefits</Text>
        <View style={styles.benefitRow}>
          {BENEFITS.map((b) => (
            <View key={b.label} style={styles.benefit}>
              <Ionicons name={b.icon} size={20} color={colors.primary} />
              <Text style={styles.benefitLabel}>{b.label}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyLabel: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.primary },
  hero: { backgroundColor: colors.chip, borderColor: colors.chip },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.ink, lineHeight: 28 },
  heroBody: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub, lineHeight: 19, marginTop: spacing.sm },
  filters: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' },
  filterChip: { flexGrow: 1, justifyContent: 'center' },
  planCard: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  planRow: { paddingVertical: spacing.md },
  createRow: { flexDirection: 'row', gap: spacing.sm },
  createCard: { flex: 1, gap: 7, padding: spacing.md, borderRadius: radius.lg },
  createTitle: { fontFamily: fonts.bold, fontSize: 12.5 },
  createBlurb: { fontFamily: fonts.medium, fontSize: 11, color: colors.sub, lineHeight: 15 },
  benefits: { marginTop: spacing.xl, backgroundColor: colors.cardAlt },
  benefitsTitle: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink, marginBottom: spacing.lg },
  benefitRow: { flexDirection: 'row', gap: spacing.sm },
  benefit: { flex: 1, alignItems: 'center', gap: 7 },
  benefitLabel: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.sub, textAlign: 'center', lineHeight: 14 },
});
```

`ListRow` renders `subtitle` with `numberOfLines={1}`, so the two-line subtitle above will clip. Either pass a single-line subtitle (`${formatNaira(...)} · ${planSubtitle(plan)}`) or build the row inline with `Card` + `View` instead of `ListRow`. Pick the single-line subtitle — it keeps the shared component untouched.

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit`, then `npx eslint <the files this task touched>`
Expected: tsc passes; your own files lint clean. Do NOT run `npm run lint` and expect green — the repo has a pre-existing 47-problem baseline (see Global Constraints). Confirm the total has not grown. Verify every Ionicons name used actually exists — a bad name renders an invisible glyph rather than erroring.

- [ ] **Step 4: Walk it**

`npm run web` → Savings tab → Automated Savings. Confirm: hero copy, three filter chips (Daily selected by default showing one plan), View all clears the filter and shows all three, three create cards, benefits strip. Tapping a plan navigates to `/auto-savings/<id>` (a 404 until Task 10 — expected).

- [ ] **Step 5: Commit**

```bash
git add circlepay-app/src/app/auto-savings
git commit -m "Add Automated Savings hub screen"
```

---

## Task 9: Create wizard

**Files:**
- Create: `src/app/auto-savings/create.tsx`

**Interfaces:**
- Consumes: `StepDots`, `BankPicker`, `BANKS` (Task 4); `createSavingsPlan`, `linkAccount` (Task 3); `firstRunAt`, `frequencyLabel`, `accountLabel`, `upcomingRuns`, `planTypeMeta` (Task 2).
- Produces: route `/auto-savings/create`, accepting an optional `?type=daily|weekly|instalment` search param.

Four steps in one file with local state, then a dark success state. Steps: (1) type + details, (2) bank, (3) schedule preview, (4) review → create.

- [ ] **Step 1: Scaffold state and step 1**

Create `src/app/auto-savings/create.tsx`. Build it incrementally — this step is the shell plus step 1.

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatNaira } from '@/lib/format';
import { accountLabel, firstRunAt, frequencyLabel, planTypeMeta, upcomingRuns } from '@/lib/savings';
import type { Frequency, SavingsPlan, SavingsPlanType } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { BANKS, BankPicker, Button, Card, Field, Screen, ScreenHeader, StepDots } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

const TYPES: SavingsPlanType[] = ['daily', 'weekly', 'instalment'];

const FREQ_FOR: Record<SavingsPlanType, Frequency> = {
  daily: 'daily',
  weekly: 'weekly',
  instalment: 'monthly',
};

/** Today as an ISO date, used as the default start. */
function todayISO(): string {
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

export default function CreateAutoSavings() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const initialType = TYPES.includes(params.type as SavingsPlanType)
    ? (params.type as SavingsPlanType)
    : 'daily';

  const circles = useStore((s) => s.circles);
  const partPayPlans = useStore((s) => s.plans);
  const linkedAccounts = useStore((s) => s.linkedAccounts);
  const linkAccount = useStore((s) => s.linkAccount);
  const createSavingsPlan = useStore((s) => s.createSavingsPlan);

  const [step, setStep] = useState(0);
  const [created, setCreated] = useState<SavingsPlan | null>(null);

  const [type, setType] = useState<SavingsPlanType>(initialType);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<Frequency>(FREQ_FOR[initialType]);
  const [startDate] = useState(todayISO());
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [circleId, setCircleId] = useState<string | undefined>(undefined);
  const [partPayId, setPartPayId] = useState<string | undefined>(undefined);
  const [accountId, setAccountId] = useState<string | undefined>(linkedAccounts[0]?.id);
  const [linking, setLinking] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const amountNum = Number(amount.replace(/[^\d.]/g, ''));
  const account = linkedAccounts.find((a) => a.id === accountId);

  /** Circles whose cadence matches the plan, for the optional link picker. */
  const linkableCircles = useMemo(
    () => (type === 'instalment' ? [] : circles.filter((c) => c.frequency === frequency)),
    [circles, frequency, type]
  );
  const linkablePlans = useMemo(
    () => (type === 'instalment' ? partPayPlans.filter((p) => p.status === 'active') : []),
    [partPayPlans, type]
  );

  const chooseType = (t: SavingsPlanType) => {
    setType(t);
    setFrequency(FREQ_FOR[t]);
    setCircleId(undefined);
    setPartPayId(undefined);
  };

  const chooseCircle = (id: string) => {
    const c = circles.find((x) => x.id === id);
    if (!c) return;
    // A circle-linked plan must contribute exactly the circle's amount.
    setCircleId((cur) => (cur === id ? undefined : id));
    setAmount(String(c.amountPerMember));
    setFrequency(c.frequency);
    if (!name.trim()) setName(`${planTypeMeta[type].label} – ${c.name}`);
  };

  const choosePlan = (id: string) => {
    const p = partPayPlans.find((x) => x.id === id);
    if (!p) return;
    setPartPayId((cur) => (cur === id ? undefined : id));
    setAmount(String(p.installmentAmount));
    setFrequency(p.frequency);
    if (!name.trim()) setName(`Instalment – ${p.title}`);
  };

  const validateStep1 = (): boolean => {
    if (!name.trim()) return setError('Give your plan a name'), false;
    if (!amountNum || amountNum <= 0) return setError('Enter an amount to deduct'), false;
    if (endDate && new Date(endDate).getTime() <= new Date(startDate).getTime()) {
      return setError('End date must be after the start date'), false;
    }
    setError(undefined);
    return true;
  };

  const next = () => {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !accountId) return setError('Choose an account to debit');
    setError(undefined);
    setStep((s) => s + 1);
  };

  const back = () => (step === 0 ? router.back() : setStep((s) => s - 1));

  const submit = () => {
    if (!accountId) return;
    const plan = createSavingsPlan({
      name: name.trim(),
      type,
      amount: amountNum,
      frequency,
      accountId,
      startDate,
      endDate,
      circleId,
      partPayId,
    });
    setCreated(plan);
  };

  // …steps render below (Step 2 of this task)
}
```

- [ ] **Step 2: Render the four steps and the success state**

Add the return block to the component, and the stylesheet. `StepDots` is 0-based; the mockup labels them 1–4.

```tsx
  if (created) {
    return (
      <Screen backgroundColor={colors.primaryDeep}>
        <View style={styles.successWrap}>
          <View style={styles.successCheck}>
            <Ionicons name="checkmark" size={34} color={colors.onPrimary} />
          </View>
          <Text style={styles.successTitle}>Plan Created Successfully!</Text>
          <Text style={styles.successBody}>
            Your {planTypeMeta[created.type].label} Plan has been set up and is now active.
          </Text>

          <Card style={styles.successCard}>
            <View style={styles.successRow}>
              <IconBubble name="sync-circle-outline" />
              <View style={{ flex: 1 }}>
                <Text style={styles.successPlan}>{created.name}</Text>
                <Text style={styles.successMeta}>
                  {formatNaira(created.amount, 2)} · {frequencyLabel(created.frequency)}
                </Text>
              </View>
            </View>
            <Text style={styles.successDetail}>Starts on: {formatDate(created.startDate)}</Text>
            <Text style={styles.successDetail}>Next deduction: 08:00 AM</Text>
          </Card>

          <Button
            title="Done"
            onPress={() => router.replace('/auto-savings')}
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Create Automated Savings Plan" />
      <View style={{ marginBottom: spacing.xl }}>
        <StepDots count={4} current={step} />
      </View>

      {step === 0 && (
        <>
          <Text style={styles.legend}>Select Plan Type</Text>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => chooseType(t)}
              accessibilityRole="radio"
              accessibilityState={{ selected: type === t }}
              style={({ pressed }) => [
                styles.typeCard,
                type === t && styles.typeCardOn,
                pressed && { opacity: 0.8 },
              ]}>
              <IconBubble name={`${planTypeMeta[t].icon}-outline` as keyof typeof Ionicons.glyphMap} />
              <View style={{ flex: 1 }}>
                <Text style={styles.typeTitle}>{planTypeMeta[t].label}</Text>
                <Text style={styles.typeBlurb}>{planTypeMeta[t].blurb}</Text>
              </View>
              <Ionicons
                name={type === t ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={type === t ? colors.primary : colors.faint}
              />
            </Pressable>
          ))}

          <Text style={styles.legend}>Plan Details</Text>
          <Field
            label="Plan Name"
            placeholder="e.g Daily Personal Savings"
            value={name}
            onChangeText={setName}
          />
          <Field
            label="Amount to Deduct"
            placeholder="1,000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            left={<Text style={styles.naira}>₦</Text>}
            editable={!circleId && !partPayId}
            hint={circleId || partPayId ? 'Set by the commitment you linked' : undefined}
          />
          <Field
            label="Deduction Frequency"
            value={frequencyLabel(frequency)}
            editable={false}
          />
          <Field label="Start Date" value={formatDate(startDate)} editable={false} hint="Deductions run at 08:00" />
          <Field
            label="End Date (Optional)"
            placeholder="No end date"
            value={endDate ? formatDate(endDate) : ''}
            editable={false}
            right={
              <Pressable onPress={() => setEndDate(undefined)} hitSlop={8}>
                <Ionicons name="calendar-outline" size={18} color={colors.faint} />
              </Pressable>
            }
          />

          {(linkableCircles.length > 0 || linkablePlans.length > 0) && (
            <>
              <Text style={styles.legend}>Fund an existing commitment (optional)</Text>
              {linkableCircles.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => chooseCircle(c.id)}
                  style={({ pressed }) => [
                    styles.linkRow,
                    circleId === c.id && styles.typeCardOn,
                    pressed && { opacity: 0.8 },
                  ]}>
                  <Text style={styles.linkName}>{c.name}</Text>
                  <Text style={styles.linkMeta}>{formatNaira(c.amountPerMember)} · {c.frequency}</Text>
                </Pressable>
              ))}
              {linkablePlans.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => choosePlan(p.id)}
                  style={({ pressed }) => [
                    styles.linkRow,
                    partPayId === p.id && styles.typeCardOn,
                    pressed && { opacity: 0.8 },
                  ]}>
                  <Text style={styles.linkName}>{p.title}</Text>
                  <Text style={styles.linkMeta}>{formatNaira(p.installmentAmount)} · {p.frequency}</Text>
                </Pressable>
              ))}
            </>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <Text style={styles.legend}>Debit From</Text>
          {linkedAccounts.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setAccountId(a.id)}
              style={({ pressed }) => [
                styles.linkRow,
                accountId === a.id && styles.typeCardOn,
                pressed && { opacity: 0.8 },
              ]}>
              <Text style={styles.linkName}>{accountLabel(a)}</Text>
              {!!a.purpose && <Text style={styles.linkMeta}>{a.purpose}</Text>}
            </Pressable>
          ))}

          <Text style={styles.legend}>Or link a new bank</Text>
          <BankPicker
            banks={BANKS}
            busy={linking}
            onSelect={(bank) => {
              if (linking) return;
              setLinking(bank);
              // Simulated Open Banking handshake, same 1.4s as circles/link-bank.
              timer.current = setTimeout(() => {
                linkAccount(bank);
                setLinking(undefined);
                const newest = useStore.getState().linkedAccounts.at(-1);
                if (newest) setAccountId(newest.id);
              }, 1400);
            }}
          />
          <View style={styles.secureRow}>
            <Ionicons name="lock-closed" size={13} color={colors.success} />
            <Text style={styles.secureText}>Your data is encrypted and secure</Text>
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.legend}>Deduction Schedule</Text>
          <Card>
            <Text style={styles.scheduleLabel}>Next Deduction</Text>
            <Text style={styles.scheduleValue}>
              {formatDate(firstRunAt(startDate, frequency))} · 08:00 AM
            </Text>
            <View style={styles.flowRow}>
              <Ionicons name="business-outline" size={16} color={colors.sub} />
              <Text style={styles.flowText}>From {account ? accountLabel(account) : '—'}</Text>
            </View>
            <View style={styles.flowRow}>
              <Ionicons name="arrow-down" size={16} color={colors.primary} />
              <Text style={styles.flowText}>
                To {circleId
                  ? circles.find((c) => c.id === circleId)?.name
                  : partPayId
                    ? partPayPlans.find((p) => p.id === partPayId)?.title
                    : 'CirclePay AI Wallet'}
              </Text>
            </View>
          </Card>

          <Text style={styles.legend}>Next deductions</Text>
          <Card padded={false} style={styles.group}>
            {upcomingRuns(
              { nextRunAt: firstRunAt(startDate, frequency), frequency, endDate },
              6
            ).map((iso) => (
              <View key={iso} style={styles.upcomingRow}>
                <Text style={styles.upcomingDate}>{formatDate(iso)}</Text>
                <Text style={styles.upcomingAmount}>{formatNaira(amountNum, 2)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.legend}>Plan Summary</Text>
          <Card padded={false} style={styles.group}>
            {[
              ['Plan Name', name],
              ['Type', planTypeMeta[type].label],
              ['Frequency', frequencyLabel(frequency)],
              ['Amount', formatNaira(amountNum, 2)],
              ['Start Date', formatDate(startDate)],
              ['End Date', endDate ? formatDate(endDate) : 'No end date'],
              ['Linked Account', account ? accountLabel(account) : '—'],
            ].map(([label, value]) => (
              <View key={label} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue}>{value}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <Button title="Back" variant="secondary" onPress={back} style={{ flex: 1 }} />
        <Button
          title={step === 3 ? 'Create Plan' : 'Continue'}
          onPress={step === 3 ? submit : next}
          style={{ flex: 1.4 }}
        />
      </View>
    </Screen>
  );
```

`variant="secondary"` is a real variant (it renders `colors.chip` on `colors.primary`) — verified, use it as written.

- [ ] **Step 3: Add the stylesheet**

```ts
const styles = StyleSheet.create({
  legend: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, marginBottom: spacing.md, marginTop: spacing.lg },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  typeCardOn: { borderColor: colors.primary, backgroundColor: colors.chip },
  typeTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  typeBlurb: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  naira: { fontFamily: fonts.mono, fontSize: 14, color: colors.sub },
  linkRow: {
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  linkName: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  linkMeta: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  secureText: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.sub },
  scheduleLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub },
  scheduleValue: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, marginTop: 3 },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  flowText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.ink },
  group: { paddingHorizontal: spacing.lg },
  upcomingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  upcomingDate: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.ink },
  upcomingAmount: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.ink },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.lg,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub },
  summaryValue: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink, flexShrink: 1, textAlign: 'right' },
  error: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.danger, marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  successWrap: { alignItems: 'center', paddingTop: spacing.xxl },
  successCheck: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.onPrimary, marginTop: spacing.xl, textAlign: 'center' },
  successBody: {
    fontFamily: fonts.medium, fontSize: 13.5, color: colors.onPrimaryDim,
    textAlign: 'center', lineHeight: 20, marginTop: spacing.sm,
  },
  successCard: { width: '100%', marginTop: spacing.xxl },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  successPlan: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  successMeta: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  successDetail: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub, marginTop: spacing.sm },
});
```

- [ ] **Step 4: Clean up the timer**

Add inside the component, so a mid-link unmount does not set state on a dead component:

```tsx
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
```

and add `useEffect` to the React import.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit`, then `npx eslint <the files this task touched>`
Expected: tsc passes; your own files lint clean. Do NOT run `npm run lint` and expect green — the repo has a pre-existing 47-problem baseline (see Global Constraints). Confirm the total has not grown.

- [ ] **Step 6: Walk every path**

`npm run web` → Automated Savings → Daily Savings create card. Confirm:
1. Continue with an empty name shows "Give your plan a name" and does not advance.
2. Name + amount 500 advances to step 2; the step rail fills.
3. Selecting an existing account advances; picking an unlinked bank shows a spinner, links, and auto-selects it.
4. Step 3 lists six future dates, all after today, at 08:00.
5. Step 4 summary matches what was entered; Create Plan shows the dark success screen.
6. Done returns to the hub with the new plan listed under its type filter.
7. Reload the page — the plan is still there (persisted).

- [ ] **Step 7: Commit**

```bash
git add circlepay-app/src/app/auto-savings/create.tsx
git commit -m "Add 4-step automated savings creation wizard"
```

---

## Task 10: Plan Summary, full schedule and history

**Files:**
- Create: `src/app/auto-savings/[id]/_layout.tsx`
- Create: `src/app/auto-savings/[id]/index.tsx`
- Create: `src/app/auto-savings/[id]/schedule.tsx`
- Create: `src/app/auto-savings/history.tsx`

**Interfaces:**
- Consumes: Task 2 helpers, Task 3 actions.
- Produces: routes `/auto-savings/[id]`, `/auto-savings/[id]/schedule`, `/auto-savings/history`.

- [ ] **Step 1: Stack layout**

Create `src/app/auto-savings/[id]/_layout.tsx` with the same body as `src/app/auto-savings/_layout.tsx` from Task 8, renaming the component to `AutoSavingsPlanLayout`.

- [ ] **Step 2: Plan Summary**

Create `src/app/auto-savings/[id]/index.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { confirm } from '@/lib/dialogs';
import { formatDate, formatNaira } from '@/lib/format';
import { accountLabel, frequencyLabel, planTypeMeta } from '@/lib/savings';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import { Button, Card, EmptyState, Screen, ScreenHeader, StatusPill } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

export default function PlanSummary() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = useStore((s) => s.savingsPlans.find((p) => p.id === id));
  const account = useStore((s) => s.linkedAccounts.find((a) => a.id === plan?.accountId));
  const pausePlan = useStore((s) => s.pauseSavingsPlan);
  const resumePlan = useStore((s) => s.resumeSavingsPlan);
  const cancelPlan = useStore((s) => s.cancelSavingsPlan);

  if (!plan) {
    return (
      <Screen>
        <ScreenHeader title="Plan Summary" />
        <EmptyState icon="alert-circle-outline" title="Plan not found" body="It may have been cancelled." />
      </Screen>
    );
  }

  const paused = plan.status === 'paused';

  return (
    <Screen>
      <ScreenHeader title="Plan Summary" />

      <Card>
        <View style={styles.head}>
          <IconBubble name={`${planTypeMeta[plan.type].icon}-outline` as keyof typeof Ionicons.glyphMap} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{plan.name}</Text>
            <Text style={styles.meta}>
              {formatNaira(plan.amount, 2)} · {frequencyLabel(plan.frequency)}
            </Text>
          </View>
          <StatusPill
            small
            label={plan.status === 'active' ? 'Active' : paused ? 'Paused' : 'Completed'}
          />
        </View>
      </Card>

      <Card padded={false} style={styles.group}>
        {[
          ['Status', plan.status === 'active' ? 'Active' : paused ? 'Paused' : 'Completed'],
          ['Frequency', frequencyLabel(plan.frequency)],
          ['Amount', formatNaira(plan.amount, 2)],
          ['Start Date', formatDate(plan.startDate)],
          ['End Date', plan.endDate ? formatDate(plan.endDate) : 'No end date'],
          ['Linked Account', account ? accountLabel(account) : '—'],
          ['Saved so far', formatNaira(plan.totalSaved, 2)],
        ].map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.nextCard}>
        <Text style={styles.rowLabel}>Next Deduction</Text>
        <Text style={styles.nextValue}>{formatDate(plan.nextRunAt)} · 08:00 AM</Text>
        <Pressable onPress={() => router.push(`/auto-savings/${plan.id}/schedule`)} hitSlop={8}>
          <Text style={styles.link}>View Full Schedule</Text>
        </Pressable>
      </Card>

      <View style={styles.actions}>
        <Button
          title={paused ? 'Resume Plan' : 'Pause Plan'}
          variant="secondary"
          onPress={() => (paused ? resumePlan(plan.id) : pausePlan(plan.id))}
          style={{ flex: 1 }}
        />
        <Button
          title="Edit Plan"
          variant="secondary"
          onPress={() => router.push(`/auto-savings/create?type=${plan.type}`)}
          style={{ flex: 1 }}
        />
      </View>

      <Pressable
        onPress={() =>
          confirm(
            'Cancel this plan?',
            `${plan.name} will stop deducting. Money already saved stays in your wallet.`,
            () => {
              cancelPlan(plan.id);
              router.replace('/auto-savings');
            },
            'Cancel plan',
            true
          )
        }
        hitSlop={8}
        style={styles.cancelWrap}>
        <Text style={styles.cancel}>Cancel plan</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  group: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.lg,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub },
  rowValue: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink, flexShrink: 1, textAlign: 'right' },
  nextCard: { marginTop: spacing.lg },
  nextValue: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, marginTop: 3 },
  link: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.primary, marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  cancelWrap: { alignSelf: 'center', marginTop: spacing.xl },
  cancel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.danger },
});
```

The Edit Plan button routes to the wizard for now — a full edit form is a separate change and the spec does not draw one. Leave it at that; do not scaffold a half-built editor.

- [ ] **Step 3: Full schedule**

Create `src/app/auto-savings/[id]/schedule.tsx`:

```tsx
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { formatDate, formatDateTime } from '@/lib/format';
import { upcomingRuns } from '@/lib/savings';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import { AmountText, Card, EmptyState, Screen, ScreenHeader, SectionHeader, StatusPill } from '@/ui';

export default function PlanSchedule() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = useStore((s) => s.savingsPlans.find((p) => p.id === id));

  if (!plan) {
    return (
      <Screen>
        <ScreenHeader title="Full Schedule" />
        <EmptyState icon="alert-circle-outline" title="Plan not found" body="It may have been cancelled." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Full Schedule" subtitle={plan.name} />

      <SectionHeader title="Upcoming" />
      <Card padded={false} style={styles.group}>
        {upcomingRuns(plan, 12).map((iso) => (
          <View key={iso} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.date}>{formatDate(iso)}</Text>
              <Text style={styles.time}>08:00 AM</Text>
            </View>
            <AmountText amount={plan.amount} size={13} />
          </View>
        ))}
      </Card>

      <SectionHeader title="Past deductions" />
      {plan.runs.length === 0 ? (
        <EmptyState icon="time-outline" title="Nothing yet" body="Deductions will appear here once they run." />
      ) : (
        <Card padded={false} style={styles.group}>
          {plan.runs.map((run) => (
            <View key={run.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.date}>{formatDateTime(run.date)}</Text>
                {!!run.reason && <Text style={styles.reason}>{run.reason}</Text>}
              </View>
              <View style={styles.right}>
                <AmountText amount={run.amount} size={13} />
                {/* Status is never carried by colour alone. */}
                <StatusPill small label={run.status === 'success' ? 'Success' : 'Failed'} />
              </View>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { paddingHorizontal: spacing.lg },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  date: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  time: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  reason: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.danger, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
});
```

`StatusPill` derives its tone from `label.toLowerCase()` via `toneFor` — `failed` maps to danger, `success`/`active`/`completed` to success, and anything unknown (`paused`) to neutral. Verified: pass only `label` and `small`, never an explicit `tone`.

- [ ] **Step 4: History**

Create `src/app/auto-savings/history.tsx`:

```tsx
import { StyleSheet, Text, View } from 'react-native';

import { formatDateTime } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import { AmountText, Card, EmptyState, Screen, ScreenHeader, StatusPill } from '@/ui';

export default function SavingsHistory() {
  const plans = useStore((s) => s.savingsPlans);

  const rows = plans
    .flatMap((p) => p.runs.map((r) => ({ ...r, planName: p.name })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Screen>
      <ScreenHeader title="Savings History" />
      {rows.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No deductions yet"
          body="Once your plans start running, every deduction shows up here."
        />
      ) : (
        <Card padded={false} style={styles.group}>
          {rows.map((r) => (
            <View key={r.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.planName}</Text>
                <Text style={styles.date}>{formatDateTime(r.date)}</Text>
              </View>
              <View style={styles.right}>
                <AmountText amount={r.amount} size={13} />
                <StatusPill small label={r.status === 'success' ? 'Success' : 'Failed'} />
              </View>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { paddingHorizontal: spacing.lg },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  name: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  date: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
});
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit`, then `npx eslint <the files this task touched>`
Expected: tsc passes; your own files lint clean. Do NOT run `npm run lint` and expect green — the repo has a pre-existing 47-problem baseline (see Global Constraints). Confirm the total has not grown.

- [ ] **Step 6: Walk it**

`npm run web` → hub → tap a plan. Confirm: summary rows are right; Pause flips the pill to Paused and the button to Resume; View Full Schedule lists 12 future dates plus the seeded past runs; the History link in the hub header lists all runs newest-first; Cancel plan asks for confirmation (in a web dialog, not a silent no-op) and returns to the hub.

- [ ] **Step 7: Commit**

```bash
git add circlepay-app/src/app/auto-savings
git commit -m "Add plan summary, full schedule and savings history screens"
```

---

## Task 11: Link Bank Account redesign

**Files:**
- Modify: `src/app/circles/link-bank.tsx`

**Interfaces:**
- Consumes: `BankPicker`, `BANKS` from Task 4.
- Produces: nothing new — same route, same `linkAccount` behaviour.

- [ ] **Step 1: Rebuild the screen**

Replace the body of `src/app/circles/link-bank.tsx`. Keep the existing 1.4s simulated handshake and the `timer` cleanup exactly as they are; only the layout changes.

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { BANKS, BankPicker, Button, Card, Screen, ScreenHeader } from '@/ui';

/** 09 · Link Bank Account — simulated Open Banking OAuth. */
export default function LinkBank() {
  const router = useRouter();
  const linkAccount = useStore((s) => s.linkAccount);
  const linkedAccounts = useStore((s) => s.linkedAccounts);

  const [linking, setLinking] = useState<string | undefined>(undefined);
  const [linkedBank, setLinkedBank] = useState<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const startLink = (bank: string) => {
    if (linking) return;
    setLinkedBank(undefined);
    setLinking(bank);
    timer.current = setTimeout(() => {
      linkAccount(bank);
      setLinking(undefined);
      setLinkedBank(bank);
    }, 1400);
  };

  const newest = [...linkedAccounts].reverse().find((a) => a.bank === linkedBank);

  return (
    <Screen>
      <ScreenHeader title="Link Bank Account" />

      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Secure. Fast. Reliable.</Text>
          <Text style={styles.heroBody}>
            Link your bank account to allow CirclePay AI to automate your savings and payments.
          </Text>
        </View>
        <View style={styles.shield}>
          <Ionicons name="shield-checkmark" size={30} color={colors.onPrimary} />
        </View>
      </View>

      {linkedBank && (
        <Card style={styles.successCard}>
          <View style={styles.successCheck}>
            <Ionicons name="checkmark" size={20} color={colors.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>Account linked</Text>
            <Text style={styles.successText}>
              {linkedBank} •••• {newest?.last4 ?? '••••'} is ready for automated deductions.
            </Text>
          </View>
        </Card>
      )}

      <Text style={styles.legend}>Select Bank</Text>
      <BankPicker banks={BANKS} selected={linkedBank} busy={linking} onSelect={startLink} />

      {linkedBank && <Button title="Done" onPress={() => router.back()} style={{ marginTop: spacing.xl }} />}

      <View style={styles.footer}>
        <Ionicons name="lock-closed" size={13} color={colors.success} />
        <Text style={styles.footerText}>Your data is encrypted and secure</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  heroBody: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub, lineHeight: 19, marginTop: 6 },
  shield: {
    width: 64, height: 64, borderRadius: radius.lg,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  successCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.successBg, borderColor: colors.successBg, marginBottom: spacing.lg,
  },
  successCheck: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.success },
  successText: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink, marginTop: 2, lineHeight: 17 },
  legend: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, marginBottom: spacing.md },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: spacing.xxl,
  },
  footerText: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.sub, textAlign: 'center' },
});
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit`, then `npx eslint <the files this task touched>`
Expected: tsc passes; your own files lint clean. Do NOT run `npm run lint` and expect green — the repo has a pre-existing 47-problem baseline (see Global Constraints). Confirm the total has not grown.

- [ ] **Step 3: Walk it**

`npm run web` → More → Linked Bank Accounts. Confirm the 3-column grid renders 8 tiles, tapping one spins for 1.4s then shows the success card and the Done button, and the account appears in the wizard's "Debit From" list afterwards.

- [ ] **Step 4: Commit**

```bash
git add circlepay-app/src/app/circles/link-bank.tsx
git commit -m "Redesign Link Bank Account as a bank grid"
```

---

## Task 12: End-to-end verification and design-spec update

**Files:**
- Modify: `designs/design-spec.md`

**Interfaces:**
- Consumes: everything.
- Produces: documentation only.

- [ ] **Step 1: Force a due deduction and confirm the engine**

The engine only fires on dates that have passed, so push one into the past by hand.

```bash
npm run web
```

On web, AsyncStorage is backed by `localStorage`. Paste this into the browser console — it rewinds the seeded daily plan by two days and reloads:

```js
const KEY = 'circlepay-store-v2';
const blob = JSON.parse(localStorage.getItem(KEY));
const plan = blob.state.savingsPlans.find((p) => p.id === 'sp-daily');
const d = new Date();
d.setDate(d.getDate() - 2);
d.setHours(8, 0, 0, 0);
plan.nextRunAt = d.toISOString();
localStorage.setItem(KEY, JSON.stringify(blob));
location.reload();
```

If `blob.state` is undefined, log `blob` and adjust for whatever wrapper zustand's persist middleware wrote — do not change the app to suit the check.

Expected after reload: exactly **two** new "Daily Savings Plan" rows in Recent Transactions, wallet available down by ₦2,000, savings up by ₦2,000, `totalSaved` up by ₦2,000, two new `runs` entries, and `nextRunAt` back in the future. Not three; not one.

- [ ] **Step 2: Confirm the failure path**

Transfer the wallet down below ₦1,000 via Wallet → Transfer, then repeat Step 1's date edit.

Expected: a **failed** transaction row appears, an "Auto-debit failed" notification is in `/trust/notifications`, `totalSaved` does not move, and `nextRunAt` still advances. Reload again and confirm it does not re-fire the same deduction.

- [ ] **Step 3: Confirm the catch-up cap**

Set the daily plan's `nextRunAt` to 30 days ago and reload.

Expected: exactly 5 deductions, plus a "Deductions skipped" notification naming the remainder, and `nextRunAt` in the future.

- [ ] **Step 4: Confirm no `Alert.alert` crept in**

```bash
grep -rn "Alert.alert" circlepay-app/src/app/auto-savings circlepay-app/src/app/quick-access.tsx "circlepay-app/src/app/(tabs)/savings.tsx" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 5: Full typecheck and lint**

Run: `npx tsc --noEmit`
Expected: passes.

Then the regression check on the lint baseline:

```bash
npx eslint src 2>&1 | tail -3
```

Expected: **still 47 problems (36 errors, 11 warnings)** — the pre-existing baseline, unchanged. A higher number means this feature introduced lint problems; find and fix those in the feature's own files. Do not fix the baseline itself here.

- [ ] **Step 6: Document the screens**

In `designs/design-spec.md`, update §2's bottom tab bar list to **Home · Savings · Scan & Pay · Circles · More**, and add new numbered screen sections following the existing format (`### NN · Title`, the same subsections used by neighbouring entries) for: Automated Savings hub, Create Automated Savings Plan, Deduction Schedule, Plan Summary, Plan Created Successfully, Savings tab, Quick Access editor. Update `### 09 · Link Bank Account` to describe the grid layout, and `### 18 · Campaigns` to note it is now reached at `/campaigns` rather than a tab.

- [ ] **Step 7: Commit**

```bash
git add designs/design-spec.md
git commit -m "Document Automated Savings screens in the design spec"
```

---

## Deferred, deliberately

- **Backend parity.** `CLAUDE.md` requires app and backend domain types to move together; this plan is app-only. The exact backend delta is written up in §9 of the spec and should be its own plan.
- **Full plan editing.** Task 10's Edit Plan routes to the wizard. A real edit form is not drawn in the mockups.
- **Goal targets, background execution, real bank connectivity** — see the spec's §11.
