# Automated Savings — design spec

**Date:** 2026-07-26
**Scope:** `circlepay-app` only. Backend delta documented in §9 as a follow-up task.
**Source of truth:** the four-panel mockup supplied 2026-07-26 (Home, Automated Savings hub,
Create Plan, Link Bank Account, Deduction Schedule, Plan Summary, Plan Created).

## 1. What we are building

Users link a bank account and CirclePay debits it on a schedule — daily savings, weekly
circle contributions, or instalment payments. The point of the feature is financial
discipline without remembering to act.

Three plan types, one record shape:

| Type | Cadence | Money lands in |
|---|---|---|
| `daily` | every day | wallet savings, or a daily circle |
| `weekly` | every week | wallet savings, or a weekly circle |
| `instalment` | the linked PartPay plan's cadence | the PartPay plan |

A plan optionally points at an existing `Circle` (`circleId`) or `PartPayPlan` (`partPayId`).
When it does, a run delegates to the existing store action so the circle or plan genuinely
advances. When it does not, the run is a plain wallet→savings transfer.

## 2. Domain model

### 2.1 New types (`src/store/types.ts`)

```ts
export type SavingsPlanType   = 'daily' | 'weekly' | 'instalment';
export type SavingsPlanStatus = 'active' | 'paused' | 'completed';

/** One executed deduction attempt. Newest first inside `SavingsPlan.runs`. */
export interface SavingsRun {
  id: string;
  date: string;                 // ISO — when it actually ran
  amount: number;
  status: 'success' | 'failed';
  reason?: string;              // "Insufficient balance"
}

export interface SavingsPlan {
  id: string;
  name: string;                 // "Daily Savings Plan"
  type: SavingsPlanType;
  amount: number;
  frequency: Frequency;         // daily | weekly | monthly
  accountId: string;            // LinkedAccount.id — the debit source
  startDate: string;            // ISO
  endDate?: string;             // ISO, optional
  nextRunAt: string;            // ISO — next deduction, 08:00 local
  status: SavingsPlanStatus;
  totalSaved: number;           // sum of successful runs
  runs: SavingsRun[];
  circleId?: string;            // weekly/daily plans that fund a Circle
  partPayId?: string;           // instalment plans that fund a PartPayPlan
  createdAt: string;
}
```

### 2.2 Edits to existing types

- `Transaction.category` gains `'savings'`.
- `NotifType` gains `'savings'`.
- `LinkedAccount` gains `first4?: string` — the mockup renders `GTBank · 1234 **** **** 5678`.

These three changes are the reason §9 exists: `CLAUDE.md` requires app and backend domain
types to stay 1:1.

### 2.3 Invariant

Every successful run appends exactly one `Transaction`. Delegated runs rely on the
transaction that `contributeToCircle` / `payInstallment` already appends — they must not
append a second one.

## 3. Store slice (`src/store/useStore.ts`)

### 3.1 State

```ts
savingsPlans: SavingsPlan[];   // seeded, see §8
quickAccess: string[];         // Home grid shortcut ids, 7 entries
```

### 3.2 Actions

| Action | Signature | Notes |
|---|---|---|
| `createSavingsPlan` | `(input: CreateSavingsPlanInput) => SavingsPlan` | computes `nextRunAt` from `startDate` at 08:00; pushes a `savings` notification |
| `updateSavingsPlan` | `(id: string, patch: Partial<SavingsPlan>) => void` | Edit Plan; recomputes `nextRunAt` if amount/frequency/startDate changed |
| `pauseSavingsPlan` | `(id: string) => void` | `status: 'paused'` |
| `resumeSavingsPlan` | `(id: string) => void` | `status: 'active'`, `nextRunAt` fast-forwarded to the next future slot |
| `cancelSavingsPlan` | `(id: string) => void` | removes the plan |
| `runDueSavings` | `() => number` | the catch-up engine; returns runs executed |
| `setQuickAccess` | `(ids: string[]) => void` | Home grid editor |

`CreateSavingsPlanInput` = `{ name, type, amount, frequency, accountId, startDate, endDate?, circleId?, partPayId? }`.

### 3.3 One edit to an existing action

`contributeToCircle(circleId, source: 'manual' | 'auto' = 'manual')`. The only effect of
`source` is the transaction title: `"Automated Contribution"` vs `"Manual Contribution"`.
The default keeps all existing callers unchanged.

### 3.4 The catch-up engine

`runDueSavings()` is called once from the root layout on mount and on foreground.

```
MAX_CATCHUP = 5

for each plan where status === 'active':
    if endDate && nextRunAt > endDate → status = 'completed'; continue

    executed = 0
    while nextRunAt <= now && executed < MAX_CATCHUP:
        execute(plan)                    // see table below
        appendRun(plan, result)
        nextRunAt = advance(nextRunAt, frequency)
        executed++

    skipped = 0
    while nextRunAt <= now:              // still behind → fast-forward
        nextRunAt = advance(nextRunAt, frequency)
        skipped++
    if skipped > 0:
        pushNotification('savings', `${skipped} deduction(s) skipped while you were away`)
```

