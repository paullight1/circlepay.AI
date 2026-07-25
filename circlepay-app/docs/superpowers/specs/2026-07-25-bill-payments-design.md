# Bill Payments — Design Spec

**Date:** 2026-07-25
**Scope:** `circlepay-app` only. Backend mirror is an explicit follow-up (see *Deferred*).

## Goal

Add a bill-payment system to the CirclePay AI app covering nine categories —
airtime, data, electricity, cable TV, betting, internet, education pins, hotel
bookings and transport. Flows are simulated but functional: they validate input,
move money through the store, append a `Transaction`, and produce a receipt, the
same way OTP and payments already work elsewhere in the app.

## Decisions

| Question | Decision |
|---|---|
| Categories | All nine listed above |
| Depth | Working simulated flows, not static screens |
| Placement | New `bills/` route group; no new bottom tab |
| Cross-pillar tie-in | Pay a bill at an agent kiosk. **No** PartPay split, **no** recurring/scheduled bills |

## Architecture

A **data-driven biller catalogue** plus **one generic pay screen** covering the
seven form-shaped categories, and **two bespoke booking flows** for hotels and
transport, whose browse-then-book shape differs fundamentally from "enter a
reference, pick an amount".

Rejected alternatives:

- *Nine bespoke screens* — seven near-identical files that would drift.
- *One wizard route with step state* — a single deep state machine that hotels
  and transport do not fit, and that Home tiles cannot deep-link into.

### Catalogue — `src/lib/billers.ts`

Pure data and helpers, no React. Each category declares its id, label, Ionicon,
colour pair, fee, the customer-reference field spec (label, placeholder,
keyboard, validation regex, minimum length), its billers, and its plans or quick
amounts.

| Category | Billers | Input → output | Fee |
|---|---|---|---|
| Airtime | MTN, Glo, Airtel, 9mobile | phone + amount chips | ₦0 |
| Data | MTN, Glo, Airtel, 9mobile | phone + bundle plan | ₦0 |
| Electricity | Ikeja Electric, EKEDC, AEDC, PHED, KEDCO, IBEDC | meter no. → name lookup → amount → **token** | ₦100 |
| Cable TV | DStv, GOtv, StarTimes | smartcard/IUC → name lookup → package | ₦100 |
| Betting | Bet9ja, SportyBet, 1xBet, BetKing, MSport | user ID → username lookup → amount | ₦50 |
| Internet | Spectranet, Smile, Swift, Starlink | account no. → name lookup → plan | ₦100 |
| Education | WAEC, NECO, JAMB, NABTEB | pin type + quantity → **pins** | ₦150 |
| Hotels | 6 hotels across 4 cities | browse → room, nights, guests | ₦0 |
| Transport | Air Peace, Ibom Air, GIG, ABC Transport | flight/bus, from→to, date → seat class | ₦500 |

Customer-reference lookups are simulated but **deterministic**: a hash over the
reference digits selects a name from a fixed list, the same technique
`avatarColor` and `scratchCardValue` already use, so a given meter number always
resolves to the same customer across app restarts.

Electricity tokens and exam pins are likewise derived from the payment reference,
so a receipt re-opened from history shows the same token it showed on issue.

### Domain — `src/store/types.ts`

```ts
export type BillCategoryId =
  | 'airtime' | 'data' | 'electricity' | 'cable-tv' | 'betting'
  | 'internet' | 'education' | 'hotels' | 'transport';

export type BillMethod = 'wallet' | 'agent';

export interface BillPayment {
  id: string;
  reference: string;          // "CPB-4821906"
  categoryId: BillCategoryId;
  categoryLabel: string;      // "Cable TV"
  billerId: string;
  billerName: string;         // "DStv"
  customerRef: string;        // meter / smartcard / phone / booking ref
  customerName?: string;      // resolved by the simulated lookup
  planLabel?: string;         // "Compact Plus · 1 Month"
  detail?: string;            // "2 nights · Deluxe Room · 2 guests"
  amount: number;
  fee: number;
  method: BillMethod;
  status: 'success' | 'pending' | 'failed';
  date: string;               // ISO
  token?: string;             // electricity token
  pins?: string[];            // exam pins
}
```

`Transaction['category']` gains `'bill'`.

### Store — `src/store/useStore.ts`

- `bills: BillPayment[]`
- `payBill(input): { ok, payment?, error? }` — validates the amount against
  `wallet.available`, debits `available` by `amount + fee`, appends a
  `Transaction` (`category: 'bill'`, `direction: 'out'`), prepends the
  `BillPayment`, and pushes a notification when a token or pins are issued.
- `billAgentRequest: BillAgentRequest | null` plus
  `requestAgentBillPayment` / `completeAgentBillPayment` /
  `cancelAgentBillPayment`, mirroring the existing kiosk-withdrawal trio: a
  six-digit code with a five-minute expiry, settled by an explicit
  "Simulate Agent Confirmation" action.

`seed.ts` gains `seedBills` — four past payments so history is not empty on first
run — and `resetApp` restores them.

**Money-movement rule.** The agent code authorises the agent's terminal to charge
the user's CirclePay wallet and pay the biller; the wallet is debited on
confirmation. Cash-in is already covered by the existing Cash Deposit flow, so
the two compose (deposit cash → pay bill) and the invariant "every money movement
appends a `Transaction`" holds without a `Transaction` that moves no money.

### Routes — `src/app/bills/`

| Route | Purpose |
|---|---|
| `_layout` | `Stack`, `headerShown: false` — matches the other groups |
| `index` | Hub: balance strip, nine-category grid, recent bills, agent banner |
| `[category]` | The generic flow for the seven form-shaped categories |
| `hotels/index` | Hotel browse with city filter |
| `hotels/[id]` | Hotel detail: room type, nights, guests, total |
| `transport` | Flight/bus toggle, route, date, results, seat class |
| `receipt` | Shared receipt by payment id; also reachable from history |
| `agent-code` | Dark code card, countdown, fee breakdown, simulate confirmation |
| `history` | Past bills with category filter chips |

Generic flow shape: biller tiles → reference field with validation and a
simulated lookup that resolves a customer name → plan picker or amount chips →
summary card (amount, fee, total) → pay from wallet or generate an agent code →
receipt.

Draft state is threaded between screens as query params via
`useLocalSearchParams`, the pattern `partpay/review.tsx` already uses.

### Entry points

- **Home** — the quick-tile row's "Savings" tile is replaced by "Bills". Savings
  and Circles both routed to `/(tabs)/circles`, so the tile was redundant.
- **More → Money** — a "Bills & Airtime" row.
- **Agent Banking → Agent Services** — "Pay Bills" and "Airtime & Data" tiles,
  which is what `designs/design-spec.md` §21 specifies for that grid.

## Visual conventions

The app contains no images; every surface is built from Ionicons, gradients and
initials tiles. Hotels and transport follow suit — gradient header tiles with an
icon and initials rather than photography. All colour, spacing, radius and font
values come from `src/theme/tokens.ts`; amounts render through `AmountText`;
dialogs use `notify`/`confirm` from `src/lib/dialogs.ts`, never `Alert.alert`.

## Verification

`npx tsc --noEmit` and `npm run lint` must pass. There is no test suite in this
workspace; the flows are exercised by hand in `npm run web`.

## Deferred

`circlepay-backend` has no bills module and no `'bill'` transaction category, so
the app and backend domain types diverge on this feature until a matching backend
module is written. This is a known, accepted gap for now, not an oversight.
