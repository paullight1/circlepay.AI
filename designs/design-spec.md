# CirclePay AI — UI Design Specification

Extracted from `CirclePay AI Screens.dc.html` (design canvas v1.0).
Tagline: **"Save Together. Pay Smart. Grow Better."**
24 mobile screens across 7 flows. Currency is Nigerian Naira (₦). Phone frame in mockups: 340px wide, min-height 724px, radius 38px — treat as a standard mobile viewport in RN.

---

## 1. Global Design Tokens

### 1.1 Brand & Core Colors

| Token | Hex | Role |
|---|---|---|
| `primary` | `#4B27D4` | Primary brand purple — filled buttons, active tab, links ("See all"), selected borders, key amounts, avatar text on light purple |
| `primaryDeep` | `#5B2EE6` | Gradient start for hero cards / FAB |
| `accent` | `#7C4DFF` | Secondary purple — gradient end, logo "AI" suffix, decorative glows |
| `accentSoft` | `#B69BFF` | Logo conic-gradient stop |
| `primarySurface` | `#EDE7FD` | Light-purple tint surface: icon chips, avatar circles, info banners, highlight cards |
| `primaryBadgeBg` | `#E7E0FB` | Section label chip background (canvas only) |
| `primaryTextOnTint` | `#3A2596` | Dark purple heading text on `#EDE7FD` banners |
| `primaryMutedOnTint` | `#6B5FB0` / `#5B4FA8` | Secondary text on purple tint banners |
| `primaryBorder` | `#C4B6F5` | Dashed border on "add / upload" cards |
| `outlineBtnBorder` | `#D6D2EE` | Border of secondary (outlined) buttons, unselected radio rings |
| `onPrimaryMuted` | `#CDBFFF` | Muted body text on solid `#4B27D4` background (welcome screen) |
| `onGradientMuted` | `#D9CCFF` | Muted label text on purple gradient cards ("Total Balance", "Total Circles") |
| `logoAiLight` | `#C6B2FF` | "AI" suffix color on dark backgrounds |

### 1.2 Neutrals

| Token | Hex | Role |
|---|---|---|
| `ink` | `#1A1B2E` | Primary text; also dark card background (wallet card, countdown card, withdrawal-code card, CirclePay ID card) |
| `textSecondary` | `#6B6C7E` | Secondary/body text, list subtitles |
| `textLabel` | `#4A4B5E` | Form field labels, insight body text, screen captions |
| `textFaint` | `#8A8B98` | Disabled/upcoming schedule rows |
| `textDisabled` | `#A6A7B5` | Inactive tab items, "Upcoming" tags |
| `placeholder` | `#C9CAD6` | Empty OTP digits, disabled resend text, chevrons |
| `screenBg` | `#F4F5F9` | Default screen background |
| `surface` | `#FFFFFF` | Cards, list rows, inputs |
| `surfaceMutedIcon` | `#F1F0FB` | Transaction icon chip background |
| `segmentTrackBg` | `#EAEAF0` | Segmented-control track |
| `neutralChipBg` | `#EFEFF4` | "Other/More" category icon chips |
| `border` | `#EBEBF1` | Card/input borders (1.5px), row dividers (1px) |
| `progressTrack` | `#EDEDF3` | Progress bar & gauge track |
| `trackAlt` | `#E0E1E9` | KYC tier bar unfilled segment |
| `onDarkMuted` | `#A9AAC0` | Muted labels on `#1A1B2E` dark cards |

### 1.3 Status Colors (semantic)

| Status | Text/Icon | Tint background | Usage |
|---|---|---|---|
| Success / Paid | `#1BA87A` | `#E4F6EF` | "Paid" pills, verified checks, positive amounts, open agents |
| Pending | `#E0930F` | `#FCF1DD` | "Pending"/"Due" pills, countdown chips ("19 days left"), moderate risk |
| Late / Alert | `#E23D6B` | `#FCE6EC` | "Late" pills, high-risk alerts, notification dot, closed agents |
| Alert text (deep) | `#C62A55` on `#FCE6EC` | — | Alert banner headings/buttons; body copy `#8A3450` |
| Alert on dark | `#FF9DB6` on `rgba(226,61,107,0.18)` | — | "Expires in 4:52" chip on dark card |
| Info blue | `#2A6FDB` | `#E7F0FF` | School Fees / Wedding category chips, Transfer service |

### 1.4 Third-party brand colors (bank logos)

`#FF6A2C` GTBank (GT) · `#F58220` Access Bank (AB) · `#0A2A66` First Bank (FB) · `#D8112B` Zenith Bank (Z) · `#1A8F5C` Opay (O).

### 1.5 Gradients

