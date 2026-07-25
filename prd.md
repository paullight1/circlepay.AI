# CirclePay AI — Product Requirements Document (PRD)

**Tagline:** Save Together. Pay Smart. Grow Better.
**Product:** CirclePay AI — The Social Financial Ecosystem for Community Savings, Payments & Micro-Business Growth
**Version:** 1.0
**Region:** Nigeria → Africa → Emerging Markets
**Audience:** Engineering, Product, Design, QA

---

## 1. Product Overview

CirclePay AI is a community-driven digital finance platform that transforms traditional rotating savings systems (Ajo, Esusu, Adashi, Susu, Chama) into a modern, AI-powered financial ecosystem. It blends the trust culture of informal community finance with modern fintech infrastructure — mobile apps, open banking, and an agent/kiosk network — so both banked and unbanked users can participate.

The platform lets people save collectively in trusted circles, pay for essential services in installments, raise funds for life events, and access their money through agents and scratch cards. An AI trust-and-risk layer monitors behavior across every module to protect payouts and reduce defaults.

### 1.1 Problem Statement
- Informal thrift collectors are trusted but manual, opaque, and prone to fraud or loss.
- Friends raise money for emergencies manually over WhatsApp — untracked, unaccountable, and messy.
- Rent, school fees, and medical bills demand large upfront payments most people cannot make at once.
- Micro-businesses lack capital, POS tools, and access to structured credit.
- Banks focus on individual credit history and ignore community trust systems, leaving millions unbanked or underbanked.

### 1.2 Vision
> CirclePay AI becomes the **Operating System for Community Finance** — where people save together, support each other, pay for life events, and grow businesses, all in one platform.

### 1.3 Goals & Success Metrics

| Goal | Metric | Target (Launch + 6mo) |
|------|--------|----------------------|
| Prove core savings loop | Active contribution circles | 500+ circles |
| Drive retention | 30-day retention | ≥ 40% |
| Reduce defaults | Missed-contribution rate | < 8% of due contributions |
| Financial inclusion | % transactions via agent/kiosk | ≥ 25% |
| Viral growth | New users per support campaign | ≥ 20 avg. |
| Trust adoption | Users with a Trust Score | ≥ 70% of active users |

### 1.4 Target Users

| Persona | Description | Primary Needs |
|---------|-------------|---------------|
| Circle Saver | Salary earners & traders in savings groups | Automated, transparent contributions & payouts |
| Unbanked User | No smartphone / no bank account | Agent deposits, scratch-card savings, cash withdrawal |
| Campaign Organizer | Raising funds for a life event | Transparent, shareable fundraising |
| Micro-Business Owner | Small shop / trader | POS, inventory, working-capital financing |
| Agent / Kiosk Operator | Local cash-in/cash-out point | Tools to serve customers & earn commissions |

---

## 2. Scope

### 2.1 In Scope — MVP (Phase 1)
1. Digital Rotating Contributions & Savings (Circles)
2. Installment Payments (CirclePay PartPay)
3. Community Fundraising (CircleSupport)
4. Agent / Kiosk Network + Scratch Card + Kiosk Withdrawal
5. Supporting: Wallet, AI Trust Score, Contribution Dashboard, Authentication & KYC

### 2.2 Out of Scope (Later Phases)
- SME POS + inventory + working-capital lending (Phase 3–4)
- Landlord/school direct collection integrations (Phase 2)
- Diaspora remittances, micro-insurance (Phase 5)
- Full native card issuance

### 2.3 Phased Roadmap

| Phase | Scope | Outcome |
|-------|-------|---------|
| Phase 1 (MVP) | Circles, PartPay, CircleSupport, Agent/Kiosk, Wallet, Trust Score | Launchable community-finance app |
| Phase 2 | Landlord/school collections, auto-debit, group governance rules | Recurring-revenue rails |
| Phase 3 | BNPL, vendor integrations, emergency funds | Broader payment coverage |
| Phase 4 | SME POS, inventory, working-capital loans | Business suite |
| Phase 5 | Nationwide agents, micro-insurance, remittances | Scale & new verticals |

---

## 3. Feature — Digital Rotating Contributions & Savings (Circles)

A digital rotating contributions and savings system where members contribute fixed amounts at agreed intervals into a shared pool, and each cycle one designated member automatically receives the lump sum. Digitizes traditional Ajo / Esusu / Adashi / Susu systems with automation, transparency, and AI-driven risk protection.

