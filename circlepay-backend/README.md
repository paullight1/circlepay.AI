# CirclePay AI — Backend

A production-shaped **NestJS + Drizzle (PostgreSQL)** backend for the CirclePay AI
community-finance app. It replaces the app's client-side zustand demo store with a
real API whose responses match the app's domain model 1:1 (`circlepay-app/src/store/types.ts`),
so the Expo app can be pointed at it with minimal changes.

## Features

Mirrors every module in the app and PRD:

| Domain | Endpoints |
|---|---|
| **Auth** (phone OTP + JWT) | `POST /auth/request-otp`, `POST /auth/verify-otp` |
| **Me / profile / KYC / PIN** | `GET/PATCH /me`, `POST /me/kyc`, `POST /me/pin`, `POST /me/verify-pin`, `POST /me/onboarded` |
| **Wallet + ledger** | `GET /wallet`, `GET /wallet/transactions`, `POST /wallet/add-money`, `POST /wallet/withdraw`, `POST /wallet/transfer` |
| **Circles** (rotating savings) | `GET /circles`, `POST /circles`, `GET /circles/:id`, `POST /circles/:id/contribute` |
| **PartPay** (installments) | `GET /partpay`, `POST /partpay`, `GET /partpay/:id`, `POST /partpay/:id/installments/:installmentId/pay` |
| **CircleSupport** (campaigns) | `GET /campaigns`, `POST /campaigns`, `GET /campaigns/:id`, `POST /campaigns/:id/donate` |
| **Agent / kiosk** | `GET /agents`, `GET/POST /accounts`, `POST /agents/scratch-card`, `GET/POST /agents/withdrawal`, `POST /agents/withdrawal/complete`, `POST /agents/withdrawal/cancel` |
| **Trust** | `GET /trust`, `GET /trust/risk` |
| **Notifications** | `GET /notifications`, `POST /notifications/read-all` |
| **Health** | `GET /health` (public) |

All routes are prefixed with **`/api`** (e.g. `GET /api/wallet`). Every route except
`/api/health` and `/api/auth/*` requires a `Bearer <jwt>` header.

## Architecture

- **NestJS** modular structure — one module per domain, thin controllers, service-owned logic.
- **Drizzle ORM** over `postgres.js`. Schema in `src/db/schema.ts` is the single source of truth; migrations are generated from it.
- **Ledger discipline** — `LedgerService` (`src/wallet/ledger.service.ts`) is the *only* place wallet balances change. Every money movement runs inside a DB transaction and, when user-visible, appends a `transactions` row — exactly the invariant the app store enforced. Feature services open a `db.transaction` and call `ledger.move(tx, …)` so their domain writes and the balance change commit atomically. Balance reads use `SELECT … FOR UPDATE` to avoid races.
- **Auth** — phone-first OTP (simulated: the code is logged and, in dev, returned by the API). A verified OTP mints a 30-day JWT. PINs are bcrypt-hashed.
- **Validation** — global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted` + `transform`) with `class-validator` DTOs on every write.
- **Money** — stored as `numeric(14,2)` (exact decimal, not float) and converted to plain JS numbers at the service boundary via `src/common/money.ts`. *For a real deployment, prefer integer minor units (kobo).*

```
src/
  main.ts app.module.ts app.controller.ts
  common/        money, ids, JwtAuthGuard, @CurrentUser, @Public
  db/            schema.ts, drizzle.client.ts, db.module.ts, migrate.ts, seed.ts
  auth/  users/  wallet/(+ledger)  circles/  partpay/  campaigns/  agents/  trust/  notifications/
```

## Getting started

Prerequisites: Node 20+, Docker (for Postgres).

```bash
cd circlepay-backend
cp .env.example .env
npm install

# 1. start Postgres
docker compose up -d

# 2. generate + apply the schema
npm run db:generate     # writes SQL migrations to ./drizzle
npm run db:migrate      # applies them

# 3. seed the demo data (user "Godfrey Okoro")
npm run db:seed

# 4. run the API
npm run start:dev       # http://localhost:4000/api
```

> Quick alternative to steps 2: `npm run db:push` pushes the schema straight to the
> DB without migration files (handy in early development).

## Try it

```bash
# Health
curl localhost:4000/api/health

# Request an OTP for the seeded user (dev mode returns the code)
curl -sX POST localhost:4000/api/auth/request-otp \
  -H 'content-type: application/json' -d '{"phone":"+234 803 555 0147"}'

# Verify → returns { token, user, isNew }
curl -sX POST localhost:4000/api/auth/verify-otp \
  -H 'content-type: application/json' \
  -d '{"phone":"+234 803 555 0147","code":"<code-from-above>"}'

# Use the token
TOKEN=... ; curl localhost:4000/api/wallet -H "authorization: Bearer $TOKEN"
```

New phone numbers create fresh, empty accounts (zero-balance wallet). The seeded
phone `+234 803 555 0147` logs you into Godfrey's fully-populated demo account.

## Wiring the Expo app to this backend

The app currently reads/writes a persisted zustand store. To go live, replace the
store actions with `fetch` calls to these endpoints (same field names/shapes), store
the JWT in `AsyncStorage`, and send it as `Authorization: Bearer`. The response DTOs
were built to match `circlepay-app/src/store/types.ts`, so mapping is mechanical.

## Scripts

| Script | Purpose |
|---|---|
| `npm run start:dev` | Watch-mode dev server |
| `npm run build` / `start:prod` | Compile to `dist/` and run |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate SQL migrations from the schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (no migration files) |
| `npm run db:seed` | Wipe + reseed demo data |
| `npm run db:studio` | Drizzle Studio (DB browser) |

## Notes / next steps for production

- Swap `numeric` money for integer minor units and a full double-entry ledger table.
- Replace simulated OTP/payments with an SMS provider (Termii/Twilio) and a payment
  gateway (Paystack/Flutterwave) for real collections, transfers and payouts.
- Add the scheduler/queue (BullMQ) for auto-debits, payouts, reminders and grace-period
  retry logic (PRD §3.4, §8.1).
- Move the AI trust/risk scoring into its own service (PRD §8.1) — the current score
  and per-member risk are seeded/static.
- Add refresh tokens, rate limiting on OTP, and audit logging.
