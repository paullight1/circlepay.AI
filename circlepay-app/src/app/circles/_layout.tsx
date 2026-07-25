import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function CirclesLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
