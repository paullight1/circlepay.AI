import { Stack } from 'expo-router';

/** Onboarding & auth flow: welcome → otp → kyc → secure. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