Execution by plan shape:

| Shape | Effect |
|---|---|
| standalone (`daily`/`weekly`, no link) | `wallet.available -= amount`; `wallet.savings += amount`; append `Transaction { title: plan.name, subtitle: 'Automated Savings', direction: 'out', status: 'success', category: 'savings' }` |
| `circleId` set | `contributeToCircle(circleId, 'auto')` |
| `partPayId` set | `payInstallment(partPayId, <first schedule entry with status 'upcoming'>)`; if none remain → `status: 'completed'` |
| insufficient balance | append `Transaction { …, status: 'failed', category: 'savings' }`, `SavingsRun { status: 'failed', reason: 'Insufficient balance' }`, push an `alert` notification; **still advance `nextRunAt`** |

Rules that matter:

- **Advance on failure.** Otherwise a broke wallet retries on every app open and floods the
  transaction list.
- **Cap then fast-forward.** Coming back after a month must not fire 30 instant debits, and
  must not leave the plan permanently behind. Skipped runs are reported, never silently dropped.
- **Paused plans do not accumulate.** `resumeSavingsPlan` fast-forwards `nextRunAt`; a plan
  paused for three weeks does not fire three debits on resume.
- `advance()` adds 1 day / 1 week / 1 month per `frequency`, preserving the 08:00 time.

## 4. Navigation

Bottom tabs become **Home · Savings · [Scan & Pay] · Circles · More**.

`(tabs)/support.tsx` moves to `campaigns/index.tsx`. Two references update:
`(tabs)/index.tsx:239` and `campaigns/[id]/receipt.tsx:105`. CircleSupport stays reachable
from the Quick Access "Support Groups" tile and a new More → Community row.

**Route-name collision:** `(tabs)/savings.tsx` and `src/app/savings/index.tsx` would both
resolve to `/savings`. The automated-savings stack therefore lives at `auto-savings/`.

```
(tabs)/savings.tsx                Savings overview (tab root)
auto-savings/_layout.tsx          Stack
auto-savings/index.tsx            Automated Savings hub
auto-savings/create.tsx           4-step wizard + success state
auto-savings/history.tsx          all runs across all plans
auto-savings/[id]/_layout.tsx     Stack
auto-savings/[id]/index.tsx       Plan Summary
auto-savings/[id]/schedule.tsx    full schedule — upcoming + past runs
quick-access.tsx                  Home grid editor
campaigns/index.tsx               moved from (tabs)/support.tsx
circles/link-bank.tsx             redesigned in place
```

## 5. Screens

### 5.1 Home (`(tabs)/index.tsx`)

Balance card, greeting and My Groups are unchanged. Two changes:

**Quick Access grid** — `SectionHeader title="Quick Access" actionLabel="Edit"` over a 4×2
grid: the 7 shortcuts from `quickAccess` plus a fixed 8th "More" tile routing to `/(tabs)/more`.

Shortcut registry (11 available, 7 chosen):

| id | Label | Icon | Route |
|---|---|---|---|
| `savings` | Savings | `wallet` | `/(tabs)/savings` |
| `auto-savings` | Automated Savings | `sync-circle` | `/auto-savings` |
| `circles` | Circles | `people` | `/(tabs)/circles` |
| `support` | Support Groups | `heart` | `/campaigns` |
| `bills` | Pay Bills | `receipt` | `/bills` |
| `airtime` | Airtime | `phone-portrait` | `/bills/airtime` |
| `pos` | POS | `storefront` | `/agent` |
| `partpay` | PartPay | `calendar` | `/partpay` |
| `agent` | Agent Banking | `business` | `/agent` |
| `trust` | Trust Score | `shield-checkmark` | `/trust/score` |
| `wallet` | Wallet | `card` | `/wallet` |

Default `quickAccess` = the mockup's order: `savings`, `auto-savings`, `circles`, `support`,
`bills`, `airtime`, `pos`.

**Promo banner** — "Build Your Future Automatically / Let CirclePay AI help you save, pay and
grow your money without stress." with a **Set Up Now** button routing to `/auto-savings`.
Replaces the current PartPay promo (PartPay keeps its More row and its optional grid tile).

### 5.2 Quick Access editor (`quick-access.tsx`)

All 11 shortcuts as toggleable rows, selection count `n/7`, disabled beyond 7, Save button.
Writes `setQuickAccess`. Chosen order = selection order.

### 5.3 Savings tab (`(tabs)/savings.tsx`)