| Name | Definition | Used on |
|---|---|---|
| Hero balance | `linear-gradient(150deg, #5B2EE6, #7C4DFF)` | Home balance card, Scan FAB, campaign CTA banner (140deg) |
| Circle stats / group balance | `linear-gradient(140deg, #4B27D4, #7C4DFF)` | My Circles totals card, Group Dashboard balance card |
| Scratch card | `linear-gradient(135deg, #4B27D4, #7C4DFF)` | Scratch card visual |
| Progress fill | `linear-gradient(90deg, #4B27D4, #7C4DFF)` | All progress bars (plans, campaigns) |
| Trust gauge | `linear-gradient` stops: `#E23D6B` → `#E0930F` (50%) → `#1BA87A` | Trust score arc stroke |
| Logo mark | `conic-gradient(from 140deg, #4B27D4, #7C4DFF, #B69BFF, #4B27D4)` | Circular logo (inner dot = background color) |
| Donut chart | `conic-gradient(#1BA87A 0 70%, #E0930F 70% 90%, #E23D6B 90% 100%)` | Payment summary donut |

### 1.6 Typography

- **Primary font**: `Plus Jakarta Sans` (weights 400, 500, 600, 700, 800). System-ui fallback. Antialiased.
- **Mono font**: `JetBrains Mono` (500, 600) — used for codes and card values: CirclePay ID `CPAI-7834-5689`, withdrawal code `872 641`, scratch-card serial boxes, card value `₦5,000`.
- Scale (from mockups): balance display 32–33px/800; payout amount 40px/800; withdrawal code 44px/800 (letter-spacing 10px); gauge value 38–44px/800; page title (large) 19–24px/800; nav-bar title 17px/700; card title 14.5–15px/700–800; body 13–14.5px; list subtitle 11–12.5px; pills/tags 10.5–12px/700; tab label 10.5px; negative letter-spacing (−0.4 to −1px) on large numerals and headlines.

### 1.7 Radii

| Radius | Usage |
|---|---|
| 38px | Phone frame |
| 22–24px | Hero/balance cards, dark feature cards |
| 18–20px | Standard content cards, gradient stat cards |
| 14–16px | List rows, inputs, primary buttons (16px), small banners |
| 11–13px | Icon chips, amount chips, segmented pills, small buttons |
| 8–9px | Status pills, tiny badges |
| 50% | Avatars, FAB, PIN dots, logo |

### 1.8 Shadows

- Phone frame: `0 20px 55px rgba(35,28,80,0.13)` (welcome screen 0.18) + `1px solid #E4E5EE` border.
- Home balance card: `0 14px 30px rgba(91,46,230,0.32)`.
- Scan FAB: `0 10px 22px rgba(91,46,230,0.45)`.
- Active segmented pill: `0 1px 4px rgba(0,0,0,0.06)`.
- Map pin marker: `0 4px 10px rgba(0,0,0,0.25)`, 3px white border.
- Flat cards otherwise (white on `#F4F5F9`, no shadow).

### 1.9 Spacing patterns

- Screen horizontal padding: 20–26px (cards inset 20px; text blocks 22–26px).
- Card internal padding: 14–24px; list rows ~13–17px vertical.
- Gap between stacked list cards: 9–13px; section header → list: 10–12px.
- Status bar: 46px high, "9:41" left, signal/wifi/battery right.
- Bottom CTA area: `margin-top: auto`, padding ~16–26px sides, 30–34px bottom.
- Primary button: full-width, 15–17px vertical padding, radius 15–16px, 14.5–16px/700 white text on `#4B27D4`.
- Secondary button: transparent, `1.5px solid #D6D2EE` border, `#4B27D4` text.
- Toggle switch: 40×24px pill `#4B27D4`, 18px white knob (on state).
- Radio: 20–22px ring, 2px border `#4B27D4` (selected, with 10–11px filled dot) / `#D6D2EE` (unselected).

---

## 2. Navigation Model

### Bottom tab bar (white, `border-top: 1px solid #EEEEF3`, padding 11px 22px 30px)

| Position | Icon | Label | Active color |
|---|---|---|---|
| 1 | home | **Home** | `#4B27D4` (inactive `#A6A7B5`) |
| 2 | users | **Circles** | " |
| 3 (center) | qr | **Scan** — 58px circular FAB, gradient `150deg #5B2EE6→#7C4DFF`, raised −26px, white qr icon + 8.5px "Scan" label | — |
| 4 | heart | **Support** | " |
| 5 | menu (hamburger) | **More** | " |

Tab bar appears on: 05 Home (Home active), 06 Wallet (More active), 07 My Circles (Circles active), 18 Campaigns (Support active). All other screens are pushed detail screens with a back chevron header (back icon + 17px/700 title).

