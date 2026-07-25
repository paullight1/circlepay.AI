<div align="center">

# 🟣 CirclePay AI

### **Save Together. Pay Smart. Grow Better.**

**The operating system for community finance.**
Digitising the rotating-savings culture of **Ajo · Esusu · Adashi · Susu · Chama** —
with escrow, a backup pool and an AI trust layer protecting every payout.

<br/>

![Expo](https://img.shields.io/badge/Expo-SDK%2057-4B27D4?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.86-7C4DFF?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-231060?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10-E23D6B?style=for-the-badge&logo=nestjs&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-1BA87A?style=for-the-badge&logo=drizzle&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-2E7CF6?style=for-the-badge&logo=postgresql&logoColor=white)

![Status](https://img.shields.io/badge/status-demo%20stage-E0930F?style=flat-square)
![Region](https://img.shields.io/badge/built%20for-🇳🇬%20Nigeria%20→%20Africa-1BA87A?style=flat-square)
![Currency](https://img.shields.io/badge/currency-₦%20NGN-4B27D4?style=flat-square)
![A11y](https://img.shields.io/badge/a11y-WCAG%202.1%20AA-B69BFF?style=flat-square)

</div>

---

## 🌍 Why this exists

Millions of Nigerians already save together. They run **Ajo**, **Esusu**, **Adashi**,
**Susu** and **Chama** circles — pooling money weekly, paying out in rotation, held
together by trust and social pressure. It works, and banks largely ignore it, because
banks only score *individual* credit history.

CirclePay AI takes that culture and makes it **safe, transparent and automatic** —
without asking anyone to abandon how they already save.

> **Built for the people banks skip:** salary earners and traders in savings groups,
> unbanked users with no smartphone who rely on agents and scratch cards, families
> raising funds for burials and school fees, and the kiosk operators who serve them.

---

## ✨ The four pillars

| | Pillar | What it does |
|:--:|:--|:--|
| 🔄 | **Circles** | Rotating savings groups with automated deductions, live payout countdowns, escrow, and a **backup pool** that covers a payout when someone defaults |
| 💳 | **PartPay** | Split big bills — rent, school fees, medical — into installments. Two models: *pay the vendor gradually*, or *CirclePay pays upfront* and you repay |
| ❤️ | **CircleSupport** | Community fundraising for life events — burials, weddings, medical, school fees — with transparent tracking and shareable receipts |
| 🏪 | **Agent network** | Kiosks, scratch cards and one-time withdrawal codes, so the **offline majority** can save and cash out without a smartphone or bank account |
| 🛡️ | **Trust** | An AI layer scoring trust and predicting default risk, wrapping all of the above with alerts before money goes missing |

---

## 📱 The product

<div align="center">

### 🔄 Circles — digital rotating contributions & savings
<img src="docs/screens-circles.png" alt="CirclePay Circles: home dashboard, group dashboard, payout countdown, member status, backup pool, AI risk alerts and payout celebration" width="88%" />

### ❤️ CircleSupport — support what matters, together
<img src="docs/screens-circlesupport.png" alt="CirclePay CircleSupport: campaign creation, campaign details, donation flow, agent cash deposits and donation receipts" width="88%" />

### 💳 PartPay — pay for services gradually
<img src="docs/screens-partpay.png" alt="CirclePay PartPay: service categories, the two payment models, repayment plans, payment calendar and auto-deduction management" width="88%" />

</div>

---

## 🏗️ Architecture

Three independent deliverables built from one shared spec.

```mermaid
flowchart LR
    subgraph APP["📱 circlepay-app · Expo SDK 57"]
        direction TB
        R["src/app<br/>expo-router · file-based, typed routes"]
        U["src/ui + src/theme<br/>token-driven component kit"]
        S[("src/store<br/>zustand + AsyncStorage<br/>simulates the whole backend")]
        R --> U
        R --> S
    end

    subgraph API["⚙️ circlepay-backend · NestJS"]
        direction TB
        C["Controllers<br/>class-validator DTOs · JWT guard"]
        SV["Domain services<br/>circles · partpay · campaigns<br/>agents · trust · notifications"]
        L{{"LedgerService<br/>the only writer of balances"}}
        C --> SV
        SV --> L
    end

    DB[("PostgreSQL 16<br/>Drizzle · schema.ts")]
    SITE["🌐 site/<br/>static marketing site<br/>no build step"]

    S -.->|"planned swap:<br/>fetch + JWT"| C
    L --> DB

    classDef app fill:#4B27D4,stroke:#231060,stroke-width:2px,color:#fff
    classDef api fill:#7C4DFF,stroke:#4B27D4,stroke-width:2px,color:#fff
    classDef data fill:#1BA87A,stroke:#0d6b4d,stroke-width:2px,color:#fff
    classDef web fill:#E0930F,stroke:#8a5a06,stroke-width:2px,color:#fff
    classDef ledger fill:#E23D6B,stroke:#8f1f41,stroke-width:2px,color:#fff

    class R,U,S app
    class C,SV api
    class L ledger
    class DB data
    class SITE web
```

### 🔐 The one invariant that matters

**Every money movement is atomic and appends a user-visible transaction.**

On the backend, `LedgerService` is the *only* place a wallet balance changes. Feature
services open a `db.transaction` and call `ledger.move(tx, …)`, so domain writes and the
balance change commit together or not at all. Balance reads inside a transaction take
`SELECT … FOR UPDATE`. The app store enforces the same rule client-side.

Money is stored as `numeric(14,2)` — exact decimal, never float.

### 🔗 How the app and backend fit together

The app currently runs **entirely off its zustand store**, which simulates the backend
end to end — ledger, auto-debits, payouts, donations, scratch cards, withdrawal codes.
The backend was written to replace it: its response DTOs match
`circlepay-app/src/store/types.ts` **field for field**, so going live means swapping store
actions for `fetch` + a JWT in `AsyncStorage`, not remodelling the domain.

> ⚠️ **That 1:1 correspondence is the integration plan.** Change a domain type on one
> side, change it on the other.

---

## 🚀 Quick start

### 📱 The app

```bash
cd circlepay-app
npm install
npm run web        # http://localhost:8081 — fastest way to try it
npm run ios        # requires Xcode
npm run android
```

Onboard with **any** phone number, **any** 6-digit OTP, **any** 4-digit PIN.
**More → Reset Demo Data** restores the seed state.

### ⚙️ The backend

```bash
cd circlepay-backend
cp .env.example .env
npm install

docker compose up -d     # Postgres 16 on host port 5433 (not 5432)
npm run db:generate      # SQL migrations from schema.ts
npm run db:migrate       # apply them   (or: npm run db:push)
npm run db:seed          # demo data

npm run start:dev        # http://localhost:4000/api
```

Log in as the seeded demo user with phone **`+234 803 555 0147`** — with
`OTP_DEV_MODE=true` the API returns the OTP code in the response. Any other phone
creates a fresh, zero-balance account.

```bash
curl localhost:4000/api/health
curl -sX POST localhost:4000/api/auth/request-otp \
  -H 'content-type: application/json' -d '{"phone":"+234 803 555 0147"}'
```

### 🌐 The marketing site

No build, no dependencies:

```bash
python3 -m http.server 4173 --directory site
```

---

## 🎯 Try these flows

- **Onboarding** — welcome → OTP → KYC tiers → PIN + Face ID
- **Circles** — open *Family Esusu*: live payout countdown, member paid/late status,
  backup pool, AI default alert. **Simulate payout day** fires the payout celebration
- **PartPay** — start a plan (category → payment model → schedule review), then make
  early payments from the plan dashboard
- **CircleSupport** — donate to *Support Mama Chinedu's Burial* (your wallet balance
  actually moves) and get a shareable receipt
- **Agent network** — redeem a scratch card (any 14–16 digit serial), or request a kiosk
  withdrawal for a 5-minute one-time code with full fee breakdown
- **Trust** — More → Trust Score / AI Risk & Alerts

---

## 🗂️ Repository layout

```
circlepay/
├── circlepay-app/        📱 Expo SDK 57 · React Native · TypeScript
│   ├── src/app/             expo-router routes (file-based, typed)
│   ├── src/ui/              shared kit: Screen, Card, Gauge, CountdownTimer, …
│   ├── src/store/           zustand: types, seed data, all domain actions
│   ├── src/theme/tokens.ts  design tokens — the styling source of truth
│   └── AGENTS.md            ⚠️ app conventions + SDK 57 sharp edges
│
├── circlepay-backend/    ⚙️ NestJS · Drizzle · PostgreSQL
│   ├── src/db/schema.ts     single source of truth for the database
│   ├── src/wallet/          wallet + LedgerService
│   └── src/{auth,users,circles,partpay,campaigns,agents,trust,notifications}/
│
├── site/                 🌐 static marketing site (9 pages, one stylesheet)
├── docs/                 🖼️ product mockup boards
├── designs/design-spec.md   🎨 visual source of truth for the app
├── prd.md                   📋 full product requirements
├── PRODUCT.md               💜 brand, audience, design principles
└── CLAUDE.md                🤖 architecture + commands for AI agents
```

---

## 🎨 Design system

Extracted from the mockups into `circlepay-app/src/theme/tokens.ts` — **never hardcode a
hex value or font string in a screen.**

| | Token | Hex | Use |
|:--:|:--|:--|:--|
| ![](https://img.shields.io/badge/-4B27D4-4B27D4?style=flat-square) | `primary` | `#4B27D4` | Brand, primary actions |
| ![](https://img.shields.io/badge/-7C4DFF-7C4DFF?style=flat-square) | `accent` | `#7C4DFF` | Highlights, gradients |
| ![](https://img.shields.io/badge/-231060-231060?style=flat-square) | `primaryDeep` | `#231060` | Dark hero surfaces |
| ![](https://img.shields.io/badge/-1BA87A-1BA87A?style=flat-square) | `success` | `#1BA87A` | Paid, healthy, confirmed |
| ![](https://img.shields.io/badge/-E0930F-E0930F?style=flat-square) | `warning` | `#E0930F` | Pending, due soon |
| ![](https://img.shields.io/badge/-E23D6B-E23D6B?style=flat-square) | `danger` | `#E23D6B` | Late, high risk, defaults |
| ![](https://img.shields.io/badge/-1A1B2E-1A1B2E?style=flat-square) | `ink` | `#1A1B2E` | Body text |

**Type:** Plus Jakarta Sans for UI · JetBrains Mono for every ₦ amount (via `AmountText`)
**Icons:** Ionicons only · **Charts:** `react-native-svg`

### ♿ Accessibility is not optional

WCAG 2.1 AA contrast · visible focus states · full `prefers-reduced-motion` support ·
never colour alone for status (always paired with an icon or label) · low-bandwidth
conscious, SVG over raster.

---

## 📋 Project status

Honest about where this actually is — candour is how a money brand earns belief.

| Area | Status |
|:--|:--|
| 📱 App UI & flows | ✅ Complete across all pillars |
| 🗄️ Backend API | ✅ Built — every module and endpoint |
| 🔗 App ↔ backend wiring | ⏳ **Not yet connected** — app runs on the simulated store |
| 💬 OTP & payments | 🟡 Simulated (no SMS provider or payment gateway yet) |
| 🧠 Trust / risk scoring | 🟡 Seeded and static — not a live model yet |
| 🧪 Test suite | ❌ **None.** Verification is `tsc --noEmit` + manual flows |
| 🌐 Marketing site | ✅ 9 pages, static, no build step |

### 🛣️ Toward production

- Swap `numeric` money for integer minor units (kobo) and a full double-entry ledger
- Real SMS (Termii/Twilio) and payments (Paystack/Flutterwave)
- BullMQ scheduler for auto-debits, payouts, reminders and grace-period retries
- Move trust/risk scoring into its own service
- Refresh tokens, OTP rate limiting, audit logging

---

## 📚 Further reading

| Doc | What's in it |
|:--|:--|
| [`prd.md`](prd.md) | Full product requirements — the functional source of truth |
| [`PRODUCT.md`](PRODUCT.md) | Brand, audience, design principles and anti-references |
| [`designs/design-spec.md`](designs/design-spec.md) | Visual source of truth for the app |
| [`circlepay-app/AGENTS.md`](circlepay-app/AGENTS.md) | App conventions + Expo SDK 57 sharp edges |
| [`circlepay-backend/README.md`](circlepay-backend/README.md) | Full endpoint table and backend detail |
| [`CLAUDE.md`](CLAUDE.md) | Architecture, commands and gotchas for AI agents |

---

<div align="center">

**We already know how to save together.**
**CirclePay just makes it safe, transparent and automatic.**

<sub>Built for Nigeria 🇳🇬 · expanding to Africa and emerging markets</sub>

</div>
