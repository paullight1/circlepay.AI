import { Redirect } from 'expo-router';

import { useStore } from '@/store/useStore';

/** Entry: onboarded users land on the tabs, everyone else on the welcome flow. */
export default function Index() {
  const onboarded = useStore((s) => s.onboarded);
  return <Redirect href={onboarded ? '/(tabs)' : '/(auth)/welcome'} />;
}