- Total Saved card: `wallet.savings + wallet.onHold`, split into "In circles" (`onHold`) and
  "In savings" (`wallet.savings`). Below it, a separate stat line "Automated to date"
  (sum of `totalSaved` across plans) — a lifetime figure, **not** a slice of the total above,
  since a circle-linked plan's contributions already sit inside `onHold`.
- Rows: Automated Savings (`n active` → `/auto-savings`), Circle Savings (`n circles` →
  `/(tabs)/circles`), Savings History (→ `/auto-savings/history`).
- Empty state when there are no plans: `EmptyState` with a "Create a plan" action.

### 5.4 Automated Savings hub (`auto-savings/index.tsx`)

`ScreenHeader title="Automated Savings"` with a right-slot **History** link.

1. Hero card — "Save Automatically. Achieve Your Goals." / "Set it once, and let CirclePay
   handle the rest. Stay consistent and stress-free."
2. Filter chips — Daily Savings · Weekly Contributions · Instalment Payments. Filters the
   list below; defaults to Daily Savings per the mockup.
3. **Active Plans** + "View all" (clears the active filter chip and lists every plan,
   paused and completed included) — rows show icon bubble, name, `₦X daily/weekly`, a subtitle
   ("Automatically deduct from your linked account every day" / "Every Monday" /
   "Next payment: <date>"), an Active/Paused `StatusPill`, chevron → `/auto-savings/[id]`.
4. **Create New Plan** — three cards (Daily Savings / Weekly Contribution / Instalment
   Payment) each pushing `/auto-savings/create?type=<type>`.
5. **Automated Savings Benefits** — 4 icon tiles: Builds financial discipline · Helps you
   achieve goals faster · No need to remember · Secure & trustworthy.

### 5.5 Create wizard (`auto-savings/create.tsx`)

One file, local `step` state, `StepDots` at the top. Back at step 1 leaves the screen.

**Step 1 — Select Plan Type + Plan Details.** Three radio cards; pre-selected from the
`type` search param. Then Plan Name, Amount to Deduct (₦ prefix), Deduction Frequency
(Every Day / Every Week / Every Month), Start Date, End Date (Optional).
An optional "Fund an existing commitment" picker appears when there is something to link:
for `daily`/`weekly`, the Circles whose `frequency` matches the chosen cadence (so the daily
Friends Ajo Group is offered to a daily plan, the weekly Family Esusu to a weekly one); for
`instalment`, the active PartPay plans. Choosing one locks `amount` and `frequency` to that
record's values and derives the default plan name (`Weekly Contribution – <circle name>`).

**Step 2 — Bank account.** `BankPicker` grid. Already-linked accounts appear selectable at
the top; picking an unlinked bank runs the simulated link (1.4s) then selects it.

**Step 3 — Deduction Schedule.** Plan header card, Next Deduction (date + 08:00 AM), From
(`<bank> · <first4> **** **** <last4>`) → To (CirclePay AI Wallet, or the circle / PartPay
plan when linked). "View Full Schedule" expands the next 6 occurrences inline.

**Step 4 — Review → success.** Summary rows, then `createSavingsPlan`. On success the screen
swaps to the dark confirmation: `colors.primaryDeep` background, green check, "Plan Created
Successfully!", the plan card with "Starts on" and "Next deduction: 08:00 AM", **Done** →
`router.replace('/auto-savings')`.

Validation: name non-empty; amount > 0; end date after start date; an account selected before
leaving step 2. Errors surface via `Field.error`, not `Alert`.

### 5.6 Plan Summary (`auto-savings/[id]/index.tsx`)

