import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../auth/AuthProvider';
import { colors } from '../../theme';

export default function AppLayout() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
