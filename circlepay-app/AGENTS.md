# CirclePay AI — app conventions

## Expo SDK 57 sharp edges (IMPORTANT)
- expo-router v57 **vendors react-navigation internally**. NEVER import from `@react-navigation/*` (not installed). Use:
  - `import { Stack } from 'expo-router'` / `import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs'`
  - hooks from `'expo-router'`: `useRouter`, `useLocalSearchParams`, `useFocusEffect`
- Routes live in `src/app/` (file-based). Typed routes are ON — `router.push('/circles/create')` etc. New files under `src/app/**` automatically become routes; run nothing to register them.
- TypeScript is strict; `@/*` aliases `src/*`.

## Architecture
- **Theme**: `src/theme/tokens.ts` — `colors`, `gradients`, `radius`, `spacing`, `fonts`, `shadow`, `avatarColor`, `initials`. NEVER hardcode hex colors or font family strings in screens; use tokens.
- **Formatting**: `src/lib/format.ts` — `formatNaira`, `formatDate`, `formatDateTime`, `timeAgo`, `daysUntil`, `countdownTo`, `daysFromNow`, `uid`.
- **State**: `src/store/useStore.ts` (zustand + AsyncStorage persist). All domain types in `src/store/types.ts`, seed data in `src/store/seed.ts`. Screens read via selectors (`useStore((s) => s.circles)`) and mutate ONLY via existing store actions. If you genuinely need a new action, add it to `useStore.ts` keeping the same style (money moves always append a `Transaction`).
- **UI kit**: `src/ui` — `Screen`, `ScreenHeader`, `Card`, `Button`, `Field`, `Chip`, `Avatar`, `AmountText`, `StatusPill` (+`toneFor`), `ProgressBar`, `SectionHeader`, `ListRow` (+`IconBubble` from `@/ui/ListRow`), `CountdownTimer`, `Gauge`, `EmptyState`, `Stepper`. Use these before building bespoke components. Import via `import { Card, Button } from '@/ui'`.
- Icons: `@expo/vector-icons` **Ionicons** only (consistency). Gradients: `expo-linear-gradient`. Charts/gauges: `react-native-svg` (see `src/ui/Gauge.tsx` for the pattern).
- Every screen: wrap in `<Screen>`; pushed screens start with `<ScreenHeader title="…" />`. Dark/gradient hero screens pass `light` to `ScreenHeader` and `backgroundColor` to `Screen`.

## Design
The visual source of truth is `/Users/MAC/Desktop/Desktop/app-projects/circlepay/designs/design-spec.md` (extracted from the HTML mockups). Match its copy, amounts, colors and layout closely. Naira amounts use the mono font via `AmountText`.

## Route map (ownership — do not edit screens outside your feature)
- `(auth)/welcome`, `(auth)/otp`, `(auth)/kyc`, `(auth)/secure` — onboarding
- `(tabs)/index` home · `(tabs)/circles` · `(tabs)/support` · `(tabs)/more` (owned by foundation)
- `wallet/index`, `wallet/add-money`, `wallet/withdraw`, `wallet/transfer`, `wallet/transactions`
- `circles/create`, `circles/link-bank`, `circles/[id]/index` (group dashboard), `circles/[id]/members`, `circles/[id]/payout`
- `trust/score`, `trust/risk`, `trust/notifications`
- `partpay/index`, `partpay/choose`, `partpay/model`, `partpay/details`, `partpay/review`, `partpay/[id]`
- `campaigns/create`, `campaigns/[id]/index`, `campaigns/[id]/donate`, `campaigns/[id]/receipt`
- `agent/index`, `agent/find`, `agent/scratch-card`, `agent/withdraw`
- `scan` (owned by foundation)

## Quality bar
- `npx tsc --noEmit` must pass. No `any` unless unavoidable.
- Simulated flows (OTP, payments) still validate input and update the store so the app feels real end to end.
- Success states: green check circle + confetti-ish accent per the designs; keep animations subtle (`Animated` API is fine).
