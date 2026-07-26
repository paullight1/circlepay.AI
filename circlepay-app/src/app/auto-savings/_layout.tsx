import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function AutoSavingsLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
