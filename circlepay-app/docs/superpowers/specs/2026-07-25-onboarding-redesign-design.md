# Onboarding & Foundation Redesign — Design Spec

**Date:** 2026-07-25
**Phase:** 1 of 3 (Foundation + Onboarding)
**Status:** Approved

## Context

The CirclePay app's first-run experience is a single `welcome.tsx` that merges brand
hero and phone entry, followed by `otp → kyc → secure`. There is no splash animation,
no product education, no human imagery, and no motion vocabulary. Avatars are
initials-on-colour placeholders.

This spec covers Phase 1 only. Phases 2 (app chrome + camera) and 3 (feature-page
refactor) get their own specs.

### Out of scope for Phase 1

- Real camera / `expo-camera` for Scan & Pay and KYC upload — Phase 2
- Header/nav/menu system, profiles in the menu, conditional bottom nav — Phase 2
- Restyling circles / savings / PartPay / support feature pages — Phase 3

Phase 1 touches the four `(tabs)` screens **only** to mount coach marks and attach
refs. It does not restyle them.

## Goals

1. A splash whose animation expresses the product idea, not just brand decoration.
2. Four education screens covering the four pillars, swipeable and skippable.
3. Phone → verify → KYC → PIN restyled into one coherent, oriented flow.
4. Human imagery replacing initials placeholders, degrading safely offline.
5. A reusable motion vocabulary the later phases build on.
6. A welcome modal plus a four-stop coach-mark tour.

## Architecture

### Route structure

```
src/app/
  index.tsx              router only — three-way decision
  (onboarding)/
    _layout.tsx          Stack, headerShown false, back gesture disabled
    splash.tsx           animated brand mark, auto-advances
    intro.tsx            four slides — ONE route, horizontal pager
  (auth)/
    _layout.tsx          unchanged
    phone.tsx            NEW — extracted from welcome.tsx
    otp.tsx              restyled
    kyc.tsx              restyled
    secure.tsx           restyled
    welcome.tsx          DELETED — split into intro.tsx + phone.tsx
```

Education and authentication are separate route groups because they answer separate
questions. "Has this person been taught what CirclePay is?" is permanent. "Is this
person signed in?" is not. Signing out must not replay the carousel.

The four slides are one route, not four. A carousel needs swipe, dots and a shared
progress indicator; four pushed routes would animate as page transitions and break
the gesture. Built on `Animated.ScrollView` with `pagingEnabled` — works on
react-native-web and adds no dependency (`react-native-pager-view` is not installed).

### Store additions

`src/store/types.ts` and `src/store/useStore.ts` gain:

```ts
seenOnboarding: boolean    // carousel completed — survives sign-out
seenWelcome:    boolean    // welcome modal has fired
coachMarksSeen: string[]   // e.g. ['home', 'circles']
```

with actions `setSeenOnboarding`, `setSeenWelcome`, `markCoachMarkSeen`. These are
persisted by the existing zustand `persist` middleware. `resetDemo` clears all three
so **More → Reset Demo Data** returns to a genuine first run.

Routing in `index.tsx`:

| State | Destination |
|---|---|
| `!seenOnboarding` | `/(onboarding)/splash` |
| `seenOnboarding && !onboarded` | `/(auth)/phone` |
| `onboarded` | `/(tabs)` |

### Motion system

New directory `src/ui/motion/`, all built on Reanimated 4.5 (installed, unused).
`babel-preset-expo` 57.0.1 registers the worklets plugin automatically — no
`babel.config.js` required.

| Component | Purpose |
|---|---|
| `BrandMark.tsx` | `site/favicon.svg` geometry ported to `react-native-svg`: gradient ring + orbiting dot. Props `size`, `spin`, `glow` |
| `FadeSlideIn.tsx` | Entrance primitive (opacity + translateY) with a `delay` prop for staggering |
| `PressableScale.tsx` | Scale-to-0.97 tap feedback |
| `Pulse.tsx` | Breathing halo for coach-mark spotlights |
| `Shake.tsx` | Horizontal shake for rejected input |
| `useReducedMotion.ts` | Reads the OS flag; every component above degrades to its static end state |

`useReducedMotion` is a requirement, not a nicety: `PRODUCT.md` commits to full
`prefers-reduced-motion` support.

### Splash choreography

Total ~1.7s:

| Time | Action |
|---|---|
| 0ms | Mark at scale 0.6, opacity 0 |
| 0–400ms | Fade in, spring to scale 1.0 |
| 300–1100ms | Ring rotates 360° — the dot orbits the circle |
| 900–1400ms | "CirclePay AI" wordmark fades up beneath |
| 1400–1700ms | Lockup scales to 1.08 and fades → `replace('/intro')` |

The rotation is the product metaphor: one dot travelling a full circle is one Ajo
payout rotation.

**Native splash.** `app.json` currently points at `splash-icon.png`, which is Expo
template art, and no SVG→PNG tooling exists on this machine. The native splash
becomes solid `#4B27D4` with no image, handing off invisibly to the animated JS
splash. No template art flashes before the brand.

### Imagery

`src/lib/imagery.ts` holds a curated registry of fixed remote URLs:

```ts
export const IMAGERY = {
  introCircles: { uri: '…', blurhash: '…', alt: '…' },
  …
} as const;
```