### Flow map

| Flow | Screens |
|---|---|
| 01 Onboarding & Auth | 01 Welcome → 02 Verify OTP → 03 KYC → 04 PIN & Face ID |
| 02 Home & Wallet | 05 Home Dashboard, 06 Wallet |
| 03 Circles (rotating savings) | 07 My Circles → 08 Create Circle, 09 Link Bank Account, 10 Group Dashboard → 11 Members Status → 12 Payout Success |
| 04 AI Trust & Risk | 13 Trust Score, 14 AI Risk & Alerts |
| 05 PartPay (installments) | 15 Choose What to Pay → 16 Select Payment Model → 17 Plan Dashboard |
| 06 CircleSupport (fundraising) | 18 Campaigns → 19 Campaign Details → 20 Donate to Campaign |
| 07 Agent / Kiosk Network | 21 Agent Banking Home → 22 Find Nearby Agents, 23 Redeem Scratch Card, 24 Withdraw at Kiosk |

Canvas status legend: green dot "Paid / Success", amber "Pending", pink "Late / Alert".

---

## 3. Per-Screen Specs

### 01 · Welcome
- **Purpose**: App intro / entry to sign-up.
- **Frame**: solid `#4B27D4` background, light status bar (white text).
- Top: logo mark (34px conic-gradient circle `#B69BFF→#fff→#B69BFF`, inner 12px `#4B27D4` dot) + wordmark **"CirclePay"** with **"AI"** in `#C6B2FF`, 19px/800.
- Hero image slot: 288×250, radius 24 — "Community savings illustration".
- Headline 27px/800 white: **"Save together. / Pay smart. / Grow better."** (3 lines).
- Sub-copy `#CDBFFF` 14.5px: "Join trusted savings circles, split big bills, and support your community — all in one place."
- Page dots: 1 active (22×6 white pill) + 2 inactive (6×6, white 40%).
- Button: white bg, `#4B27D4` text, radius 16, **"Get Started"**.
- Footer: "Already have an account? **Log in**" (Log in white/700, rest `#CDBFFF`).

### 02 · Verify OTP
- **Purpose**: Phone-number verification.
- Header: back chevron only.
- Title 24px/800: **"Verify your number"**. Sub: "We sent a 6-digit code to" + bold `+234 803 •••• 4512`.
- **OTP boxes**: 6 equal boxes, 60px tall, radius 15, white bg, 24px/800 digits. Filled `8 7 2` with `1.5px solid #4B27D4` border; 4th shows ghost `6` in `#C9CAD6`; boxes 4–6 have `#EBEBF1` border.
- Resend row: "Didn't get it? **Resend in 0:24**" (timer in `#C9CAD6`).
- Info card (white, radius 18): purple shield icon + "Your number keeps your circles and wallet secure. We never share it."
- Bottom CTA: **"Verify & Continue"** (primary).

### 03 · Verify Identity (KYC)
- **Purpose**: Tiered KYC completion.
- Header: back + **"Verify your identity"**.
- Sub: "Complete KYC to unlock higher limits, payouts and installments."
- **Tier progress**: 3 segments (5px bars, radius 3): two filled `#1BA87A`, one `#E0E1E9`. Caption `#1BA87A` 12px: **"Tier 2 of 3 · almost there"**.
- Checklist cards (white, radius 18):
  1. Green check chip (44px, `#E4F6EF`/`#1BA87A`) — **"BVN verified"** / "2234 •••• 8891" — right tag "Done" green.
  2. Green check chip — **"NIN verified"** / "National ID linked" — "Done".
  3. Dashed `1.5px #C4B6F5` border, camera icon on `#EDE7FD` — **"Upload a valid ID"** / "Driver's licence, NIN slip or passport" — purple chevron.
- Image slot 288×120 radius 16: "ID document preview".
- Bottom CTA: **"Submit for review"**.

### 04 · Secure Account (PIN & Face ID)
- **Purpose**: Set transaction PIN + biometrics.
- Header: back only. Title 24px/800: **"Secure your account"**. Sub: "Set a 4-digit PIN to authorise every payment and payout."
- **PIN dots**: 4 × 17px circles; 3 filled `#4B27D4`, 1 empty (white, `1.5px #C9CAD6` border).
- **PIN pad**: 3×4 grid, digits 1–9, bottom row: Face ID icon (purple) · 0 · backspace (back icon, `#6B6C7E`). Digits 26px/600.
- Face ID banner (`#EDE7FD`, radius 18): faceId icon + "**Enable Face ID for faster sign-in**" (`#3A2596` 13.5px/700) + toggle ON.
- Bottom CTA: **"Confirm PIN"**.

