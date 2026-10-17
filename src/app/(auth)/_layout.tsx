import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../auth/AuthProvider';
import { colors } from '../../theme';

export default function AuthLayout() {
  const { session } = useAuth();
  if (session) return <Redirect href="/dashboard" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
