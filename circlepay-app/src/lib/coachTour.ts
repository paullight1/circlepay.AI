/**
 * Product-tour bookkeeping shared by the four tab stops.
 *
 * The tour is a chain of independent marks rather than a wizard: each tab owns
 * its own `<CoachMark>`, shows it the first time that tab is focused and records
 * the key so it never fires again. Nothing here renders — the screens keep the
 * ref to their own target, because only they know what the target is.
 *
 * Ordering rule: the welcome modal comes first. A mark is eligible only once
 * `seenWelcome` is true, so the tour can never talk over the greeting.
 */
import { useCallback } from 'react';

import { useStore } from '@/store/useStore';

/** Every stop on the tour, in the order a new user meets them. */
export const COACH_MARK_KEYS = ['home', 'circles', 'savings', 'more'] as const;

export type CoachMarkKey = (typeof COACH_MARK_KEYS)[number];

interface CoachMarkCopy {
  title: string;
  body: string;
}

export const COACH_MARK_COPY: Record<CoachMarkKey, CoachMarkCopy> = {
  home: { title: 'Scan & Pay', body: 'Pay anyone by scanning their code' },
  circles: { title: 'Next payout', body: 'Your next payout lands here' },
  savings: { title: 'Automated Savings', body: 'Let CirclePay save for you on schedule' },
  more: { title: 'Trust score', body: 'See how your trust score protects you' },
};

export interface CoachMarkStep extends CoachMarkCopy {
  /** Feed straight into `<CoachMark visible>`. */
  visible: boolean;
  /** "Got it" — retires this one mark. */
  onDismiss: () => void;
  /** "Skip tour" — retires every mark, on every tab, at once. */
  onSkipAll: () => void;
}

/**
 * Gate + copy + callbacks for one stop on the tour.
 *
 * @param key    Which stop this is.
 * @param active Whether its screen is actually in front of the user right now.
 *               This matters: a backgrounded tab is still mounted, and a mark
 *               whose target cannot be measured retires itself — so a mark left
 *               "visible" on a hidden tab would silently burn its own key.
 */
export function useCoachMark(key: CoachMarkKey, active: boolean): CoachMarkStep {
  const onboarded = useStore((s) => s.onboarded);
  const seenWelcome = useStore((s) => s.seenWelcome);
  const seen = useStore((s) => s.coachMarksSeen.includes(key));
  const markSeen = useStore((s) => s.markCoachMarkSeen);

  const onDismiss = useCallback(() => markSeen(key), [markSeen, key]);
  const onSkipAll = useCallback(() => {
    for (const k of COACH_MARK_KEYS) markSeen(k);
  }, [markSeen]);

  return {
    ...COACH_MARK_COPY[key],
    visible: active && onboarded && seenWelcome && !seen,
    onDismiss,
    onSkipAll,
  };
}