### 05 · Home Dashboard  *(tab: Home)*
- Header: 42px avatar circle "GO" (`#EDE7FD`/`#4B27D4`) + "Good morning," / **"Godfrey 👋"** (16px/800). Right: 42px white rounded-14 bell button with `#E23D6B` notification dot.
- **Balance card** (gradient 150deg `#5B2EE6→#7C4DFF`, radius 24, purple shadow):
  - "Total Balance" + eye icon (both `#D9CCFF`) · **₦125,680.50** (32px/800).
  - Two columns: "Available" **₦98,450.20** · "On Hold (Groups)" **₦27,230.30**.
  - 3 quick actions in `rgba(255,255,255,0.16)` radius-13 chips: **Add Money** (plus), **Withdraw** (arrowUp), **Transfer** (transfer).
- Section header: **"My Circles"** (16px/800) + "See all" (purple link).
- **Circle rows** (white, radius 18): 42px radius-13 initials tile · name + "Next payout {date}" · right column amount (purple/800) + paid ratio (green/700):
  1. `FE` **Family Esusu** (tile `#4B27D4`) — Next payout May 24 — **₦100,000** — "7/10 paid"
  2. `FA` **Friends Ajo Group** (tile `#E0930F`) — Next payout Today, 6:00 PM — **₦12,000** — "9/12 paid"
  3. `BS` **Business Savings Circle** (tile `#1BA87A`) — Next payout May 25 — **₦50,000** — "4/6 paid"
- Bottom tab bar, Home active.

### 06 · Wallet  *(tab: More)*
- Header: back + **"My Wallet"**.
- **Dark balance card** (`#1A1B2E`, radius 24): "Total Wallet Balance" (`#A9AAC0`) · **₦125,680.50** (33px/800) · two inset tiles (`rgba(255,255,255,0.08)`, radius 14): "Available" **₦98,450.20** / "Savings" **₦27,230.30**.
- **Quick actions** 4-col grid, 52px radius-16 `#EDE7FD` icon chips + 11px labels: **Add** (plus), **Withdraw** (arrowUp), **Transfer** (transfer), **Scan & Pay** (qr).
- Section: **"Recent Transactions"** + "See all".
- **Transaction rows** (white, radius 16; 40px `#F1F0FB` purple icon chip; amount right, tag under it):
  1. arrowDown — **Auto Deduction · Family Esusu** — Today, 9:00 AM — **−₦10,000** (ink) — "Success"
  2. arrowUp — **Payout received · Ajo Group** — Yesterday, 2:30 PM — **+₦120,000** (green) — "Success"
  3. gift — **Donation · Mama Chinedu Burial** — May 18, 4:10 PM — **−₦5,000** (ink) — "Success"
  4. card — **Scratch card top-up** — May 17, 8:15 AM — **+₦5,000** (green) — "Success"
- Tab bar, More active.

### 07 · My Circles  *(tab: Circles)*
- Header: **"My Circles"** (20px/800) + right button: purple radius-12 chip, plus icon + **"New"**.
- **Stats card** (gradient 140deg `#4B27D4→#7C4DFF`, radius 20, split by 1px white-20% divider): "Total Circles" **12** · "Total Saved" **₦1,245,680** (26px/800).
- **Circle cards** (white, radius 20, two-row layout): header row = 44px initials tile + name (15px/800) + meta + green "Active" pill (`#E4F6EF`/`#1BA87A`); footer row = "Next payout" label with "{date} · {amount}" + paid ratio green:
  1. **Family Esusu** — "10 members · Weekly" — Active — Next payout May 24 · ₦100,000 — 7/10 paid
  2. **Friends Ajo Group** — "12 members · Daily" — Active — Next payout Today, 6:00 PM · ₦12,000 — 9/12 paid
  3. **Business Savings Circle** — "6 members · Monthly" — Active — Next payout May 25 · ₦50,000 — 4/6 paid
- Tab bar, Circles active.

### 08 · Create Circle
- Header: back + **"Create a Circle"**.
- Form (labels 12.5px/700 `#4A4B5E`; inputs white radius 14, 15px padding, 14.5px/600):
  - **Circle name**: "Family Esusu".
  - **Contribution amount**: purple `₦` prefix + "10,000".
  - **Frequency** segmented chips: Daily (unselected white/`#EBEBF1` border) · **Weekly** (selected, `#4B27D4` bg white text) · Monthly (unselected).
  - Two-up: **Members** "10" · **Start date** "May 24" + purple calendar icon.
  - **Payout order** dropdown: "AI-optimised (by trust score)" + chevronDown.
- **Backup pool banner** (`#EDE7FD`, radius 16): shield icon + **"Backup pool protection"** (`#3A2596`) / "Reserve 10% to cover defaults" (`#6B5FB0`) + toggle ON.
- Bottom CTA: **"Create Circle & Invite"**.

