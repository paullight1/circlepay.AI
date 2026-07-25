import { Redirect } from 'expo-router';

import { useStore } from '@/store/useStore';

/**
 * Entry router.
 *
 * "Has this person been taught what CirclePay is?" and "is this person signed
 * in?" are separate questions, so they get separate flags. Signing out must not
 * replay the intro carousel.
 */
export default function Index() {
  const seenOnboarding = useStore((s) => s.seenOnboarding);
  const onboarded = useStore((s) => s.onboarded);

  if (!seenOnboarding) return <Redirect href="/(onboarding)/splash" />;
  if (!onboarded) return <Redirect href="/(auth)/phone" />;
  return <Redirect href="/(tabs)" />;
}