### 3.1 How It Works
1. Users link their bank accounts or cards via APIs / Open Banking.
2. Contributions are auto-debited at agreed intervals (daily, weekly, or monthly).
3. Funds are pooled into a secure group wallet.
4. On payout day, the designated member automatically receives the lump sum.
5. AI monitors compliance — alerts the group instantly if someone defaults, predicts risk, and suggests backup contributions.

> **Example:** 10 members contribute ₦10,000 weekly. Every week, one member automatically collects ₦100,000 until every member has received a payout.

### 3.2 Key Features

**Automated Deductions**
- Members link accounts / cards.
- Pre-set contributions deducted automatically — no manual chasing, no excuses.

**AI-Driven Trust & Alerts**
- AI monitors payment behavior across the circle.
- Late payment triggers an instant push notification to all members.
- Predictive scoring warns the group when a member is at high risk of default, based on behavioral patterns.

**Transparent Dashboard**
- Real-time view of who paid, who didn't, and the current group balance.
- Countdown timer to the next payout.

**Smart Escrow & Backup Pool**
- A small percentage of contributions is set aside into a backup pool.
- If a member defaults, the AI can trigger the backup pool to protect the scheduled payout so the receiving member is not shortchanged.

### 3.3 User Stories

| ID | As a… | I want to… | So that… |
|----|-------|-----------|----------|
| C-01 | Circle creator | set contribution amount, frequency & payout order | the group runs on clear, agreed rules |
| C-02 | Member | link my account and auto-contribute | I never miss a contribution |
| C-03 | Member | see who has and hasn't paid in real time | the group stays transparent |
| C-04 | Member | get alerted when someone defaults | we can act before payout day |
| C-05 | Payout recipient | receive my lump sum automatically | I get paid on time even if someone is late |

### 3.4 Functional Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-C-1 | Create circle with name, member count, contribution amount, frequency, start date & payout order | Must |
| FR-C-2 | Invite members via link/contact; join flow with acceptance of circle rules | Must |
| FR-C-3 | Link bank account/card via Open Banking / payment API and mandate setup | Must |
| FR-C-4 | Scheduler auto-debits contributions at the agreed interval | Must |
| FR-C-5 | Pool funds into a secure, auditable group wallet (escrow) | Must |
| FR-C-6 | Auto-disburse lump sum to designated member on payout day | Must |
| FR-C-7 | Real-time dashboard: paid/unpaid status, balance, next-payout countdown | Must |
| FR-C-8 | Push notifications for due, successful, failed & late contributions | Must |
| FR-C-9 | AI risk scoring & default prediction per member | Should |
| FR-C-10 | Backup pool: reserve % of contributions; auto-trigger on default | Should |
| FR-C-11 | Retry logic & grace period for failed debits before flagging default | Must |

---

## 4. Feature — Installment Payments (CirclePay PartPay)

CirclePay enables people to pay for services gradually rather than in a single large upfront payment, expanding access to essential services.

### 4.1 Use Cases
- Rent
- School fees
- Medical bills
- Consumer products

### 4.2 Two Payment Models

| Model | How It Works | CirclePay's Role |
|-------|-------------|------------------|
| 1. Pay Gradually | User pays into the item/service gradually until full payment is reached, then it is released. | Holds funds in escrow; releases to vendor when target is met. |
| 2. Pay Vendor Upfront | CirclePay pays the vendor the full amount upfront; the user repays gradually (optionally with small interest). | Extends short-term credit; collects repayments on schedule. |

### 4.3 User Stories

| ID | As a… | I want to… | So that… |
|----|-------|-----------|----------|
| P-01 | User | split a rent/fee/bill into installments | I can afford essential services |
| P-02 | User | choose pay-gradually or pay-upfront-and-repay | I pick the plan that fits my cash flow |
| P-03 | User | see my remaining balance & schedule | I know exactly what I owe and when |
| P-04 | Vendor | receive payment reliably | I trust the platform to settle |

### 4.4 Functional Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-P-1 | Create installment plan: total amount, category, number/size of installments, frequency | Must |
| FR-P-2 | Support Model 1 (escrow until full) and Model 2 (upfront + repayment) | Must |
| FR-P-3 | Auto-debit installments from linked account/wallet on schedule | Must |
| FR-P-4 | Configurable interest/fee for Model 2, shown transparently before acceptance | Must |
| FR-P-5 | Vendor onboarding & payout on completion (Model 1) or upfront (Model 2) | Must |
| FR-P-6 | Eligibility check for Model 2 gated by AI Trust Score | Should |
| FR-P-7 | Reminders, missed-payment handling & repayment dashboard | Must |

