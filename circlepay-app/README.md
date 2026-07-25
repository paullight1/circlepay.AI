# CirclePay AI

**Save Together. Pay Smart. Grow Better.**

Community-finance app: rotating savings circles (Ajo/Esusu), installment payments
(PartPay), community fundraising (CircleSupport), and an agent/kiosk network —
built with Expo (React Native, SDK 57) + TypeScript from the CirclePay AI PRD and
design mockups (`../designs/design-spec.md`).

## Run it

```bash
npm install
npm run web        # http://localhost:8081 — fastest way to try it
npm run ios        # iOS simulator (requires Xcode)
npm run android    # Android emulator
```

The demo is fully client-side: a persisted zustand store simulates the backend
(wallet ledger, auto-debits, payouts, donations, scratch cards, withdrawal codes).
Onboard with any phone number, any 6-digit OTP, and any 4-digit PIN.
**More → Reset Demo Data** restores the seed state.

## Try these flows

- **Onboarding** — welcome → OTP → KYC tiers → PIN + Face ID.
- **Circles** — open *Family Esusu*: live payout countdown, member paid/late
  status, backup pool, AI default alert; "Simulate payout day" fires the payout
  celebration. Create your own circle from the Circles tab.
- **PartPay** — start a plan (category → payment model → schedule review), then
  make early payments from the plan dashboard.
- **CircleSupport** — donate to *Support Mama Chinedu's Burial* (wallet balance
  actually moves) and get a shareable receipt; create your own campaign.
- **Agent network** — redeem a scratch card (any 14–16 digit serial; value derives
  from the last digit), or request a kiosk withdrawal to get a 5-minute one-time
  code with fee breakdown.
- **Trust** — More → Trust Score / AI Risk & Alerts.

## Architecture

```
src/
  theme/tokens.ts    design tokens (colors, fonts, radii) from the design spec
  lib/               formatting (naira, dates, countdowns), cross-platform dialogs
  store/             zustand store: types, seed data, all domain actions
  ui/                shared kit: Screen, Card, Button, Gauge, CountdownTimer, …
  app/               expo-router routes (see AGENTS.md for the route map)
```

Conventions and Expo SDK 57 sharp edges are documented in `AGENTS.md`.