Fixed URLs beat a random-image API: consistent branding per launch, deterministic
caching, and hand-picked Nigerian/African subjects rather than whatever a random
endpoint returns.

Source is Unsplash direct URLs (`images.unsplash.com/photo-…?w=800&q=80`). The
Unsplash License permits free commercial use without attribution and explicitly
allows hotlinking.

**Every URL must be verified to return HTTP 200 during implementation.** An
unverified ID is a blank hero on slide one.

`<RemoteImage>` wraps `expo-image`:

- `cachePolicy="disk"` — fetched once, then served locally
- `placeholder={{ blurhash }}` — instant colour blur, no layout shift
- `transition={300}` — fades in
- `onError` → local gradient + `BrandMark` fallback, never a broken-image icon

`Avatar` gains an optional `photoUri`. When absent or failed it renders today's
initials, so the initials system becomes the fallback layer rather than being
replaced. The app remains fully functional offline, just less photographic.

**Accepted tradeoff:** first load of each image requires network. This was chosen
over bundling with awareness that it is in tension with the low-bandwidth principle
in `PRODUCT.md`; disk caching and graceful fallback are the mitigations.

### The four slides

| # | Headline | Body | Pillar |
|---|---|---|---|
| 1 | Save together, the way you always have | Ajo, Esusu, Adashi — now automated, transparent, and protected by escrow. | Circles |
| 2 | Split what matters into pieces you can manage | Rent, school fees, medical bills — pay gradually, no stress. | PartPay |
| 3 | When life happens, your community shows up | Raise funds for burials, weddings and emergencies — every naira tracked. | CircleSupport |
| 4 | No smartphone? No bank? Still covered. | Save and cash out at any CirclePay agent or kiosk, with scratch cards. | Agent network |

Layout: `Skip` top-right; hero image ~45% height with 0.5× parallax; headline 29px
extrabold (2 lines max); body 15px (3 lines max); four dots where the active one
widens to a pill; full-width primary button in the bottom third (thumb zone).

Button label is `Next · Next · Next · Get Started`. Horizontal swipe also advances.
Touch targets ≥44pt. Safe-area insets respected top and bottom.

### Auth screens

**`phone.tsx`** (new) inherits the working `+234` prefix field from `welcome.tsx`.
Adds a small static `BrandMark`, headline "What's your number?", and the trust line
"Your number keeps your circles and wallet secure" — relocated from `otp.tsx`,
because reassurance belongs beside the ask.

The current "Already have an account? Log in" link calls the same handler as the
primary button. It is removed rather than shipped as a control that does nothing
distinct.

**`otp.tsx`** keeps its logic (paste-anywhere, backspace-to-previous, resend timer,
the `minWidth: 0` react-native-web input fix). Adds auto-submit on the sixth digit
and a shake on rejection.

**`kyc.tsx`** keeps BVN validation, ID chips, tier `Stepper` and "Skip for now".
Gains human imagery. The upload tile stays simulated in Phase 1; Phase 2's camera
work replaces it.

**`secure.tsx`** keypad logic untouched. Keys gain `PressableScale`, dots pop as they
fill, mismatches shake, the success check springs in.

**Cross-cutting:** a four-step progress bar (`Phone → Verify → KYC → Secure`) on all
four screens.

`expo-haptics` is added for key-press feedback. It is a no-op on web.

### Welcome modal and coach marks

`WelcomeModal` fires once on first Home render after setup: brand mark, "Welcome to
CirclePay, {firstName}", opening balance, then **Join your first circle** (primary)
and **Explore first** (ghost). Sets `seenWelcome`.

`<CoachMark>` renders a dimmed overlay, a spotlight cutout around a target measured
via `measureInWindow` on a ref, a tooltip bubble, and `Got it` / `Skip tour`.

| Tab | Target | Copy |
|---|---|---|
| Home | Scan & Pay FAB | Pay anyone by scanning their code |
| Circles | payout countdown | Your next payout lands here |
| Support | create-campaign CTA | Raise funds for what matters |
| More | Trust Score row | See how your trust score protects you |

The More mark targets Trust Score, not a profile row — profiles in the menu are
Phase 2 and do not exist yet.

## Verification

There is no test suite in this workspace. Verification is:

- `npx tsc --noEmit` passes
- Full manual run: fresh install → splash → four slides (buttons, swipe, and skip)
  → phone → OTP → KYC → PIN → welcome modal → four coach marks → tabs
- Web **and** native — `Modal`, `measureInWindow` and Reanimated all differ on
  react-native-web, which is the Vercel deploy target
- Reduced-motion pass — every animation degrades to a static end state
- Airplane-mode pass — remote images fall back rather than hanging
- Every URL in `imagery.ts` returns HTTP 200
- **More → Reset Demo Data** returns to a genuine first run

## Risks

| Risk | Mitigation |
|---|---|
| Unsplash URLs rot or 404 | Verify at implementation; `onError` fallback means a dead URL degrades rather than breaks |
| Reanimated behaves differently on web | Test both targets; keep animations to transform/opacity only |
| Coach-mark measurement races layout | Measure in `onLayout`, not on mount; skip the mark if measurement returns zero |
| Phase 1 touching tab screens conflicts with Phase 3 | Coach marks attach refs only; no restyling |