### 09 · Link Bank Account
- Header: back + **"Link Bank Account"**. Sub: "Securely link an account to auto-fund your contributions. No manual chasing."
- **Bank rows** (white, radius 16; 40px radius-11 logo tile with initials):
  - `GT` **GTBank** (`#FF6A2C`) · `AB` **Access Bank** (`#F58220`) · `FB` **First Bank** (`#0A2A66`) · `Z` **Zenith Bank** (`#D8112B`) · `O` **Opay** (`#1A8F5C`) — each with `#C9CAD6` chevron.
  - Dashed-border row: bank icon on `#EDE7FD` — **"Other banks"** / "Use Open Banking" — purple chevron.
- Footer (bottom-anchored, centered, 11.5px/600 `#6B6C7E`): green lock icon + "Powered by Open Banking · encrypted end-to-end".

### 10 · Group Dashboard
- Header: back + **"Family Esusu"** + dots (kebab) right.
- **Segmented control** (`#EAEAF0` track radius 13, 5px padding): **Overview** active (white pill, shadow) · Members · Activity.
- **Group balance card** (gradient 140deg `#4B27D4→#7C4DFF`, radius 20): "Group Balance" + shield icon · **₦540,000.00** (29px/800).
- Key-value rows (13px): Total Contributions **₦540,000** · Backup Pool (10%) **₦54,000** (purple) · Available for Payout **₦486,000**.
- **Payment Summary card** (white, radius 18): title 13.5px/800 + **donut chart** 78px, conic `#1BA87A 0–70% / #E0930F 70–90% / #E23D6B 90–100%`, white 52px center hole showing **"10 / members"**. Legend (dot + label + right-aligned amount):
  - Paid (7) — **₦490,000** · Pending (2) — **₦100,000** · Late (1) — **₦40,000**.
- **Countdown card** (`#1A1B2E`, radius 18): left "Next payout in" / **"03d : 12h : 45m"** (18px/800); right "Receiver" / **"Tunde O."**.
- Bottom CTA with share icon: **"Share Group Report"**.

### 11 · Members Status
- Header: back + **"Members Status"**. Sub 12px: **"Week 6 of 10 · ₦100,000 pool this cycle"**.
- **Member rows** (white, radius 14; 38px round avatar `#EDE7FD`/`#4B27D4` initials; name 13.5px/700; amount subtitle; right status pill radius 8):
  | Initials | Name | Amount | Status (pill colors) |
  |---|---|---|---|
  | TO | Tunde O. *(next receiver)* | ₦10,000 | Paid (`#1BA87A`/`#E4F6EF`) |
  | GO | You (Godfrey) | ₦10,000 | Paid |
  | BA | Blessing A. *(high risk)* | ₦10,000 | Late (`#E23D6B`/`#FCE6EC`) |
  | CM | Chidi M. | ₦10,000 | Paid |
  | AK | Aisha K. | ₦10,000 | Paid |
  | EN | Emeka N. | ₦10,000 | Pending (`#E0930F`/`#FCF1DD`) |
  | RI | Ruth I. | ₦10,000 | Paid |
  | SB | Segun B. | ₦10,000 | Paid |
  | JE | Joy E. | ₦10,000 | Pending |
  | DU | Daniel U. | ₦10,000 | Paid |

### 12 · Payout Success
- **Purpose**: Celebration/confirmation after cycle payout. Confetti: small rotated squares/dots scattered (`#E0930F`, `#4B27D4`, `#E23D6B`, `#1BA87A`).
- Centered: 96px `#E4F6EF` halo circle around 64px `#1BA87A` circle with white check.
- **"Payout Successful!"** (22px/800) · **₦100,000** (40px/800, purple, −1px tracking).
- "has been sent to / **Tunde O.** · May 24, 2024 · 6:05 PM".
- White chip (radius 12): "Sent to GTBank ••••1234".
- Buttons: primary **"View Receipt"**; secondary outlined with share icon **"Share with Group"**.

### 13 · Trust Score
- Header: back + **"Your Trust Score"**.
- **Gauge card** (white, radius 22): semicircular SVG arc 230×132, 17px stroke, track `#EDEDF3`, fill = red→amber→green gradient, ~85% sweep (dasharray 292, offset 44). Center: **"720"** (44px/800) + green pill **"Good"** (`#E4F6EF`/`#1BA87A`). Scale caption: "300 · poor → excellent · 850".
- **"What builds your score"** list (icon + label + right rating):
  - checkCircle green — On-time contributions — **Excellent** (green)
  - checkCircle green — Circle participation — **High** (green)
  - clock amber — Account activity — **Fair** (`#E0930F`)