---

## 5. Feature — Community Fundraising (CircleSupport)

CircleSupport allows users to raise funds for life events. Instead of managing contributions manually over WhatsApp, everything happens inside CirclePay — turning informal community support into a structured, transparent financial service. Every campaign also introduces new contributors to the platform, driving viral growth.

### 5.1 Use Cases
Burial support · Birthday support · Medical emergencies · Weddings · School fees · Community projects

### 5.2 What CirclePay Provides
- **Transparent campaign tracking** — total raised, number of supporters, top supporters, time remaining.
- **Instant digital donations** — bank transfer, CirclePay wallet, or scratch card.
- **Agent cash contributions** — supporters without smartphones can donate through kiosks.

### 5.3 Campaign Flow
1. Create a support drive: choose event type, title (e.g. "Support for Mama Chinedu's Burial"), target amount, and deadline.
2. Share the campaign link via WhatsApp, Telegram, SMS, or social media.
3. Supporters donate instantly via wallet, transfer, scratch card, or agent kiosk.
4. Everyone sees a real-time contribution tracker.
5. On completion, funds pay out to the campaign owner or beneficiary wallet; withdrawable at agents/kiosks.

### 5.4 AI & Growth Features
- **Fraud detection** — AI flags suspicious campaigns.
- **Smart suggestions** — e.g. "10 people from your last circle may want to support this."
- **Auto reminders** — nudges people who viewed but didn't donate.
- **Community leaderboards & badges** — Community Hero, Circle Champion, Kind Heart Award — to gamify generosity.

### 5.5 Functional Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-S-1 | Create campaign: event type, title, target amount, deadline, optional image | Must |
| FR-S-2 | Generate a unique shareable campaign link | Must |
| FR-S-3 | Accept donations via wallet, bank transfer, scratch card & agent cash | Must |
| FR-S-4 | Real-time tracker: total raised, supporter count, top supporters, countdown | Must |
| FR-S-5 | Payout to owner/beneficiary wallet on completion or deadline | Must |
| FR-S-6 | Platform fee of 1–3% or optional service charge | Must |
| FR-S-7 | AI fraud detection on campaigns | Should |
| FR-S-8 | Auto reminders to non-donating viewers; leaderboards & badges | Could |

---

## 6. Feature — Agent / Kiosk Network, Scratch Cards & Kiosk Withdrawal

The agent and kiosk network bridges the cash and digital economy, extending CirclePay to users without smartphones or bank accounts. Every user gets a CirclePay ID that works like an account number, and can transact through local agents, kiosks, and scratch cards.

### 6.1 Agent / Kiosk Services
Cash Deposit · Cash Withdrawal · Buy Scratch Card · Airtime & Data · Bill Payments · Account Opening · Transfer Money · Check Balance · View Transactions

### 6.2 In-App Agent Experience
- Agent Banking home shows the user's CirclePay ID (e.g. CPAI-7834-5689) and wallet balance.
- **Find an Agent** — a map view of nearby agents/kiosks with distance, open status, and directions.
- Agent services list: cash deposit, cash withdrawal, buy scratch card, transfer to another user, view transactions.

### 6.3 Scratch Card / Serial System
Users can buy CirclePay savings cards (like recharge cards) from any agent or kiosk, enabling offline users to save digitally.

**How It Works**
1. Buy a CirclePay scratch card from any agent or kiosk.
2. Scratch and enter the 14–16 digit serial number in the app.
3. The value is added to the wallet instantly.

*Available denominations: ₦1,000, ₦5,000, and ₦10,000 (extensible).*

### 6.4 Withdrawal at Kiosk
A secure code-based cash-out flow so users can withdraw physical cash at any agent/kiosk.
1. **Request Withdrawal** — enter amount and select the cash-withdrawal method.
2. **Visit Agent or Kiosk** — go to any nearby CirclePay agent.
3. **Agent Verifies & Processes** — agent verifies the user's ID and processes the request.
4. **Receive Cash** — user collects cash instantly; transaction completes.

> **Security:** The app generates a time-limited withdrawal code (e.g. 872 641, expiring in ~5 minutes) shown to the agent to complete the cash-out. The code must never be shared with anyone else. A transaction fee applies and total deduction is shown before confirmation.

