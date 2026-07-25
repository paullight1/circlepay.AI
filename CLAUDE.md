# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this workspace is

**CirclePay AI** — a community-finance product for Nigeria/Africa that digitises rotating
savings (Ajo, Esusu, Adashi, Susu, Chama). Four product pillars recur across every
sub-project and should stay named consistently:

- **Circles** — rotating savings groups with escrow, backup pool, scheduled payouts
- **PartPay** — buy-now-pay-later style installment plans
- **CircleSupport** — community fundraising campaigns for life events
- **Agent network** — kiosks, scratch cards and withdrawal codes for offline/unbanked users
- (**Trust**) — an AI trust-score + default-risk layer that wraps all of the above

This directory is **not a git repository** — it is a workspace of three independent
deliverables plus the specs they are all built from. Only `circlepay-app/` has its own
git repo.

| Path | What it is |
|---|---|
| `circlepay-app/` | Expo (React Native, SDK 57) + TypeScript mobile app — the product |
| `circlepay-backend/` | NestJS + Drizzle/PostgreSQL API — mirrors the app's domain 1:1 |
| `site/` | Static marketing/landing site (hand-written HTML/CSS/vanilla JS, no build step) |
| `prd.md` | Full product requirements — the functional source of truth |
| `PRODUCT.md` | Brand, audience, design principles, anti-references (drives `site/`) |
| `designs/design-spec.md` | Visual source of truth for the app, extracted from the HTML mockups |
| `CirclePay AI Screens.dc.html`, `support.js`, `image-slot.js` | Original design-tool mockup exports; reference only, not part of any build |

## Commands

### App (`circlepay-app/`)

```bash
npm install
npm run web          # http://localhost:8081 — fastest way to try it
npm run ios          # requires Xcode
npm run android
npm run lint         # expo lint
npx tsc --noEmit     # MUST pass — there is no `typecheck` script here
```

### Backend (`circlepay-backend/`)

```bash
cp .env.example .env
npm install
docker compose up -d     # Postgres 16 on host port 5433 (NOT 5432)
npm run db:generate      # SQL migrations from schema.ts -> ./drizzle
npm run db:migrate       # apply them   (or: npm run db:push, no migration files)
npm run db:seed          # demo data; `npm run db:reset` wipes first
npm run start:dev        # http://localhost:4000/api
npm run typecheck        # tsc --noEmit
npm run lint             # eslint --fix
npm run db:studio        # Drizzle Studio DB browser
```

Log in as the seeded demo user with phone `+234 803 555 0147`; `OTP_DEV_MODE=true`
returns the OTP code in the API response. Any other phone creates a fresh empty account.

### Site (`site/`)

No build, no dependencies. Serve statically, e.g. `python3 -m http.server 4173 --directory site`.

### Tests

**There is no test suite anywhere in this workspace.** Verification is `tsc --noEmit`
plus exercising the flows by hand. Do not claim tests pass; do not invent a test command.

## Architecture

### The app is currently self-contained; the backend is not yet wired in

`circlepay-app` runs entirely off a persisted zustand store (`src/store/`) that simulates
the whole backend — ledger, auto-debits, payouts, donations, scratch cards, withdrawal
codes. `circlepay-backend` was written to replace it: its response DTOs deliberately match
`circlepay-app/src/store/types.ts` field-for-field, so switching over means replacing store
actions with `fetch` + a JWT in AsyncStorage, not remodelling the domain. **When you change
a domain type on either side, change it on both** — that 1:1 correspondence is the whole
integration plan.

### Money movement invariant (both sides)

Every money movement is atomic and appends a user-visible `Transaction`.

- App: mutate only through existing `useStore.ts` actions; a new action that moves money
  must append a `Transaction` like the others do.
- Backend: `LedgerService` (`src/wallet/ledger.service.ts`) is the **only** place wallet
  balances change. Feature services open a `db.transaction` and call `ledger.move(tx, …)`
  so domain writes and the balance change commit together. Balance reads inside a
  transaction use `SELECT … FOR UPDATE`.

Money is `numeric(14,2)` in Postgres, converted to plain JS numbers at the service boundary
via `src/common/money.ts`.

### Backend shape

One NestJS module per domain (`auth`, `users`, `wallet`, `circles`, `partpay`, `campaigns`,
`agents`, `trust`, `notifications`), each with `controller` / `service` / `dto` / `mapper`.
Mappers exist to produce the app-shaped DTOs — keep serialization there, not in services.
`src/db/schema.ts` is the single source of truth for the DB. All routes are prefixed `/api`
and guarded by JWT except those marked `@Public()` (`/api/health`, `/api/auth/*`). A global
`ValidationPipe` runs with `whitelist` + `forbidNonWhitelisted`, so every write needs a
`class-validator` DTO or the request is rejected.

Auth is phone-first OTP (simulated), minting a 30-day JWT; PINs are bcrypt-hashed.

### App conventions

`circlepay-app/AGENTS.md` (aliased by `circlepay-app/CLAUDE.md`) is authoritative and must
be read before touching app code. The load-bearing points:

- **Expo SDK 57 vendors react-navigation inside expo-router.** Never import from
  `@react-navigation/*` — it is not installed. Use `expo-router` and `expo-router/js-tabs`.
- Routes are file-based under `src/app/`; typed routes are on, so new files register
  themselves. `@/*` aliases `src/*`.
- Never hardcode colors or font strings — use `src/theme/tokens.ts`. Never hand-roll a
  component that `src/ui` already provides. Icons are Ionicons only.
- Naira/date formatting lives in `src/lib/format.ts`; use `AmountText` for amounts.
- `Alert.alert` is a **silent no-op on react-native-web** — use `notify`/`confirm` from
  `src/lib/dialogs.ts` instead, or the flow will appear broken on web.

### Site conventions

Progressive enhancement: content must be fully visible and usable without JS (`app.js` only
adds sticky header, mobile menu, reveals, counters). Pages are standalone HTML files sharing
one `styles.css`; header/footer markup is duplicated per page, so nav changes must be applied
across all of them. `PRODUCT.md` governs tone and design — in particular its **anti-references**
(no generic purple-gradient SaaS hero, no navy-and-gold bank cliché, no crypto hype, no
editorial-serif affectation) and its accessibility floor: WCAG 2.1 AA contrast, visible focus,
full `prefers-reduced-motion` support, never color alone for status.

## Design fidelity

The app is built to `designs/design-spec.md` — match its copy, Naira amounts, colors and
layout closely rather than improvising. Simulated flows (OTP, payments) still validate input
and update state so the demo feels real end to end.