- **"Unlocked for you"** card (`#EDE7FD`, radius 18, sparkle icon, `#3A2596` heading) with white chips (purple text, radius 9): **Micro-loans**, **Early payouts**, **Pay upfront (PartPay)**.
- Bottom CTA: **"How to improve my score"**.

### 14 · AI Risk & Alerts
- Header: back + **"AI Risk & Alerts"**.
- **High-risk banner** (`#FCE6EC`, radius 18): alert icon + **"High Risk Alert"** (`#C62A55` 13.5px/800); body (`#8A3450`): "**Blessing A.** is at high risk of default based on recent payment behaviour."; inner white button (`#C62A55` text): "View member details".
- **Risk gauge card** (white, radius 20): label "Member risk score"; 200×116 arc, `#E0930F` stroke (~65%, dasharray 258 offset 90); center **"65"** (38px/800) + amber pill **"Moderate Risk"** (`#FCF1DD`/`#E0930F`).
- **"AI insights"** list:
  - alert pink — "2 late payments in the last 4 weeks"
  - clock amber — "Reduced account balance pattern detected"
  - sparkle purple — "Probability of default: **68%**"
- Purple info strip (`#EDE7FD`, radius 14): shield + "Backup pool is ready to protect this cycle's payout."
- Bottom CTA: **"Notify group members"**.

### 15 · Choose What to Pay (PartPay)
- Header: back + **"Choose what to pay"**. Sub: "Split any big bill into installments you can afford."
- **Category grid** 2-col (white cards radius 20; 46px radius-14 icon chip; title 14.5px/800; sub 11.5px):
  | Category | Icon | Chip colors | Subtitle |
  |---|---|---|---|
  | Rent | home | `#EDE7FD`/`#4B27D4` | "Pay your house rent" |
  | School Fees | book | `#E7F0FF`/`#2A6FDB` | "Tuition & levies" |
  | Medical Bills | health (plus-cross) | `#FCE6EC`/`#E23D6B` | "Hospital & care" |
  | Products | box | `#FCF1DD`/`#E0930F` | "Phones, appliances" |
  | Business | briefcase | `#E4F6EF`/`#1BA87A` | "POS, inventory" |
  | Other | dots | `#EFEFF4`/`#6B6C7E` | "Any other payment" |
- Bottom CTA: **"Continue"**.

### 16 · Select Payment Model
- Header: back + **"Select payment model"**.
- **Option card A — selected** (white, radius 20, `2px solid #4B27D4`): calendar icon chip purple; **"Pay Gradually"** / "You pay the vendor in installments until complete."; filled radio. Benefits (green checks): "Lower interest", "Longer repayment period", "Builds good payment history".
- **Option card B — unselected** (`1.5px solid #EBEBF1`): wallet icon chip green (`#E4F6EF`/`#1BA87A`); **"CirclePay Pays Upfront"** / "We pay the vendor now; you repay us over time."; empty radio. Bullets: check "Get what you need immediately", check "Spread repayment over time", amber sparkle "**Requires Trust Score 700+**".
- Bottom CTA: **"Continue"**.

### 17 · Plan Dashboard
- Header: back + **"Plan Dashboard"**.
- **Plan card** (white, radius 20): home icon chip purple + **"Rent — 2 Bedroom Apt"** / "Ikeja, Lagos · Pay Gradually". Totals: "Total" **₦600,000** · "Paid" **₦100,000** (green). **Progress bar** 9px, radius 5, track `#EDEDF3`, fill 17% purple gradient. Caption: "17% paid · 11 payments left".
- **Next-payment card** (`#1A1B2E`, radius 18): "Next payment" / **"Jun 24 · ₦50,000"**; right amber pill **"19 days left"** (`#FCF1DD`/`#E0930F`).
- **"Payment schedule"** rows (icon + label + amount + status tag; 1px `#EBEBF1` dividers):
  - checkCircle green — May 24 · Initial — ₦50,000 — **Paid** (green)
  - checkCircle green — May 24 · Month 1 — ₦50,000 — **Paid**
  - clock amber — Jun 24 · Month 2 — ₦50,000 — **Due** (`#E0930F`)
  - clock grey — Jul 24 · Month 3 (text `#8A8B98`) — ₦50,000 — **Upcoming** (`#A6A7B5`)
- Bottom CTA: **"Make Early Payment"**.