### 6.5 Functional Requirements

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| FR-A-1 | Assign a unique CirclePay ID to every user (account-number equivalent) | Must |
| FR-A-2 | Agent locator with map, distance, open/closed status & directions | Must |
| FR-A-3 | Agent app/portal for deposit, withdrawal, account opening & transactions | Must |
| FR-A-4 | Scratch-card issuance, serial validation & instant wallet credit | Must |
| FR-A-5 | Kiosk withdrawal via time-limited one-time code with expiry & fee display | Must |
| FR-A-6 | Withdrawal summary (amount, fee, total deduction, net received) before confirm | Must |
| FR-A-7 | Agent commission tracking & settlement | Must |
| FR-A-8 | Fraud controls: scratch-card reuse prevention, code single-use, agent KYC | Must |

---

## 7. Supporting Modules

### 7.1 Wallet
- Every user has a wallet showing total, available, and savings balances.
- Core actions: Add Money, Withdraw, Transfer, Scan & Pay (QR).
- The wallet is the settlement layer for circles, installments, fundraising, and agent transactions.

### 7.2 AI Trust Score
A cross-cutting scoring engine that analyzes behavior across all modules to build a per-user Trust Score (e.g. 720 — "Good").

**Signals**
- On-time payments and contribution history.
- Circle participation and account activity.
- Transaction patterns and default history.

**Unlocks**
- Higher scores unlock micro-loans, early payouts, and installment (Model 2) approvals.

### 7.3 Authentication, KYC & Notifications
- Phone-first signup with OTP; tiered KYC (BVN/NIN + ID upload) gating higher limits.
- Biometric / PIN for transaction authorization.
- Push, SMS & in-app notifications for all money movements and circle events.

---

## 8. Technical Considerations

### 8.1 Suggested Architecture
- **Mobile app** (iOS + Android) — cross-platform (e.g. React Native / Flutter).
- **Agent portal/app** — web + mobile for cash-in/cash-out and account opening.
- **Backend** — service-oriented (e.g. Node.js / TypeScript) with PostgreSQL as the system of record and a ledger service for wallet/escrow.
- **Scheduler/queue** — for auto-debits, payouts, reminders (e.g. cron + message queue).
- **AI/risk service** — separate service for trust scoring, default prediction & fraud detection.

### 8.2 Key Integrations

| Integration | Purpose |
|-------------|---------|
| Open Banking / account-linking API | Link accounts, set up debit mandates |
| Payment gateway (e.g. Paystack / Flutterwave) | Collections, transfers, payouts |
| BVN / NIN verification | KYC & identity |
| Maps / geolocation | Agent locator |
| SMS & push provider | Notifications, OTP, withdrawal codes |

### 8.3 Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| Security | Encryption in transit & at rest; PCI-aware handling; single-use codes; fraud monitoring |
| Reliability | Ledger consistency for wallet/escrow; idempotent debits; retry with grace periods |
| Compliance | CBN/regulatory alignment; licensed, regulated agent operations; audit logs |
| Performance | Real-time dashboards & instant scratch-card credit; low-latency agent flows |
| Availability | Offline-tolerant agent flows; graceful degradation when a user has no smartphone |
| Accessibility | Low-bandwidth support; local-language readiness |

### 8.4 Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Contribution defaults | Backup pool, AI prediction, retries, grace periods |
| Agent fraud / cash mismatch | Agent KYC, commission settlement controls, single-use codes |
| Scratch-card abuse | Serial validation, reuse prevention, denomination limits |
| Fundraising fraud | AI campaign screening, payout verification |
| Regulatory | Licensing, compliance review before lending/interest features |

---

## 9. Appendix

### 9.1 Revenue Model
- Contribution service fees
- Installment payment interest (Model 2)
- Merchant / collection fees
- SME financing interest (later phase)
- POS transaction fees (later phase)
- Agent commissions
- Fundraising platform fee (1–3%)

### 9.2 Glossary

| Term | Meaning |
|------|---------|
| Ajo / Esusu / Adashi / Susu / Chama | Traditional rotating savings & credit associations |
| Circle | A digital rotating savings & contribution group |
| PartPay | CirclePay's installment-payment product |
| CircleSupport | CirclePay's community fundraising product |
| CirclePay ID | A unique per-user identifier used like an account number |
| Backup Pool | Reserved contributions used to protect payouts on default |
| Trust Score | AI-generated creditworthiness/behavior score |