import { Stack } from 'expo-router';

/** Product education: splash → intro carousel. Not authentication. */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />;
}