### 18 · Campaigns  *(tab: Support)*
- Header: **"Support & Donations"** (19px/800) + bell icon.
- **CTA banner** (gradient 140deg `#5B2EE6→#7C4DFF`, radius 20): **"Create a Support Campaign"** / "Raise funds for what matters" (`#D9CCFF`) + white button "Create Campaign"; right 54px translucent circle with heart icon.
- **Category chips** horizontal row (46px radius-14 chips + 10.5px labels): **Burial** (heart, purple), **Birthday** (gift, amber), **Medical** (health, pink), **Wedding** (star, blue), **More** (dots, grey).
- Section: **"Active Campaigns"** + "See all".
- **Campaign cards** (white, radius 18): 38px initials tile + title/byline + amber "days left"; progress bar 7px purple gradient; footer raised amount (purple/800) vs "{n} supporters":
  1. `CM` **Support Mama Chinedu's Burial** — by Chidi M. — 3 days left — 51% — **₦256,500** — 124 supporters (goal ₦500,000)
  2. `JE` **John's Birthday Support** — by Joy E. — 2 days left — 75% — **₦75,200** — 81 supporters (goal ₦100,000)
  3. `TO` **Help Tunde's Medical Bills** — by Tunde O. — 5 days left — 40% — **₦120,000** — 73 supporters (goal ₦300,000)
- Tab bar, Support active.

### 19 · Campaign Details
- Header: back + **"Campaign Details"** + share icon right.
- Cover image slot 300×150 radius 18: "Campaign cover photo".
- Title 18px/800: **"Support Mama Chinedu's Burial"**. Meta: purple pill **"Burial Support"** (`#EDE7FD`/`#4B27D4`) + "by Chidi M.".
- **Progress card** (white, radius 18): **₦256,500** (24px/800) vs **51%** (purple); "raised of ₦500,000 goal"; 9px gradient bar at 51%; 3 stats: **124** Supporters · **3** Days left · **₦243,500** To go.
- **"About this campaign"**: "Our beloved mother passed on peacefully. We're raising funds to support the burial and related expenses. Any support is deeply appreciated."
- Owner row (white, radius 14): 36px `CM` avatar — **"Chidi M."** / "Campaign owner · Verified" — green checkCircle.
- Buttons: primary **"Donate Now"**; secondary outlined + share icon **"Share Campaign"**.
- *(Bonus mock data available for a donations feed: Joy E. ₦5,000 "2 mins ago"; Emeka N. ₦2,000 "5 mins ago"; Segun B. ₦10,000 "10 mins ago"; Anonymous ₦1,000 "18 mins ago".)*

### 20 · Donate to Campaign
- Header: back + **"Donate to Campaign"**.
- Context row (white, radius 14): `CM` tile — **"Support Mama Chinedu's Burial"** / "by Chidi M.".
- **"Select amount"** — denomination chip grid 3×2 (radius 12, 14px/800): ₦1,000 · **₦5,000 (selected, purple bg white text)** · ₦10,000 · ₦20,000 · ₦50,000 · **Other** (purple text).
- **"Payment method"** radio rows (white, radius 14; selected = `2px solid #4B27D4` + filled radio):
  1. wallet — **CirclePay Wallet** — "Balance ₦98,450.20" — SELECTED
  2. card — **Bank Transfer / Card** — "Pay via bank or debit card"
  3. phone — **USSD** — "Instant offline payment"
  4. mapPin — **Agent Cash Deposit** — "Pay cash at any agent/kiosk"
- Bottom CTA: **"Continue"**.

### 21 · Agent Banking Home
- Header: back + **"Agent Banking"**.
- **ID card** (`#1A1B2E`, radius 22, decorative `rgba(124,77,255,0.28)` 110px circle top-right): "Your CirclePay ID" → **`CPAI-7834-5689`** (22px/800, JetBrains Mono, 1px tracking) + share icon `#7C4DFF`; "Wallet balance" → **₦125,680.50** (24px/800).
- **"Agent services"** 4-col grid (50px radius-15 chips + 10px labels):
  Deposit (arrowDown, green) · Withdraw (arrowUp, pink) · Scratch Card (card, purple) · Transfer (transfer, blue) · Airtime (phone, amber) · Bills (wallet, purple) · Find Agent (mapPin, green) · History (clock, grey).
- **Nearby banner** (`#EDE7FD`, radius 16): 40px `#4B27D4` mapPin tile — **"4 agents near you"** (`#3A2596`) / "Closest 0.2 km · Yaba" — purple chevron.

### 22 · Find Nearby Agents
- Header: back + **"Find Nearby Agents"** + filter icon (purple) right.
- Search bar (white, radius 14): search icon + placeholder "Search location".
- Map image slot 300×158 radius 18 ("Map of nearby agents") with overlaid 30px purple pin marker (3px white border, shadow).
- **Agent rows** (white, radius 16; 42px `#EDE7FD` purple icon tile; right = distance purple + open status):
  1. grid — **Mega Plaza Kiosk** — "12 Herbert Macaulay Way, Yaba" — 0.2 km — **Open** (green)
  2. bank — **Peace & Sons Store** — "20 Allen Avenue, Ikeja" — 1.3 km — **Open**
  3. grid — **Blessing's Point** — "45 Alaba Int'l Market, Ojo" — 2.1 km — **Open**
  4. briefcase — **Tomiwa Ventures** — "7 Computer Village, Ikeja" — 2.8 km — **Closed** (`#E23D6B`)