Plan header card, then rows: Status, Frequency, Amount, Start Date, Linked Account. Next
Deduction card with "View Full Schedule" → `auto-savings/[id]/schedule`. Two outline buttons:
**Pause Plan** / **Resume Plan** and **Edit Plan** (reuses step 1's form in edit mode).
A "Cancel plan" text action at the bottom, guarded by `confirm` from `@/lib/dialogs`.

### 5.7 Full schedule (`auto-savings/[id]/schedule.tsx`)

Upcoming: next 12 occurrences computed from `nextRunAt`. Past: `plan.runs`, success rows in
green, failed rows in red with the reason. Never colour alone — failed rows carry a
`StatusPill` too.

### 5.8 History (`auto-savings/history.tsx`)

Every `SavingsRun` across all plans, newest first, grouped by date, with the plan name as
subtitle. `EmptyState` when nothing has run yet.

### 5.9 Link Bank Account (`circles/link-bank.tsx`, redesigned)

Replaces the current list layout with the mockup: "Secure. Fast. Reliable." hero + shield
icon, "Select Bank" 3-column `BankPicker` grid (GTBank, Access Bank, First Bank, Zenith Bank,
UBA, Fidelity Bank, Sterling Bank, Other Banks), and the "Your data is encrypted and secure"
footer. Linking behaviour (1.4s simulated handshake → `linkAccount`) is unchanged.

## 6. New UI components

Only two are genuinely new; everything else composes from the existing kit.

- **`src/ui/StepDots.tsx`** — horizontal numbered progress (`1—2—3—4`), current step filled,
  completed steps checked, connecting rails. `Stepper` is vertical and `AuthProgress` is
  segmented bars, so neither fits. Props: `{ count: number; current: number }`.
  `accessibilityRole="progressbar"` with a "Step n of m" label.
- **`src/ui/BankPicker.tsx`** — 3-column grid of bank tiles built on `BrandTile`, with a
  selected ring and an optional busy spinner per tile. Props:
  `{ banks: string[]; selected?: string; busy?: string; onSelect: (bank: string) => void }`.

Both are exported from `src/ui/index.ts`.

Screen-local components (not in the kit): `PlanTypeCard`, `BenefitTile`, `QuickTile`
(existing, extended), following the pattern already used in `(tabs)/index.tsx`.

## 7. Design tokens

No new tokens. Plan-type accents reuse existing semantics: daily → `success`/`successBg`,
weekly → `primary`/`chip`, instalment → `warning`/`warningBg`. The success screen uses
`colors.primaryDeep`. Amounts render through `AmountText`; dates through `formatDate` /
`formatDateTime`.

## 8. Seed data

Three plans, matching the mockup's Active Plans list but using names that exist in this app's
seed data:

| Plan | Amount | Link | Next run |
|---|---|---|---|
| Daily Savings Plan | ₦1,000 daily | none (wallet savings) | tomorrow 08:00 |
| Weekly Contribution – Family Esusu | ₦10,000 weekly | `c-family-esusu` | next Monday 08:00 |
| Instalment – School Fees Term 2 | ₦30,000 monthly | `p-school` | +14 days 08:00 |

**Deviation from the mockup, deliberate:** the mockup shows "Weekly Contribution – Family
Ajo (₦5,000)" and "Phone Purchase (Instalment) (₦12,500)". Neither record exists in this
app's seed data, and a circle-linked plan's amount must equal `circle.amountPerMember` or the
contribution would be wrong. The names and amounts above are derived from the real seeded
`Circle` and `PartPayPlan`, so the demo stays internally consistent.

`seedLinkedAccounts` gains `first4` (`'1234'` for GTBank, `'2210'` for Opay) so the From/To
rows render as drawn.

Each seeded plan carries 2–3 past `SavingsRun` entries so History and the transaction list
are populated on first launch.

**Wallet balances are unchanged** (₦98,450.20 available / ₦27,230.30 on hold). The mockup's
₦198,450.20 / ₦47,230.30 would contradict `designs/design-spec.md` and every other screen's
amounts.

## 9. Backend parity (follow-up, not this task)

`CLAUDE.md` requires app and backend domain types to move together. This task changes the app
side only; the matching backend work is:

- `src/db/schema.ts`: `savings_plans` table (money as `numeric(14,2)`) and `savings_runs`
  table, plus `first4` on the linked-accounts table; `npm run db:generate` + `db:migrate`.
- New `savings` module — `controller` / `service` / `dto` / `mapper`, DTOs matching
  `SavingsPlan` and `SavingsRun` field-for-field.
- Runs execute inside `db.transaction` via `ledger.move(tx, …)`; balance reads use
  `SELECT … FOR UPDATE`. A `POST /api/savings/plans/:id/run` endpoint plus a catch-up sweep
  on `GET /api/savings/plans` mirror the app's engine.
- `class-validator` DTOs for both writes, since the global `ValidationPipe` runs with
  `whitelist` + `forbidNonWhitelisted`.

## 10. Verification

There is no test suite in this workspace. Verification is:

1. `npx tsc --noEmit` in `circlepay-app` — must pass.
2. `npm run lint`.
3. `npm run web` and walk: Home grid + Edit → Savings tab → hub → create a daily plan through
   all 4 steps → success → Plan Summary → Pause/Resume → schedule → History.
4. Catch-up: create a plan, edit `nextRunAt` into the past via the persisted store, reload,
   confirm exactly one debit, one transaction, one notification, and an advanced `nextRunAt`.
5. Insufficient-balance path: drain the wallet, force a due run, confirm a `failed`
   transaction and alert rather than a silent no-op.
6. Confirm `Alert.alert` is not used anywhere in the new screens — `notify` / `confirm` from
   `@/lib/dialogs` only, or the flows break on web.

## 11. Out of scope

- Real bank connectivity — linking stays simulated, as everywhere else in this app.
- Background execution while the app is closed. Runs happen on open, by design.
- Goal-amount targets ("save ₦500,000 by December"). The mockup shows no goal UI.
- Editing a plan's linked Circle or PartPay plan after creation. Cancel and recreate instead.