- Bottom CTA: **"View on Map"**.

### 23 · Redeem Scratch Card
- Header: back + **"Redeem Scratch Card"**. Sub: "Buy a CirclePay card from any agent, scratch it, and enter the serial to fund your wallet instantly."
- **Card visual** (gradient 135deg `#4B27D4→#7C4DFF`, radius 18, translucent 90px circle bottom-right): "CIRCLEPAY SAVINGS CARD" (11px, 1px tracking, `#D9CCFF`) · **₦5,000** (15px/700 JetBrains Mono, 2px tracking) · "Scratch panel below to reveal serial".
- **"Enter serial number"** — 4 mono boxes (radius 12, 16px/800 JetBrains Mono): filled `4821` `9037` (purple border) + two empty `••••` (`#C9CAD6`, `#EBEBF1` border).
- **"Card value"** denomination chips: ₦1,000 · **₦5,000 (selected purple)** · ₦10,000.
- Bottom CTA: **"Add to Wallet"**.

### 24 · Withdraw at Kiosk
- Header: back + **"Withdraw at Kiosk"**. Sub: "Show this one-time code to any CirclePay agent to collect cash."
- **Code card** (`#1A1B2E`, radius 22, centered): "WITHDRAWAL CODE" (11.5px, `#A9AAC0`, 1px tracking) · **`872 641`** (44px/800, JetBrains Mono, 10px letter-spacing) · expiry chip `rgba(226,61,107,0.18)` bg, `#FF9DB6` text, clock icon: **"Expires in 4:52"**.
- **Fee breakdown card** (white, radius 18): Amount **₦20,000.00** · Transaction fee **₦100.00** · divider · **Total deduction ₦20,100.00** (purple, 800).
- Warning banner (`#FCE6EC`, radius 14): alert icon `#C62A55` + "Never share this code with anyone except the agent completing your withdrawal." (`#8A3450`).
- Bottom action (secondary/outlined only): **"Cancel Request"**.

---

## 4. Icon Set (24×24 stroke icons, 1.85px stroke, round caps — Feather-style)

`back` (chevron-left), `chevronRight`, `chevronDown`, `bell`, `eye`, `plus`, `arrowUp`, `arrowDown`, `transfer` (double arrows), `dots` (kebab), `home`, `users`, `heart`, `grid`, `menu`, `check`, `checkCircle`, `shield` (with check), `lock`, `phone`, `mapPin`, `search`, `camera`, `card`, `bank`, `clock`, `share`, `star` (filled), `alert` (triangle), `qr`, `gift`, `filter`, `edit`, `download`, `trophy`, `wallet`, `book`, `health` (plus-cross), `box`, `briefcase`, `calendar`, `faceId`, `key`, `sparkle` (filled). RN equivalent: Feather/Lucide icon set.

## 5. Reusable Component Inventory

- **StatusBar** (46px, "9:41" + signal/wifi/battery; light variant on dark screens).
- **NavHeader** (back chevron + 17px/700 title, optional right icon).
- **GradientBalanceCard** / **DarkCard** (`#1A1B2E`).
- **QuickActionChip** (icon tile + label; translucent-on-gradient or `#EDE7FD` variants).
- **ListRow** (avatar/icon tile + title/subtitle + right slot) — circles, transactions, members, banks, agents, payment methods.
- **StatusPill** (10.5–12px/700, radius 8–9, tinted bg).
- **ProgressBar** (7–9px, `#EDEDF3` track, purple gradient fill).
- **DonutChart** (conic-gradient with white hole + center stat).
- **SemiGauge** (SVG arc, rounded caps, center value + rating pill).
- **CountdownCard** (dark card, `03d : 12h : 45m` pattern).
- **OTP/SerialBoxes** (equal flex boxes, active purple border).
- **PinPad** + **PinDots**.
- **SegmentedControl** (`#EAEAF0` track, white active pill).
- **DenominationChips** (amount grid, purple selected).
- **RadioOptionCard** (2px purple border when selected).
- **Toggle** (40×24).
- **PrimaryButton** / **SecondaryButton** (outlined `#D6D2EE`).
- **TabBar** with raised gradient **ScanFAB**.
- **InfoBanner** (purple `#EDE7FD` / pink `#FCE6EC` variants, icon + copy + optional action/toggle).
